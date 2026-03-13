import { Request, Response } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { db } from '../config/firebase';

const nowISO = () => new Date().toISOString();

const ensureRazorpayEnv = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    const err: any = new Error('Razorpay credentials are not configured');
    err.status = 500;
    throw err;
  }
  return { keyId, keySecret };
};

const computeRazorpaySignature = (orderId: string, paymentId: string) => {
  const { keySecret } = ensureRazorpayEnv();
  return crypto
    .createHmac('sha256', keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
};

const createSubscriptionOrderSchema = z.object({
  planId: z.string().min(1),
  receipt: z.string().max(64).optional(),
});

const createAdOrderSchema = z.object({
  slotId: z.string().min(1),
  title: z.string().min(1),
  mediaUrl: z.string().min(1),
  mediaType: z.string().optional(),
  targetUrl: z.string().optional(),
  receipt: z.string().max(64).optional(),
});

const verifyPaymentSchema = z.object({
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

const activateSubscription = async (uid: string, planId: string) => {
  const planDoc = await db.collection('subscriptionPlans').doc(String(planId)).get();
  if (!planDoc.exists) {
    const err: any = new Error('Plan not found');
    err.status = 404;
    throw err;
  }
  const plan = planDoc.data() as any;
  const startsAt = new Date();
  const expiresAt = new Date(
    startsAt.getTime() + Number(plan.durationDays || 30) * 24 * 60 * 60 * 1000,
  );
  await db.collection('users').doc(uid).set(
    {
      subscription: {
        planId: planDoc.id,
        planName: plan.name || '',
        startsAt: startsAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
        status: 'active',
        sidebarColor: plan.sidebarColor || '#111827',
        featureLimits: plan.featureLimits || {},
      },
      updatedAt: nowISO(),
    },
    { merge: true },
  );
};

export const createSellerSubscriptionRazorpayOrder = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { keyId, keySecret } = ensureRazorpayEnv();
    const parsed = createSubscriptionOrderSchema.parse(req.body);

    const planDoc = await db.collection('subscriptionPlans').doc(String(parsed.planId)).get();
    if (!planDoc.exists) return res.status(404).json({ error: 'Plan not found' });
    const plan = planDoc.data() as any;
    if (plan?.active === false) return res.status(400).json({ error: 'Plan is inactive' });

    const amountInInr = Math.max(0, Number(plan.price || 0));
    if (amountInInr <= 0) {
      // Free plan: activate without payment
      await activateSubscription(String(user.uid), String(planDoc.id));
      return res.json({ success: true, free: true, message: 'Subscription activated' });
    }

    const amount = Math.round(amountInInr * 100);
    const receipt =
      parsed.receipt ||
      `sub_${user.uid.slice(0, 8)}_${Date.now().toString().slice(-8)}`.slice(0, 40);
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        currency: 'INR',
        receipt,
        notes: {
          purpose: 'subscription',
          planId: String(planDoc.id),
          uid: String(user.uid),
        },
      }),
    });

    const razorpayOrder = await razorpayResponse.json();
    if (!razorpayResponse.ok) {
      return res.status(502).json({
        error: razorpayOrder?.error?.description || 'Could not create Razorpay order',
      });
    }

    await db.collection('sellerPaymentAttempts').doc(razorpayOrder.id).set({
      id: razorpayOrder.id,
      userId: user.uid,
      purpose: 'subscription',
      planId: planDoc.id,
      amount: Number(razorpayOrder.amount || amount),
      currency: razorpayOrder.currency || 'INR',
      receipt: razorpayOrder.receipt || receipt,
      status: 'created',
      createdAt: nowISO(),
      updatedAt: nowISO(),
      expiresAt: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
    });

    res.status(201).json({ success: true, keyId, order: razorpayOrder });
  } catch (e: any) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.issues });
    res.status(e.status || 500).json({ error: e.message });
  }
};

export const verifySellerSubscriptionRazorpayPayment = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = verifyPaymentSchema.parse(req.body);

    const attemptRef = db.collection('sellerPaymentAttempts').doc(razorpayOrderId);
    const attemptDoc = await attemptRef.get();
    if (!attemptDoc.exists) return res.status(404).json({ error: 'Payment attempt not found' });
    const attempt = attemptDoc.data() as any;
    if (attempt.userId !== user.uid) return res.status(403).json({ error: 'Forbidden' });
    if (attempt.purpose !== 'subscription') return res.status(400).json({ error: 'Invalid payment purpose' });
    if ((attempt.expiresAt || '') < nowISO()) return res.status(400).json({ error: 'Payment attempt expired' });

    const expected = computeRazorpaySignature(razorpayOrderId, razorpayPaymentId);
    if (expected !== razorpaySignature) return res.status(400).json({ error: 'Invalid payment signature' });

    await attemptRef.set(
      {
        status: 'verified',
        razorpayPaymentId,
        razorpaySignature,
        verifiedAt: nowISO(),
        updatedAt: nowISO(),
      },
      { merge: true },
    );

    await activateSubscription(String(user.uid), String(attempt.planId));
    res.json({ success: true, message: 'Subscription activated' });
  } catch (e: any) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.issues });
    res.status(e.status || 500).json({ error: e.message });
  }
};

export const createSellerAdRazorpayOrder = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { keyId, keySecret } = ensureRazorpayEnv();
    const parsed = createAdOrderSchema.parse(req.body);

    const slotDoc = await db.collection('adSlots').doc(String(parsed.slotId)).get();
    if (!slotDoc.exists) return res.status(400).json({ error: 'Invalid ad slot selected' });
    const slot = slotDoc.data() as any;
    if (slot?.active === false) return res.status(400).json({ error: 'Selected ad slot is inactive' });

    const requiredAmountInInr = Math.max(0, Number(slot?.price || 0));
    if (requiredAmountInInr <= 0) {
      return res.status(400).json({ error: 'This ad slot has no price configured' });
    }

    const draftRef = db.collection('adPaymentDrafts').doc();
    await draftRef.set({
      id: draftRef.id,
      uid: user.uid,
      slotId: String(parsed.slotId),
      title: parsed.title,
      mediaUrl: parsed.mediaUrl,
      mediaType: String(parsed.mediaType || 'image'),
      targetUrl: String(parsed.targetUrl || ''),
      requiredAmount: requiredAmountInInr,
      createdAt: nowISO(),
      updatedAt: nowISO(),
    });

    const amount = Math.round(requiredAmountInInr * 100);
    const receipt =
      parsed.receipt ||
      `ad_${user.uid.slice(0, 8)}_${Date.now().toString().slice(-8)}`.slice(0, 40);
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        currency: 'INR',
        receipt,
        notes: {
          purpose: 'ad',
          draftId: String(draftRef.id),
          slotId: String(parsed.slotId),
          uid: String(user.uid),
        },
      }),
    });

    const razorpayOrder = await razorpayResponse.json();
    if (!razorpayResponse.ok) {
      return res.status(502).json({
        error: razorpayOrder?.error?.description || 'Could not create Razorpay order',
      });
    }

    await db.collection('sellerPaymentAttempts').doc(razorpayOrder.id).set({
      id: razorpayOrder.id,
      userId: user.uid,
      purpose: 'ad',
      slotId: String(parsed.slotId),
      draftId: String(draftRef.id),
      amount: Number(razorpayOrder.amount || amount),
      currency: razorpayOrder.currency || 'INR',
      receipt: razorpayOrder.receipt || receipt,
      status: 'created',
      createdAt: nowISO(),
      updatedAt: nowISO(),
      expiresAt: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
    });

    res.status(201).json({ success: true, keyId, order: razorpayOrder });
  } catch (e: any) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.issues });
    res.status(e.status || 500).json({ error: e.message });
  }
};

export const verifySellerAdRazorpayPayment = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = verifyPaymentSchema.parse(req.body);

    const attemptRef = db.collection('sellerPaymentAttempts').doc(razorpayOrderId);
    const attemptDoc = await attemptRef.get();
    if (!attemptDoc.exists) return res.status(404).json({ error: 'Payment attempt not found' });
    const attempt = attemptDoc.data() as any;
    if (attempt.userId !== user.uid) return res.status(403).json({ error: 'Forbidden' });
    if (attempt.purpose !== 'ad') return res.status(400).json({ error: 'Invalid payment purpose' });
    if ((attempt.expiresAt || '') < nowISO()) return res.status(400).json({ error: 'Payment attempt expired' });

    const expected = computeRazorpaySignature(razorpayOrderId, razorpayPaymentId);
    if (expected !== razorpaySignature) return res.status(400).json({ error: 'Invalid payment signature' });

    await attemptRef.set(
      {
        status: 'verified',
        razorpayPaymentId,
        razorpaySignature,
        verifiedAt: nowISO(),
        updatedAt: nowISO(),
      },
      { merge: true },
    );

    const draftId = String(attempt.draftId || '');
    const draftDoc = await db.collection('adPaymentDrafts').doc(draftId).get();
    if (!draftDoc.exists) return res.status(404).json({ error: 'Ad draft not found' });
    const draft = draftDoc.data() as any;
    if (String(draft.uid || '') !== String(user.uid || '')) return res.status(403).json({ error: 'Forbidden' });

    const adRef = db.collection('ads').doc();
    await adRef.set({
      id: adRef.id,
      sellerId: user.uid,
      title: draft.title || 'Seller Ad',
      mediaUrl: draft.mediaUrl || '',
      mediaType: draft.mediaType || 'image',
      targetUrl: draft.targetUrl || '',
      slotId: String(draft.slotId || attempt.slotId || 'home_top'),
      paidAmount: Number(draft.requiredAmount || 0),
      requiredAmount: Number(draft.requiredAmount || 0),
      paymentStatus: 'PAID',
      paymentProvider: 'razorpay',
      paymentRef: String(razorpayPaymentId),
      status: 'PENDING_REVIEW',
      active: false,
      createdAt: nowISO(),
      updatedAt: nowISO(),
    });

    await db.collection('adPaymentDrafts').doc(draftId).delete().catch(() => {});

    res.json({ success: true, message: 'Ad submitted for review', adId: adRef.id });
  } catch (e: any) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.issues });
    res.status(e.status || 500).json({ error: e.message });
  }
};


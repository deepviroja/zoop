import { Request, Response } from 'express';
import { db } from '../config/firebase';
import { z } from 'zod';
import * as admin from 'firebase-admin';
import crypto from 'crypto';
import { sendStockAvailableEmail } from '../services/emailService';

// Validation schemas
const cartItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().min(1)
});

const createOrderSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().int().min(1),
    }),
  ),
  shippingAddress: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    country: z.string(),
    fullName: z.string().optional(),
    phone: z.string().optional(),
  }),
  paymentMethod: z.enum(['cod', 'upi', 'card', 'netbanking']).optional(),
  paymentDetails: z
    .object({
      provider: z.literal('razorpay'),
      razorpayOrderId: z.string().min(1),
      razorpayPaymentId: z.string().min(1),
      razorpaySignature: z.string().min(1),
    })
    .optional(),
  appliedOffer: z
    .object({
      id: z.string().min(1).optional(),
      code: z.string().optional(),
      title: z.string().optional(),
      discountAmount: z.number().min(0).optional(),
      scope: z.enum(['order', 'shipping']).optional(),
    })
    .optional(),
});

const reserveCheckoutSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().int().min(1),
    }),
  ),
  ttlMinutes: z.number().int().min(1).max(30).optional(),
});

const createRazorpayOrderSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().int().min(1),
    }),
  ),
  receipt: z.string().max(64).optional(),
  notes: z.record(z.string()).optional(),
  appliedOffer: z
    .object({
      id: z.string().min(1).optional(),
      code: z.string().optional(),
      title: z.string().optional(),
      discountAmount: z.number().min(0).optional(),
      scope: z.enum(['order', 'shipping']).optional(),
    })
    .optional(),
});

const verifyRazorpayPaymentSchema = z.object({
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

const CHECKOUT_LOCK_DEFAULT_MINUTES = 7;

const nowISO = () => new Date().toISOString();

const lockDocId = (uid: string, productId: string) => `${uid}_${productId}`;

const notifyUser = async (userId: string, payload: Record<string, any>) => {
  const ref = db.collection('notifications').doc();
  await ref.set({
    id: ref.id,
    userId,
    read: false,
    createdAt: nowISO(),
    updatedAt: nowISO(),
    ...payload,
  });
};

const notifyStockWatchersForProduct = async (productId: string) => {
  const productDoc = await db.collection('products').doc(productId).get();
  if (!productDoc.exists) return;
  const product = productDoc.data() as any;
  if (Number(product?.stock || 0) <= 0) return;
  const subs = await db.collection('stockAlerts').where('productId', '==', productId).get();
  if (subs.empty) return;
  const batch = db.batch();
  subs.docs.forEach((sub) => {
    const data = sub.data() as any;
    const nRef = db.collection('notifications').doc();
    batch.set(nRef, {
      id: nRef.id,
      userId: data.userId,
      title: 'Product back in stock',
      message: `${product?.title || 'Product'} is now available.`,
      type: 'stock',
      productId,
      read: false,
      createdAt: nowISO(),
      updatedAt: nowISO(),
    });
    batch.delete(sub.ref);
  });
  await batch.commit();
  await Promise.all(
    subs.docs.map(async (sub) => {
      try {
        const subData = sub.data() as any;
        const userDoc = await db.collection('users').doc(subData.userId).get();
        const email = userDoc.data()?.email;
        if (email) {
          await sendStockAvailableEmail(email, product?.title || 'Product');
        }
      } catch {
        // Keep stock notification non-blocking
      }
    }),
  );
};

const getActiveLocksForProduct = async (
  tx: FirebaseFirestore.Transaction,
  productId: string,
) => {
  // Avoid composite index dependency by filtering expiration in memory.
  const lockQuery = db.collection('checkoutLocks').where('productId', '==', productId);
  const lockSnap = await tx.get(lockQuery);
  return lockSnap.docs
    .map((d) => ({ id: d.id, ...(d.data() as any) }))
    .filter((lock) => (lock.expiresAt || '') > nowISO());
};

const requiredCustomerProfileFields = (userDoc: any) => {
  const missing: string[] = [];
  const displayName = userDoc?.displayName || userDoc?.name;
  const address = userDoc?.address || '';
  const city = userDoc?.city || '';
  const state = userDoc?.state || '';
  const pincode = userDoc?.pincode || '';
  if (!displayName) missing.push('name');
  if (!userDoc?.email) missing.push('email');
  if (!userDoc?.phone) missing.push('phone');
  if (!address) missing.push('address');
  if (!city) missing.push('city');
  if (!state) missing.push('state');
  if (!pincode) missing.push('pincode');
  return missing;
};

const onlinePaymentMethods = new Set(['upi', 'card', 'netbanking']);

const ensureRazorpayEnv = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error('Razorpay credentials are not configured');
  }
  return { keyId, keySecret };
};

const calculateOfferDiscount = (
  offer: any,
  itemSubtotal: number,
  shippingAmount: number,
) => {
  if (!offer || offer.active === false || itemSubtotal < Number(offer.minOrderAmount || 0)) {
    return {
      offerDiscountAmount: 0,
      appliedOffer: null,
    };
  }

  const scope = String(offer.scope || 'order') === 'shipping' ? 'shipping' : 'order';
  const baseAmount = scope === 'shipping' ? shippingAmount : itemSubtotal;
  const rawDiscount =
    String(offer.discountType || 'percent') === 'flat'
      ? Number(offer.discountValue || 0)
      : Math.round((baseAmount * Number(offer.discountValue || 0)) / 100);
  const cappedDiscount = offer.maxDiscountAmount
    ? Math.min(rawDiscount, Number(offer.maxDiscountAmount || 0))
    : rawDiscount;
  const offerDiscountAmount = Math.max(0, Math.min(baseAmount, cappedDiscount));

  return {
    offerDiscountAmount,
    appliedOffer: {
      id: offer.id || '',
      code: offer.code || '',
      title: offer.title || '',
      scope,
      discountAmount: offerDiscountAmount,
    },
  };
};

const calculateOrderAmount = async (
  items: Array<{ productId: string; quantity: number }>,
  appliedOffer?: { id?: string },
) => {
  let subtotal = 0;
  let hasNationalShipping = false;
  const itemsSnapshot: Array<Record<string, any>> = [];
  for (const item of items) {
    const productDoc = await db.collection('products').doc(item.productId).get();
    if (!productDoc.exists) {
      throw new Error(`PRODUCT_NOT_FOUND::${item.productId}`);
    }
    const product = productDoc.data() as any;
    const unitPrice = Number(product?.price || 0);
    const lineSubtotal = unitPrice * item.quantity;
    subtotal += lineSubtotal;
    const shippingType = String(product?.type || '').toLowerCase();
    if (shippingType === 'national') {
      hasNationalShipping = true;
    }
    itemsSnapshot.push({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice,
      subtotal: lineSubtotal,
      title: product?.title || 'Product',
      thumbnailUrl: product?.thumbnailUrl || '',
      shippingType,
    });
  }
  const shipping = hasNationalShipping ? 150 : 0;
  const tax = Math.round(subtotal * 0.05);
  let offerDiscountAmount = 0;
  let resolvedAppliedOffer: any = null;
  if (appliedOffer?.id) {
    const offerDoc = await db.collection('offers').doc(appliedOffer.id).get();
    if (offerDoc.exists) {
      const computed = calculateOfferDiscount(
        { id: offerDoc.id, ...(offerDoc.data() as any) },
        subtotal,
        shipping,
      );
      offerDiscountAmount = computed.offerDiscountAmount;
      resolvedAppliedOffer = computed.appliedOffer;
    }
  }
  const total = Math.max(0, subtotal + shipping + tax - offerDiscountAmount);
  return {
    subtotal,
    shipping,
    tax,
    offerDiscountAmount,
    appliedOffer: resolvedAppliedOffer,
    total,
    itemsSnapshot,
  };
};

const buildItemQuantityMap = (items: Array<{ productId: string; quantity: number }>) => {
  const map = new Map<string, number>();
  items.forEach((item) => {
    map.set(item.productId, (map.get(item.productId) || 0) + Number(item.quantity || 0));
  });
  return map;
};

const doItemsMatchPaymentAttempt = (
  requestedItems: Array<{ productId: string; quantity: number }>,
  paymentItems: Array<{ productId: string; quantity: number }> | undefined,
) => {
  if (!Array.isArray(paymentItems) || paymentItems.length === 0) return false;
  const requestedMap = buildItemQuantityMap(requestedItems);
  const paymentMap = buildItemQuantityMap(paymentItems);
  if (requestedMap.size !== paymentMap.size) return false;
  for (const [productId, quantity] of requestedMap.entries()) {
    if ((paymentMap.get(productId) || 0) !== quantity) return false;
  }
  return true;
};

const computeRazorpaySignature = (orderId: string, paymentId: string) => {
  const { keySecret } = ensureRazorpayEnv();
  return crypto
    .createHmac('sha256', keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
};

const extractReturnWindowDays = (returnPolicy: string | undefined) => {
  const value = String(returnPolicy || "");
  const match = value.match(/(\d{1,3})/);
  if (!match) return 0;
  return Math.max(0, Number(match[1]));
};

export const createRazorpayOrder = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { keyId, keySecret } = ensureRazorpayEnv();
    const parsed = createRazorpayOrderSchema.parse(req.body);
    const pricing = await calculateOrderAmount(parsed.items, parsed.appliedOffer);
    if (pricing.total <= 0) {
      return res.status(400).json({ error: 'Order amount must be greater than 0' });
    }
    const amount = Math.round(pricing.total * 100);
    const receipt =
      parsed.receipt ||
      `zoop_${user.uid.slice(0, 8)}_${Date.now().toString().slice(-8)}`.slice(0, 40);

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
        notes: parsed.notes || {},
      }),
    });

    const razorpayOrder = await razorpayResponse.json();
    if (!razorpayResponse.ok) {
      return res.status(502).json({
        error: razorpayOrder?.error?.description || 'Could not create Razorpay order',
      });
    }

    await db.collection('paymentAttempts').doc(razorpayOrder.id).set({
      id: razorpayOrder.id,
      userId: user.uid,
      provider: 'razorpay',
      amount: Number(razorpayOrder.amount || amount),
      currency: razorpayOrder.currency || 'INR',
      pricing,
      appliedOffer: pricing.appliedOffer,
      items: pricing.itemsSnapshot,
      receipt: razorpayOrder.receipt || receipt,
      status: 'created',
      createdAt: nowISO(),
      updatedAt: nowISO(),
      expiresAt: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
    });

    res.status(201).json({
      success: true,
      keyId,
      pricing,
      order: razorpayOrder,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    if (typeof error?.message === 'string' && error.message.startsWith('PRODUCT_NOT_FOUND::')) {
      return res.status(404).json({ error: 'One or more products no longer exist' });
    }
    res.status(500).json({ error: error.message });
  }
};

export const verifyRazorpayPayment = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } =
      verifyRazorpayPaymentSchema.parse(req.body);

    const paymentAttemptRef = db.collection('paymentAttempts').doc(razorpayOrderId);
    const paymentAttemptDoc = await paymentAttemptRef.get();
    if (!paymentAttemptDoc.exists) {
      return res.status(404).json({ error: 'Payment attempt not found' });
    }
    const paymentAttempt = paymentAttemptDoc.data() as any;
    if (paymentAttempt.userId !== user.uid) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if ((paymentAttempt.expiresAt || '') < nowISO()) {
      return res.status(400).json({ error: 'Payment attempt expired' });
    }

    const expectedSignature = computeRazorpaySignature(razorpayOrderId, razorpayPaymentId);
    const isValid = expectedSignature === razorpaySignature;
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    await paymentAttemptRef.set(
      {
        status: 'verified',
        razorpayPaymentId,
        razorpaySignature,
        verifiedAt: nowISO(),
        updatedAt: nowISO(),
      },
      { merge: true },
    );

    res.json({ success: true, message: 'Payment verified' });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    res.status(500).json({ error: error.message });
  }
};

export const getCart = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const cartRef = db.collection('carts').doc(user.uid);
    const cartDoc = await cartRef.get();

    if (!cartDoc.exists) {
      return res.json({ items: [], total: 0 });
    }

    res.json(cartDoc.data());
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const addToCart = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const itemData = cartItemSchema.parse(req.body);

    // Get product details
    const productDoc = await db.collection('products').doc(itemData.productId).get();
    if (!productDoc.exists) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = productDoc.data();

    // Update cart
    const cartRef = db.collection('carts').doc(user.uid);
    const cartDoc = await cartRef.get();

    let cartData: any = cartDoc.exists ? cartDoc.data() : { items: [], total: 0 };
    if (!cartData) cartData = { items: [], total: 0 }; // Extra safety
    if (!cartData.items) cartData.items = [];
    
    // Check if item already exists
    const existingItemIndex = cartData.items.findIndex((item: any) => item.productId === itemData.productId);
    
    if (existingItemIndex >= 0) {
      cartData.items[existingItemIndex].quantity += itemData.quantity;
    } else {
      cartData.items.push({
        ...itemData,
        title: product?.title || 'Unknown Product',
        price: product?.price || 0,
        thumbnailUrl: product?.thumbnailUrl || ''
      });
    }

    // Recalculate total
    cartData.total = cartData.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    cartData.updatedAt = new Date().toISOString();

    await cartRef.set(cartData);
    res.json({ message: 'Item added to cart', cart: cartData });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    res.status(500).json({ error: error.message });
  }
};

export const removeFromCart = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { productId } = req.params;

    const cartRef = db.collection('carts').doc(user.uid);
    const cartDoc = await cartRef.get();

    if (!cartDoc.exists) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    let cartData: any = cartDoc.data();
    if (cartData && cartData.items) {
        cartData.items = cartData.items.filter((item: any) => item.productId !== productId);
        cartData.total = cartData.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
        cartData.updatedAt = new Date().toISOString();

        await cartRef.set(cartData);
        res.json({ message: 'Item removed from cart', cart: cartData });
    } else {
        res.status(404).json({ error: 'Cart is empty or invalid' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createOrder = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const orderData = createOrderSchema.parse(req.body);

    const userDoc = await db.collection('users').doc(user.uid).get();
    const profileData = userDoc.exists ? userDoc.data() : {};
    const missingFields = requiredCustomerProfileFields(profileData);
    if (missingFields.length > 0) {
      return res.status(400).json({
        error:
          'Please complete your profile before placing an order',
        missingFields,
      });
    }
    const paymentMethod = orderData.paymentMethod || 'cod';
    if (onlinePaymentMethods.has(paymentMethod) && !orderData.paymentDetails) {
      return res.status(400).json({
        error: 'Verified payment details are required for online payment methods',
      });
    }
    if (
      onlinePaymentMethods.has(paymentMethod) &&
      orderData.paymentDetails &&
      orderData.paymentDetails.provider !== 'razorpay'
    ) {
      return res.status(400).json({ error: 'Unsupported payment provider' });
    }

    let paymentAttempt: any = null;
    if (onlinePaymentMethods.has(paymentMethod) && orderData.paymentDetails) {
      const expectedSignature = computeRazorpaySignature(
        orderData.paymentDetails.razorpayOrderId,
        orderData.paymentDetails.razorpayPaymentId,
      );
      if (expectedSignature !== orderData.paymentDetails.razorpaySignature) {
        return res.status(400).json({ error: 'Invalid payment signature' });
      }

      const paymentDoc = await db
        .collection('paymentAttempts')
        .doc(orderData.paymentDetails.razorpayOrderId)
        .get();
      if (!paymentDoc.exists) {
        return res.status(400).json({ error: 'Payment attempt not found' });
      }
      paymentAttempt = paymentDoc.data() as any;
      if (paymentAttempt.userId !== user.uid) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      if (paymentAttempt.status === 'consumed' && paymentAttempt.orderId) {
        const existingOrderDoc = await db.collection('orders').doc(paymentAttempt.orderId).get();
        if (existingOrderDoc.exists) {
          return res.status(200).json({
            message: 'Order already created successfully',
            order: { id: existingOrderDoc.id, ...(existingOrderDoc.data() as any) },
          });
        }
      }
      if ((paymentAttempt.expiresAt || '') < nowISO()) {
        return res.status(400).json({ error: 'Payment attempt expired' });
      }
      if (paymentAttempt.status !== 'verified') {
        return res.status(400).json({ error: 'Payment is not verified' });
      }
      if (
        paymentAttempt.razorpayPaymentId &&
        paymentAttempt.razorpayPaymentId !== orderData.paymentDetails.razorpayPaymentId
      ) {
        return res.status(400).json({ error: 'Payment reference mismatch' });
      }
      if (!doItemsMatchPaymentAttempt(orderData.items, paymentAttempt.items)) {
        return res.status(400).json({
          error: 'Payment items do not match the current order. Please retry checkout.',
        });
      }
    }

    const orderRef = db.collection('orders').doc();
    const order = await db.runTransaction(async (tx) => {
      const sellerIds = new Set<string>();
      let itemSubtotal = 0;
      let hasNationalShipping = false;
      const enrichedItems: any[] = [];
      const paymentItemMap = new Map<string, any>(
        Array.isArray(paymentAttempt?.items)
          ? paymentAttempt.items.map((item: any) => [item.productId, item])
          : [],
      );

      for (const item of orderData.items) {
        const productRef = db.collection('products').doc(item.productId);
        const productDoc = await tx.get(productRef);
        if (!productDoc.exists) {
          throw new Error(`PRODUCT_NOT_FOUND::${item.productId}`);
        }

        const product = productDoc.data() as any;
        const stock = Number(product?.stock || 0);
        if (stock <= 0) {
          throw new Error(`OUT_OF_STOCK::${item.productId}`);
        }

        const activeLocks = await getActiveLocksForProduct(tx, item.productId);
        const reservedByOthers = activeLocks
          .filter((l) => l.userId !== user.uid)
          .reduce((sum, l) => sum + Number(l.quantity || 0), 0);
        const available = Math.max(0, stock - reservedByOthers);
        if (available < item.quantity) {
          throw new Error(`INSUFFICIENT_STOCK::${item.productId}::${available}`);
        }

        tx.update(productRef, {
          stock: admin.firestore.FieldValue.increment(-item.quantity),
          orderedCount: admin.firestore.FieldValue.increment(item.quantity),
          updatedAt: nowISO(),
        });

        const paymentItemSnapshot = paymentItemMap.get(item.productId);
        const unitPrice = Number(
          paymentItemSnapshot?.unitPrice ?? product.price ?? 0,
        );
        const subtotal = unitPrice * item.quantity;
        itemSubtotal += subtotal;
        if (product.sellerId) sellerIds.add(product.sellerId);
        if (
          String(paymentItemSnapshot?.shippingType || product?.type || '').toLowerCase() ===
          'national'
        ) {
          hasNationalShipping = true;
        }

        const returnWindowDays = extractReturnWindowDays(product.returnPolicy);
        enrichedItems.push({
          productId: item.productId,
          sellerId: product.sellerId || '',
          quantity: item.quantity,
          price: unitPrice,
          subtotal,
          title: paymentItemSnapshot?.title || product.title || 'Product',
          thumbnailUrl: paymentItemSnapshot?.thumbnailUrl || product.thumbnailUrl || '',
          status: 'PENDING',
          returnWindowDays,
          returnEligibleUntil: null,
          returnRequest: null,
        });
      }

      let offerDiscountAmount = 0;
      let appliedOffer: any = null;
      let shippingAmount = hasNationalShipping ? 150 : 0;
      let taxAmount = Math.round(itemSubtotal * 0.05);
      if (onlinePaymentMethods.has(paymentMethod) && paymentAttempt?.pricing) {
        shippingAmount = Number(paymentAttempt.pricing.shipping ?? shippingAmount);
        taxAmount = Number(paymentAttempt.pricing.tax ?? taxAmount);
        offerDiscountAmount = Math.max(0, Number(paymentAttempt.pricing.offerDiscountAmount || 0));
        appliedOffer = paymentAttempt.appliedOffer || paymentAttempt.pricing.appliedOffer || null;
      } else if (orderData.appliedOffer?.id) {
        const offerDoc = await tx.get(db.collection('offers').doc(orderData.appliedOffer.id));
        if (offerDoc.exists) {
          const computed = calculateOfferDiscount(
            { id: offerDoc.id, ...(offerDoc.data() as any) },
            itemSubtotal,
            shippingAmount,
          );
          offerDiscountAmount = computed.offerDiscountAmount;
          appliedOffer = computed.appliedOffer;
        }
      }
      const totalAmount = Math.max(
        0,
        Number(
          onlinePaymentMethods.has(paymentMethod) && paymentAttempt?.pricing?.total != null
            ? paymentAttempt.pricing.total
            : itemSubtotal + shippingAmount + taxAmount - offerDiscountAmount,
        ),
      );

      if (onlinePaymentMethods.has(paymentMethod)) {
        const expectedAmount = Math.round(totalAmount * 100);
        const paidAmount = Number(paymentAttempt?.amount || 0);
        if (paidAmount !== expectedAmount) {
          throw new Error(`PAYMENT_AMOUNT_MISMATCH::${expectedAmount}::${paidAmount}`);
        }
      }

      const newOrder = {
        id: orderRef.id,
        userId: user.uid,
        sellerIds: Array.from(sellerIds),
        customer: {
          name: profileData?.displayName || profileData?.name || '',
          email: profileData?.email || '',
          phone: profileData?.phone || '',
        },
        items: enrichedItems,
        itemSubtotal,
        shippingAmount,
        taxAmount,
        offerDiscountAmount,
        appliedOffer,
        totalAmount,
        status: 'pending',
        paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid',
        paymentMethod,
        paymentProviderRef:
          paymentMethod === 'cod'
            ? null
            : {
                provider: 'razorpay',
                orderId: orderData.paymentDetails?.razorpayOrderId,
                paymentId: orderData.paymentDetails?.razorpayPaymentId,
              },
        shippingAddress: orderData.shippingAddress,
        createdAt: nowISO(),
        updatedAt: nowISO(),
      };

      tx.set(orderRef, newOrder);
      return newOrder;
    });

    const lockSnap = await db
      .collection('checkoutLocks')
      .where('userId', '==', user.uid)
      .get();
    const releaseBatch = db.batch();
    lockSnap.docs.forEach((doc) => {
      const data = doc.data() as any;
      if ((data?.expiresAt || '') > nowISO()) {
        releaseBatch.delete(doc.ref);
      }
    });
    releaseBatch.delete(db.collection('carts').doc(user.uid));
    await releaseBatch.commit();

    if (onlinePaymentMethods.has(paymentMethod) && orderData.paymentDetails) {
      await db
        .collection('paymentAttempts')
        .doc(orderData.paymentDetails.razorpayOrderId)
        .set(
          {
            status: 'consumed',
            consumedAt: nowISO(),
            orderId: order.id,
            updatedAt: nowISO(),
          },
          { merge: true },
        );
    }

    await notifyUser(user.uid, {
      title: 'Order placed',
      message: `Your order ${order.id} has been placed successfully.`,
      type: 'order',
      orderId: order.id,
    });
    await Promise.all(
      (order.sellerIds || []).map((sellerId: string) =>
        notifyUser(sellerId, {
          title: 'New order received',
          message: `A new order ${order.id} includes your product(s).`,
          type: 'order',
          orderId: order.id,
        }),
      ),
    );

    res.status(201).json({ message: 'Order created successfully', order });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    if (typeof error?.message === 'string') {
      if (error.message.startsWith('PRODUCT_NOT_FOUND::')) {
        return res.status(404).json({ error: 'One or more products no longer exist' });
      }
      if (
        error.message.startsWith('OUT_OF_STOCK::') ||
        error.message.startsWith('INSUFFICIENT_STOCK::')
      ) {
        const parts = error.message.split('::');
        return res.status(409).json({
          error: 'Some items are currently not available for checkout',
          productId: parts[1],
          availableQty: Number(parts[2] || 0),
        });
      }
      if (error.message.startsWith('PAYMENT_AMOUNT_MISMATCH::')) {
        return res.status(400).json({
          error: 'Payment amount does not match order total. Please retry checkout.',
        });
      }
    }
    res.status(500).json({ error: error.message });
  }
};

const returnRequestSchema = z.object({
  productId: z.string().min(1),
  reason: z.string().trim().min(3).max(400),
});

export const requestOrderReturn = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const parsed = returnRequestSchema.parse(req.body || {});
    const orderRef = db.collection("orders").doc(id);
    const orderDoc = await orderRef.get();
    if (!orderDoc.exists) return res.status(404).json({ error: "Order not found" });
    const order = orderDoc.data() as any;
    if (order.userId !== user.uid) return res.status(403).json({ error: "Forbidden" });
    if (String(order.status || "").toLowerCase() !== "delivered") {
      return res.status(400).json({ error: "Return can be requested after delivery only" });
    }

    const now = Date.now();
    const items = Array.isArray(order.items) ? [...order.items] : [];
    const idx = items.findIndex((i: any) => i.productId === parsed.productId);
    if (idx < 0) return res.status(404).json({ error: "Product not found in order" });
    const item = items[idx] || {};
    const returnUntil = item.returnEligibleUntil ? new Date(item.returnEligibleUntil).getTime() : 0;
    if (!returnUntil || returnUntil < now) {
      return res.status(400).json({ error: "Return window is closed for this item" });
    }
    if (item.returnRequest?.status === "requested") {
      return res.status(409).json({ error: "Return already requested for this item" });
    }

    items[idx] = {
      ...item,
      returnRequest: {
        status: "requested",
        reason: parsed.reason,
        requestedAt: nowISO(),
        updatedAt: nowISO(),
      },
    };
    await orderRef.set({ items, updatedAt: nowISO() }, { merge: true });
    await notifyUser(order.userId, {
      title: "Return request submitted",
      message: `Return request created for order ${id}`,
      type: "return",
      orderId: id,
      productId: parsed.productId,
    });
    const sellerId = item?.sellerId;
    if (sellerId) {
      await notifyUser(sellerId, {
        title: "New return request",
        message: `A buyer requested return on order ${id}`,
        type: "return",
        orderId: id,
        productId: parsed.productId,
      });
    }
    res.status(201).json({ message: "Return request submitted" });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    res.status(500).json({ error: error.message });
  }
};

export const getMyOrders = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const ordersSnapshot = await db.collection('orders')
      .where('userId', '==', user.uid)
      .orderBy('createdAt', 'desc')
      .get();

    const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const doc = await db.collection('orders').doc(id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Order not found' });

    const order = { id: doc.id, ...(doc.data() as any) };
    const isCustomerOwner = order.userId === user.uid;
    const isSellerInvolved = Array.isArray(order.sellerIds)
      ? order.sellerIds.includes(user.uid)
      : (order.items || []).some((it: any) => it.sellerId === user.uid);
    const isAdmin = user.role === 'admin';
    if (!isCustomerOwner && !isSellerInvolved && !isAdmin) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    res.json(order);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const cancelOrder = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const orderRef = db.collection('orders').doc(id);
    const orderDoc = await orderRef.get();
    if (!orderDoc.exists) return res.status(404).json({ error: 'Order not found' });

    const order = { id: orderDoc.id, ...(orderDoc.data() as any) };
    const isCustomerOwner = order.userId === user.uid;
    const isSellerInvolved = Array.isArray(order.sellerIds)
      ? order.sellerIds.includes(user.uid)
      : (order.items || []).some((it: any) => it.sellerId === user.uid);
    const isAdmin = user.role === 'admin';
    if (!isCustomerOwner && !isSellerInvolved && !isAdmin) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (String(order.status || '').toLowerCase() === 'cancelled') {
      return res.json({ message: 'Order already cancelled', order });
    }
    if (String(order.status || '').toLowerCase() === 'delivered') {
      return res.status(400).json({ error: 'Delivered order cannot be cancelled' });
    }

    await db.runTransaction(async (tx) => {
      for (const item of order.items || []) {
        const productRef = db.collection('products').doc(item.productId);
        const productDoc = await tx.get(productRef);
        if (!productDoc.exists) continue;
        tx.update(productRef, {
          stock: admin.firestore.FieldValue.increment(Number(item.quantity || 0)),
          orderedCount: admin.firestore.FieldValue.increment(-Number(item.quantity || 0)),
          updatedAt: nowISO(),
        });
      }
      tx.update(orderRef, {
        status: 'cancelled',
        cancelledAt: nowISO(),
        updatedAt: nowISO(),
      });
    });

    await notifyUser(order.userId, {
      title: 'Order cancelled',
      message: `Order ${id} has been cancelled.`,
      type: 'order',
      orderId: id,
    });
    await Promise.all(
      (order.sellerIds || []).map((sellerId: string) =>
        notifyUser(sellerId, {
          title: 'Order cancelled',
          message: `Order ${id} was cancelled.`,
          type: 'order',
          orderId: id,
        }),
      ),
    );
    await Promise.all((order.items || []).map((it: any) => notifyStockWatchersForProduct(it.productId)));

    const updated = await orderRef.get();
    res.json({ message: 'Order cancelled', order: { id: updated.id, ...(updated.data() as any) } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

const reviewInputSchema = z.object({
  rating: z.number().min(1).max(5),
  title: z.string().trim().max(100).optional(),
  comment: z.string().trim().max(1000).optional(),
});

export const createReviewForOrderItem = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { productId } = req.body || {};
    const parsed = reviewInputSchema.parse({
      rating: Number(req.body?.rating),
      title: req.body?.title,
      comment: req.body?.comment,
    });
    const cleanReviewFields: Record<string, any> = {
      rating: parsed.rating,
    };
    if (parsed.title) cleanReviewFields.title = parsed.title;
    if (parsed.comment) cleanReviewFields.comment = parsed.comment;
    if (!productId) return res.status(400).json({ error: 'productId is required' });

    const orderDoc = await db.collection('orders').doc(id).get();
    if (!orderDoc.exists) return res.status(404).json({ error: 'Order not found' });
    const order = orderDoc.data() as any;
    if (order.userId !== user.uid) return res.status(403).json({ error: 'Forbidden' });
    if (String(order.status || '').toLowerCase() !== 'delivered') {
      return res.status(400).json({ error: 'Reviews are allowed only after delivery' });
    }
    const hasProduct = (order.items || []).some((it: any) => it.productId === productId);
    if (!hasProduct) return res.status(400).json({ error: 'Product is not part of this order' });

    const existing = await db
      .collection('reviews')
      .where('orderId', '==', id)
      .where('productId', '==', productId)
      .where('userId', '==', user.uid)
      .get();
    if (!existing.empty) return res.status(409).json({ error: 'You already reviewed this product for this order' });

    const reviewRef = db.collection('reviews').doc();
    await db.runTransaction(async (tx) => {
      const productRef = db.collection('products').doc(productId);
      const productDoc = await tx.get(productRef);
      if (!productDoc.exists) throw new Error('Product not found');
      const product = productDoc.data() as any;
      const prevRating = Number(product.rating || 0);
      const prevCount = Number(product.ratingCount || 0);
      const nextCount = prevCount + 1;
      const nextRating = Number(((prevRating * prevCount + parsed.rating) / nextCount).toFixed(2));

      tx.set(reviewRef, {
        id: reviewRef.id,
        orderId: id,
        productId,
        userId: user.uid,
        userName: user.displayName || user.name || user.email || 'User',
        ...cleanReviewFields,
        createdAt: nowISO(),
        updatedAt: nowISO(),
      });
      tx.update(productRef, {
        rating: nextRating,
        ratingCount: nextCount,
        updatedAt: nowISO(),
      });
    });

    res.status(201).json({ message: 'Review submitted' });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    res.status(500).json({ error: error.message });
  }
};

export const reserveCheckout = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { items, ttlMinutes } = reserveCheckoutSchema.parse(req.body);
    const userDoc = await db.collection('users').doc(user.uid).get();
    const profileData = userDoc.exists ? userDoc.data() : {};
    const missingFields = requiredCustomerProfileFields(profileData);
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Please complete your profile before checkout',
        missingFields,
      });
    }
    const ttl = ttlMinutes || CHECKOUT_LOCK_DEFAULT_MINUTES;
    const expiresAt = new Date(Date.now() + ttl * 60 * 1000).toISOString();

    const blockedItems: Array<{ productId: string; availableQty: number }> = [];

    await db.runTransaction(async (tx) => {
      for (const item of items) {
        const productRef = db.collection('products').doc(item.productId);
        const productDoc = await tx.get(productRef);
        if (!productDoc.exists) {
          blockedItems.push({ productId: item.productId, availableQty: 0 });
          continue;
        }
        const stock = Number((productDoc.data() as any)?.stock || 0);
        const activeLocks = await getActiveLocksForProduct(tx, item.productId);
        const reservedByOthers = activeLocks
          .filter((l) => l.userId !== user.uid)
          .reduce((sum, l) => sum + Number(l.quantity || 0), 0);
        const availableForThisUser = Math.max(0, stock - reservedByOthers);
        if (availableForThisUser < item.quantity) {
          blockedItems.push({
            productId: item.productId,
            availableQty: availableForThisUser,
          });
          continue;
        }

        const lockRef = db.collection('checkoutLocks').doc(lockDocId(user.uid, item.productId));
        tx.set(
          lockRef,
          {
            userId: user.uid,
            productId: item.productId,
            quantity: item.quantity,
            expiresAt,
            updatedAt: nowISO(),
            createdAt: nowISO(),
          },
          { merge: true },
        );
      }

      if (blockedItems.length > 0) {
        throw new Error(`LOCK_BLOCKED::${JSON.stringify(blockedItems)}`);
      }
    });

    res.json({
      success: true,
      message: `Items reserved for ${ttl} minutes`,
      expiresAt,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    if (typeof error?.message === 'string' && error.message.startsWith('LOCK_BLOCKED::')) {
      const payload = error.message.replace('LOCK_BLOCKED::', '');
      return res.status(409).json({
        error: 'Some products are currently locked by another checkout session',
        blockedItems: JSON.parse(payload || '[]'),
      });
    }
    if (String(error?.message || '').toLowerCase().includes('index')) {
      return res.status(503).json({
        error: 'Checkout is temporarily unavailable. Please retry shortly.',
      });
    }
    res.status(500).json({ error: error.message });
  }
};

export const releaseCheckoutReservation = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const productIds = Array.isArray(req.body?.productIds) ? req.body.productIds : null;
    // Avoid composite index dependency by filtering expiration in memory.
    const query = db.collection('checkoutLocks').where('userId', '==', user.uid);
    const snap = await query.get();

    const batch = db.batch();
    const releasedProductIds: string[] = [];
    snap.docs.forEach((doc) => {
      const data = doc.data() as any;
      if ((data?.expiresAt || '') > nowISO() && (!productIds || productIds.includes(data.productId))) {
        batch.delete(doc.ref);
        if (data.productId) releasedProductIds.push(data.productId);
      }
    });
    await batch.commit();
    await Promise.all(
      [...new Set(releasedProductIds)].map((productId) =>
        notifyStockWatchersForProduct(productId),
      ),
    );
    res.json({ message: 'Checkout reservation released' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

import { Request, Response } from 'express';
import { db } from '../config/firebase';
import { Product } from '../../../../shared/types';
import { productSchema } from '../schemas/validation';
import { z } from 'zod';
import * as admin from 'firebase-admin';
import { sendStockAvailableEmail } from '../services/emailService';

const normalizeCategoryId = (value: any) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const notifyStockSubscribersIfAvailable = async (productId: string, stock: number) => {
  if (Number(stock || 0) <= 0) return;
  const subs = await db.collection('stockAlerts').where('productId', '==', productId).get();
  if (subs.empty) return;
  const productDoc = await db.collection('products').doc(productId).get();
  const product = productDoc.data() as any;
  const batch = db.batch();
  subs.docs.forEach((sub) => {
    const data = sub.data() as any;
    const nRef = db.collection('notifications').doc();
    batch.set(nRef, {
      id: nRef.id,
      userId: data.userId,
      type: 'stock',
      title: 'Product back in stock',
      message: `${product?.title || 'A product'} is now available.`,
      productId,
      read: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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

export const getProducts = async (req: Request, res: Response) => {
  try {
    const { category, minPrice, maxPrice, search, sellerId } = req.query;
    const normalizedCategory = normalizeCategoryId(category);
    
    let query: FirebaseFirestore.Query = db.collection('products');
    
    // Basic Filtering
    if (normalizedCategory) query = query.where('categoryId', '==', normalizedCategory);
    if (sellerId) query = query.where('sellerId', '==', sellerId);
    
    // Note: Firestore requires composite indexes for range filters on different fields
    if (minPrice) query = query.where('price', '>=', Number(minPrice));
    if (maxPrice) query = query.where('price', '<=', Number(maxPrice));
    
    const productsSnapshot = await query.get();
    let products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
    products = products.filter((p: any) => !['rejected', 'removed'].includes((p.moderationStatus || '').toLowerCase()));
    if (!sellerId) {
      const sellerIds = Array.from(
        new Set(
          products
            .map((p: any) => String(p.sellerId || "").trim())
            .filter(Boolean),
        ),
      );
      const sellerProfiles = await Promise.all(
        sellerIds.map((id) => db.collection("users").doc(id).get()),
      );
      const activeSellerMap: Record<string, boolean> = {};
      sellerProfiles.forEach((doc) => {
        if (!doc.exists) return;
        const s = doc.data() as any;
        activeSellerMap[doc.id] = !(
          s?.isDeleted ||
          s?.disabled ||
          s?.status === "banned" ||
          (s?.role === "seller" && s?.verificationStatus && s.verificationStatus !== "approved")
        );
      });
      products = products.filter(
        (p: any) =>
          Number(p.stock || 0) > 0 &&
          Boolean(activeSellerMap[String(p.sellerId || "")]),
      );
    }

    // Manual client-side search (Firestore doesn't support partial text search natively)
    if (search) {
        const searchTerms = String(search).toLowerCase();
        products = products.filter(p => p.title.toLowerCase().includes(searchTerms) || p.description.toLowerCase().includes(searchTerms));
    }
    
    res.json(products);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const doc = await db.collection('products').doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Product not found' });
    }
    const product: any = { id: doc.id, ...doc.data() };
    if (typeof product.orderedCount !== 'number') {
      product.orderedCount = 0;
    }
    if (product.sellerId) {
      const sellerDoc = await db.collection('users').doc(product.sellerId).get();
      if (sellerDoc.exists) {
        const seller = sellerDoc.data() as any;
        const inactive =
          seller?.isDeleted ||
          seller?.disabled ||
          seller?.status === 'banned' ||
          (seller?.role === 'seller' &&
            seller?.verificationStatus &&
            seller?.verificationStatus !== 'approved');
        if (inactive) {
          return res.status(404).json({ error: 'Product not found' });
        }
        product.seller = {
          id: sellerDoc.id,
          name: seller.displayName || seller.name || seller.businessName || 'Seller',
          businessName: seller.businessName || '',
          city: seller.city || '',
          state: seller.state || '',
          phone: seller.phone || '',
          email: seller.email || '',
          photoURL: seller.photoURL || '',
          verificationStatus: seller.verificationStatus || '',
          showPhoneOnProduct:
            seller?.storeSettings?.showPhoneOnProduct ?? seller?.showPhoneOnProduct ?? false,
          showEmailOnProduct:
            seller?.storeSettings?.showEmailOnProduct ?? seller?.showEmailOnProduct ?? false,
          sameDayCutoffHour:
            seller?.storeSettings?.sameDayCutoffHour ?? seller?.sameDayCutoffHour ?? 18,
          sameDayDeliveryWindowHours:
            seller?.storeSettings?.sameDayDeliveryWindowHours ??
            seller?.sameDayDeliveryWindowHours ??
            4,
        };
      }
    }
    res.json(product);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getProductReviews = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const snap = await db.collection('reviews').where('productId', '==', id).get();
    const reviews = snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as any) }))
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    res.json(reviews);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const productData = productSchema.parse(req.body);
    const user = (req as any).user; 
    const userDoc = await db.collection('users').doc(user.uid).get();
    const profile = userDoc.exists ? (userDoc.data() as any) : {};
    const missingSellerFields = [
      'businessName',
      'businessType',
      'panNumber',
      'phone',
      'address',
      'bankName',
      'accountNumber',
      'ifscCode',
      'panCardUrl',
      'cancelledChequeUrl',
    ]
      .filter((f) => !profile?.[f]);
    if (missingSellerFields.length > 0) {
      return res.status(400).json({
        error: 'Please complete your seller profile before publishing products',
        missingFields: missingSellerFields,
      });
    }

    // We need to typecase somewhat loosely or ensure the schema strictly matches the type
    // Zod schema usually has everything except ID and timestamps
    const mrp = Number(productData.mrp ?? productData.price ?? 0);
    const discountPercent = Number(productData.discountPercent ?? 0);
    const computedPrice = Number(
      (mrp * (1 - Math.min(100, Math.max(0, discountPercent)) / 100)).toFixed(2),
    );

    const newProductRef = db.collection('products').doc();
    const normalizedCategoryId = normalizeCategoryId(
      (productData as any).categoryId || (productData as any).category,
    );
    const categoryLabel = String((productData as any).category || (productData as any).categoryId || '')
      .replace(/-/g, ' ')
      .trim();
    const cleanData: Product & Record<string, any> = {
      ...productData,
      id: newProductRef.id,
      sellerId: user.uid, // Use authenticated user's ID
      categoryId: normalizedCategoryId,
      category: categoryLabel
        ? categoryLabel
            .split(' ')
            .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ')
        : (productData as any).category || (productData as any).categoryId || '',
      mrp,
      discountPercent,
      price: computedPrice,
      orderedCount: 0,
      rating: 0,
      ratingCount: 0,
      moderationStatus: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // Ensure optional fields are handled if missing from Zod output but required by Type?
      // Product interface has optionals correctly defined now.
    };

    await newProductRef.set(cleanData);
    await notifyStockSubscribersIfAvailable(newProductRef.id, cleanData.stock);
    res.status(201).json({ id: newProductRef.id, message: 'Product created successfully', product: cleanData });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.issues });
    }
    console.error('Create product error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const user = (req as any).user;

        const docRef = db.collection('products').doc(id);
        const doc = await docRef.get();
        if (!doc.exists) return res.status(404).json({ error: 'Product not found' });
        
        // Authorization: Only owner or admin
        const data = doc.data();
        if (data?.sellerId !== user.uid && ((user as any).role !== 'admin')) {
            return res.status(403).json({ error: 'Unauthorized to edit this product' });
        }
        
        const validUpdates = productSchema.partial().parse(updates);
        const normalizedCategoryId = normalizeCategoryId(
          (validUpdates as any).categoryId ?? (validUpdates as any).category ?? data?.categoryId ?? data?.category,
        );
        const categoryLabelSource = String(
          (validUpdates as any).category ??
            (validUpdates as any).categoryId ??
            data?.category ??
            data?.categoryId ??
            '',
        )
          .replace(/-/g, ' ')
          .trim();
        const mergedMrp = Number(
          validUpdates.mrp ??
          updates.mrp ??
          data?.mrp ??
          validUpdates.price ??
          data?.price ??
          0,
        );
        const mergedDiscount = Number(
          validUpdates.discountPercent ?? data?.discountPercent ?? 0,
        );
        const computedPrice = Number(
          (mergedMrp * (1 - Math.min(100, Math.max(0, mergedDiscount)) / 100)).toFixed(2),
        );
        
        await docRef.update({
            ...validUpdates,
            categoryId: normalizedCategoryId,
            category: categoryLabelSource
              ? categoryLabelSource
                  .split(' ')
                  .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(' ')
              : data?.category || data?.categoryId || '',
            mrp: mergedMrp,
            discountPercent: mergedDiscount,
            price: computedPrice,
            updatedAt: new Date().toISOString()
        });
        await notifyStockSubscribersIfAvailable(id, Number((validUpdates as any).stock ?? data?.stock ?? 0));
        
        res.json({ message: 'Product updated successfully' });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.issues });
        }
        res.status(500).json({ error: error.message });
    }
};

export const deleteProduct = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = (req as any).user;

        const docRef = db.collection('products').doc(id);
        const doc = await docRef.get();
        if (!doc.exists) return res.status(404).json({ error: 'Product not found' });

        // Authorization
        const data = doc.data();
        if (data?.sellerId !== user.uid && ((user as any).role !== 'admin')) {
            return res.status(403).json({ error: 'Unauthorized to delete this product' });
        }

        await docRef.delete();
        res.json({ message: 'Product deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

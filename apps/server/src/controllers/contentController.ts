import { Request, Response } from 'express';
import { db, auth } from '../config/firebase';
import * as admin from 'firebase-admin';
import { sendAccountStatusEmail } from '../services/emailService';
import { isPendingProfile } from '../utils/profileCompletion';

// ─── SEED DATA ────────────────────────────────────────────────────────────────

const SEED_CITIES = [
  { id: 'surat',     name: 'Surat',     state: 'Gujarat',     sameDayActive: true,  nodeLabel: 'Surat Node',     banner: 'Same-Day Delivery active in Surat Node' },
  { id: 'mumbai',    name: 'Mumbai',    state: 'Maharashtra', sameDayActive: true,  nodeLabel: 'Mumbai Node',    banner: 'LIVE IN MUMBAI' },
  { id: 'bangalore', name: 'Bangalore', state: 'Karnataka',   sameDayActive: false, nodeLabel: 'Bangalore Node', banner: 'Coming Soon in Bangalore' },
  { id: 'delhi',     name: 'Delhi',     state: 'Delhi',       sameDayActive: false, nodeLabel: 'Delhi Node',     banner: 'Coming Soon in Delhi' },
  { id: 'jaipur',    name: 'Jaipur',    state: 'Rajasthan',   sameDayActive: false, nodeLabel: 'Jaipur Node',    banner: 'Coming Soon in Jaipur' },
];

const SEED_MARKET_NODES = [
  { id: 'mens-fashion',     label: "Men's Fashion",    icon: '👔', categoryPath: '/category/men' },
  { id: 'artisan-jewelry',  label: 'Artisan Jewelry',  icon: '💍', categoryPath: '/category/artisans' },
  { id: 'home-decor',       label: 'Home Decor',       icon: '🏠', categoryPath: '/category/home' },
  { id: 'organic-wellness', label: 'Organic Wellness',  icon: '🌿', categoryPath: '/products?category=wellness' },
  { id: 'local-footwear',   label: 'Local Footwear',   icon: '👟', categoryPath: '/products?category=footwear' },
];

const SEED_BRANDS = [
  { id: 'nike',    name: 'NIKE',    logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg',    categoryPath: '/products?brand=NIKE' },
  { id: 'adidas',  name: 'ADIDAS',  logo: 'https://upload.wikimedia.org/wikipedia/commons/2/20/Adidas_Logo.svg',  categoryPath: '/products?brand=ADIDAS' },
  { id: 'apple',   name: 'APPLE',   logo: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg', categoryPath: '/products?brand=APPLE' },
  { id: 'samsung', name: 'SAMSUNG', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Samsung_Black_icon.svg/330px-Samsung_Black_icon.svg.png', categoryPath: '/products?brand=SAMSUNG' },
  { id: 'zara',    name: 'ZARA',    logo: 'https://upload.wikimedia.org/wikipedia/commons/f/fd/Zara_Logo.svg',    categoryPath: '/products?brand=ZARA' },
  { id: 'hm',      name: 'H&M',     logo: 'https://upload.wikimedia.org/wikipedia/commons/5/53/H%26M-Logo.svg',  categoryPath: '/products?brand=H%26M' },
  { id: 'puma',    name: 'PUMA',    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/d/da/Puma_complete_logo.svg/500px-Puma_complete_logo.svg.png', categoryPath: '/products?brand=PUMA' },
  { id: 'sony',    name: 'SONY',    logo: 'https://upload.wikimedia.org/wikipedia/commons/c/ca/Sony_logo.svg',    categoryPath: '/products?brand=SONY' },
];

const SEED_HERO_SLIDES = [
  { id: '1', title: "Surat's Silk Heritage", desc: 'Direct from the looms of Textile Market', img: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1200&q=80', city: 'Surat',     active: true, order: 1 },
  { id: '2', title: 'Mumbai Street Style',    desc: 'Trendy oversized tees from Colaba Causeway', img: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=1200&q=80', city: 'Mumbai',    active: true, order: 2 },
  { id: '3', title: "Delhi's Winter Collection", desc: 'Warm woolens from Sarojini Nagar',    img: 'https://images.unsplash.com/photo-1516762689617-e1cffcef479d?w=1200&q=80', city: 'Delhi',     active: true, order: 3 },
  { id: '4', title: 'Jaipur Block Prints',    desc: 'Authentic hand-printed cottons',          img: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1200&q=80', city: 'Jaipur',    active: true, order: 4 },
  { id: '5', title: 'Bangalore Tech Deals',   desc: 'Latest gadgets at best prices',           img: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=1200&q=80', city: 'Bangalore', active: true, order: 5 },
];

const SEED_CATEGORIES = [
  { id: 'men',      name: 'Men',      path: '/category/men',      gradient: 'from-blue-500 to-indigo-600',   bgColor: 'bg-blue-50',   image: '/cat/men.png' },
  { id: 'women',    name: 'Women',    path: '/category/women',    gradient: 'from-pink-500 to-rose-600',     bgColor: 'bg-pink-50',   image: '/cat/women.png' },
  { id: 'kids',     name: 'Kids',     path: '/category/kids',     gradient: 'from-yellow-400 to-orange-500', bgColor: 'bg-orange-50', image: '/cat/kids.png' },
  { id: 'home',     name: 'Home',     path: '/category/home',     gradient: 'from-green-500 to-emerald-600', bgColor: 'bg-green-50',  image: '/cat/home.png' },
  { id: 'artisans', name: 'Artisans', path: '/category/artisans', gradient: 'from-purple-500 to-pink-600',   bgColor: 'bg-purple-50', image: '/cat/artisans.png' },
];

const SEED_COLLECTIONS = [
  { id: 'mens-cruise',    title: "MEN'S CRUISE",    subtitle: 'New Collection',  desc: "Local leathercraft meets modern formal wear. Handcrafted excellence for the modern gentleman.", path: '/category/men',   theme: 'dark',  badge: 'New Collection',  badgeColor: 'blue', order: 1, active: true },
  { id: 'womens-ethnic',  title: "WOMEN'S ETHNIC",  subtitle: 'Artisan Made',    desc: "Direct from Surat's master weavers. Authentic craftsmanship, timeless elegance.",              path: '/category/women', theme: 'light', badge: 'Artisan Made',    badgeColor: 'rose', order: 2, active: true },
];

const SEED_FOOTER_LINKS = [
  { group: 'Shop Zoop',     links: [{ label: 'Men',      href: '/category/men' }, { label: 'Women', href: '/category/women' }, { label: 'Kids', href: '/category/kids' }, { label: 'Electronics', href: '/category/electronics' }, { label: 'Home Decor', href: '/category/home' }] },
  { group: 'Sell With Us',  links: [{ label: 'Become a Seller', href: '/seller/onboarding' }, { label: 'Seller Dashboard', href: '/seller/dashboard' }, { label: 'Seller Policies', href: '/terms' }, { label: 'Support for Sellers', href: '/help' }] },
  { group: 'Support',       links: [{ label: 'Help Center', href: '/help' }, { label: 'Track Order', href: '/track' }, { label: 'Contact Us', href: '/contact' }, { label: 'Privacy Policy', href: '/terms' }, { label: 'Terms & Conditions', href: '/terms' }] },
];

// ─── SEED HELPER ─────────────────────────────────────────────────────────────

async function seedCollection(collectionName: string, items: any[]) {
  const snapshot = await db.collection(collectionName).limit(1).get();
  if (!snapshot.empty) return; // already seeded

  const batch = db.batch();
  for (const item of items) {
    const ref = db.collection(collectionName).doc(item.id || db.collection(collectionName).doc().id);
    batch.set(ref, { ...item, updatedAt: new Date().toISOString() });
  }
  await batch.commit();
  console.log(`✅ Seeded ${collectionName}`);
}

export async function seedContentData() {
  await seedCollection('cities',      SEED_CITIES);
  await seedCollection('marketNodes', SEED_MARKET_NODES);
  await seedCollection('brands',      SEED_BRANDS);
  await seedCollection('heroSlides',  SEED_HERO_SLIDES);
  await seedCollection('categories',  SEED_CATEGORIES);
  await seedCollection('collections', SEED_COLLECTIONS);
  // footer — single doc approach
  const footerSnap = await db.collection('config').doc('footerLinks').get();
  if (!footerSnap.exists) {
    await db.collection('config').doc('footerLinks').set({ groups: SEED_FOOTER_LINKS, updatedAt: new Date().toISOString() });
    console.log('✅ Seeded footerLinks');
  }
}

const DEFAULT_COMMISSION_STRUCTURE = [
  { categoryId: 'all', categoryName: 'Default', commissionPercent: 12, updatedAt: new Date().toISOString() },
];

const normalizeOfferPayload = (payload: any, id: string) => ({
  id,
  title: String(payload?.title || 'Offer').trim(),
  description: String(payload?.description || '').trim(),
  type: String(payload?.type || 'offer') === 'coupon' ? 'coupon' : 'offer',
  discountType: String(payload?.discountType || 'percent') === 'flat' ? 'flat' : 'percent',
  discountValue: Math.max(0, Number(payload?.discountValue || 0)),
  code: String(payload?.code || '').trim().toUpperCase(),
  minOrderAmount: Math.max(0, Number(payload?.minOrderAmount || 0)),
  maxDiscountAmount: Math.max(0, Number(payload?.maxDiscountAmount || 0)),
  scope: String(payload?.scope || 'order') === 'shipping' ? 'shipping' : 'order',
  active: payload?.active !== false,
  createdAt: payload?.createdAt || new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const normalizeCategoryId = (value: any) =>
  String(value || 'all')
    .trim()
    .toLowerCase();

const getCommissionPercentForProduct = (
  product: any,
  structure: Array<{ categoryId?: string; commissionPercent?: number }>,
) => {
  const categoryId = normalizeCategoryId(product?.categoryId || product?.category);
  const exact = structure.find((item) => normalizeCategoryId(item.categoryId) === categoryId);
  if (exact) return Number(exact.commissionPercent || 0);
  const fallback = structure.find((item) => normalizeCategoryId(item.categoryId) === 'all');
  return Number(fallback?.commissionPercent || 0);
};

async function getCommissionStructure() {
  const snap = await db.collection('config').doc('commissionStructure').get();
  const structure = (snap.data()?.items || DEFAULT_COMMISSION_STRUCTURE) as Array<{
    categoryId?: string;
    categoryName?: string;
    commissionPercent?: number;
  }>;
  return structure.length > 0 ? structure : DEFAULT_COMMISSION_STRUCTURE;
}

async function processDueCommissionPayouts() {
  const commissionStructure = await getCommissionStructure();
  const ordersSnap = await db.collection('orders').where('status', '==', 'delivered').get();
  const now = Date.now();
  for (const orderDoc of ordersSnap.docs) {
    const order = orderDoc.data() as any;
    const items = Array.isArray(order.items) ? order.items : [];
    for (const item of items) {
      const payoutKey = `${orderDoc.id}_${item.productId}_${item.sellerId}`;
      const existingPayout = await db.collection('payouts').doc(payoutKey).get();
      if (existingPayout.exists) continue;
      const returnUntilTs = item?.returnEligibleUntil ? new Date(item.returnEligibleUntil).getTime() : 0;
      if (returnUntilTs && returnUntilTs > now) continue;
      if (item?.returnRequest?.status === 'requested' || item?.returnRequest?.status === 'approved') continue;
      const productDoc = await db.collection('products').doc(item.productId).get();
      if (!productDoc.exists) continue;
      const product = productDoc.data() as any;
      const commissionPercent = getCommissionPercentForProduct(product, commissionStructure);
      const grossAmount = Number(item.price || 0) * Number(item.quantity || 0);
      const commissionAmount = Number(((grossAmount * commissionPercent) / 100).toFixed(2));
      const payoutAmount = Number((grossAmount - commissionAmount).toFixed(2));
      if (payoutAmount <= 0) continue;
      await db.collection('payouts').doc(payoutKey).set({
        id: payoutKey,
        orderId: orderDoc.id,
        sellerId: item.sellerId,
        productId: item.productId,
        grossAmount,
        commissionPercent,
        commissionAmount,
        payoutAmount,
        status: 'PENDING_TRANSFER',
        transferRef: '',
        releasedBy: '',
        releasedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }
}

type CommissionRow = {
  id: string;
  orderId: string;
  sellerId: string;
  productId: string;
  grossAmount: number;
  commissionPercent: number;
  commissionAmount: number;
  payoutAmount: number;
  status: string;
  transferRef?: string;
  releasedBy?: string;
  releasedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  availableAt?: string | null;
  holdReason?: string;
  source?: "recorded" | "computed";
};

const buildPayoutCandidate = async (
  orderId: string,
  order: any,
  item: any,
  commissionStructure: Array<{ categoryId?: string; commissionPercent?: number }>,
): Promise<CommissionRow | null> => {
  if (!item?.productId || !item?.sellerId) return null;
  const payoutKey = `${orderId}_${item.productId}_${item.sellerId}`;
  const existingPayout = await db.collection("payouts").doc(payoutKey).get();
  if (existingPayout.exists) {
    return {
      id: payoutKey,
      source: "recorded",
      ...(existingPayout.data() as any),
    } as CommissionRow;
  }

  const productDoc = await db.collection("products").doc(String(item.productId)).get();
  if (!productDoc.exists) return null;
  const product = productDoc.data() as any;
  const commissionPercent = getCommissionPercentForProduct(product, commissionStructure);
  const grossAmount = Number(item.price || 0) * Number(item.quantity || 0);
  const commissionAmount = Number(((grossAmount * commissionPercent) / 100).toFixed(2));
  const payoutAmount = Number((grossAmount - commissionAmount).toFixed(2));
  if (payoutAmount <= 0) return null;

  const returnUntilTs = item?.returnEligibleUntil
    ? new Date(item.returnEligibleUntil).getTime()
    : 0;
  const now = Date.now();
  const returnStatus = String(item?.returnRequest?.status || "").toLowerCase();

  let status = "PENDING_TRANSFER";
  let holdReason = "";
  let availableAt: string | null = null;

  if (returnStatus === "requested" || returnStatus === "approved") {
    status = "ON_HOLD";
    holdReason = "Return request is under review.";
  } else if (returnUntilTs && returnUntilTs > now) {
    status = "AWAITING_SETTLEMENT";
    availableAt = item.returnEligibleUntil;
    holdReason = "Waiting for the return window to end.";
  }

  return {
    id: payoutKey,
    orderId,
    sellerId: String(item.sellerId),
    productId: String(item.productId),
    grossAmount,
    commissionPercent,
    commissionAmount,
    payoutAmount,
    status,
    transferRef: "",
    releasedBy: "",
    releasedAt: null,
    createdAt: order?.deliveredAt || order?.updatedAt || order?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    availableAt,
    holdReason,
    source: "computed",
  };
};

async function getAllPayoutRows() {
  const commissionStructure = await getCommissionStructure();
  const ordersSnap = await db.collection("orders").where("status", "==", "delivered").get();
  const rows = await Promise.all(
    ordersSnap.docs.flatMap((orderDoc) => {
      const order = orderDoc.data() as any;
      const items = Array.isArray(order.items) ? order.items : [];
      return items.map((item) =>
        buildPayoutCandidate(orderDoc.id, order, item, commissionStructure),
      );
    }),
  );
  return rows
    .filter(Boolean)
    .map((row) => row as CommissionRow)
    .sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
    );
}

const summarizePayoutRows = (rows: CommissionRow[]) => ({
  totalGross: rows.reduce((sum, row) => sum + Number(row.grossAmount || 0), 0),
  totalCommission: rows.reduce(
    (sum, row) => sum + Number(row.commissionAmount || 0),
    0,
  ),
  awaitingSettlement: rows
    .filter((row) => row.status === "AWAITING_SETTLEMENT")
    .reduce((sum, row) => sum + Number(row.payoutAmount || 0), 0),
  onHold: rows
    .filter((row) => row.status === "ON_HOLD")
    .reduce((sum, row) => sum + Number(row.payoutAmount || 0), 0),
  pendingTransfer: rows
    .filter((row) => row.status === "PENDING_TRANSFER")
    .reduce((sum, row) => sum + Number(row.payoutAmount || 0), 0),
  transferred: rows
    .filter((row) => row.status === "TRANSFERRED")
    .reduce((sum, row) => sum + Number(row.payoutAmount || 0), 0),
});

const buildDirectory = (items: Array<Record<string, any>>): Record<string, any> =>
  items.reduce<Record<string, any>>((acc, item) => {
    acc[String(item.id || "")] = item;
    return acc;
  }, {});

const buildDisplayOrderId = (id: string) =>
  `#${String(id || "").slice(-8).toUpperCase()}`;

const getAccountStateLabel = (profile: Record<string, any> = {}) => {
  if (
    profile?.isDeleted ||
    profile?.status === 'deleted' ||
    profile?.accountState === 'deleted'
  ) {
    return 'deleted';
  }
  if (
    profile?.disabled ||
    profile?.status === 'banned' ||
    profile?.accountState === 'banned'
  ) {
    return 'banned';
  }
  if (isPendingProfile(profile)) {
    return 'pending';
  }
  return 'active';
};

const enrichOrderRecord = (
  order: Record<string, any>,
  usersById: Record<string, any>,
  productsById: Record<string, any>,
): Record<string, any> => {
  const customerProfile = usersById[String(order.userId || "")] || {};
  const items = Array.isArray(order.items)
    ? order.items.map((item: any) => {
        const product = productsById[String(item.productId || "")] || {};
        const seller = usersById[String(item.sellerId || "")] || {};
        return {
          ...item,
          title: item.title || product.title || product.name || "Product",
          product,
          seller: {
            id: item.sellerId || seller.id || "",
            displayName: seller.displayName || seller.name || "",
            businessName: seller.businessName || "",
            email: seller.email || "",
          },
        };
      })
    : [];

  return {
    ...order,
    displayOrderId: buildDisplayOrderId(String(order.id || "")),
    customer: {
      id: order.userId || "",
      name:
        order.customer?.name ||
        customerProfile.displayName ||
        customerProfile.name ||
        "",
      email: order.customer?.email || customerProfile.email || "",
      phone: order.customer?.phone || customerProfile.phone || "",
    },
    itemCount: items.length,
    primaryProduct: items[0]
      ? {
          id: items[0].productId || "",
          title: items[0].title || "",
        }
      : null,
    sellerSummaries: Array.from(
      new Map(
        items
          .filter((item: any) => item.seller?.id || item.sellerId)
          .map((item: any) => [
            item.seller?.id || item.sellerId,
            {
              id: item.seller?.id || item.sellerId || "",
              displayName: item.seller?.displayName || "",
              businessName: item.seller?.businessName || "",
            },
          ]),
      ).values(),
    ),
    items,
  };
};

const enrichPayoutRows = (
  rows: CommissionRow[],
  usersById: Record<string, any>,
  productsById: Record<string, any>,
  ordersById: Record<string, any>,
): Array<Record<string, any>> =>
  rows.map((row) => {
    const product = productsById[String(row.productId || "")] || {};
    const seller = usersById[String(row.sellerId || "")] || {};
    const order = ordersById[String(row.orderId || "")] || {};
    const customer = usersById[String(order.userId || "")] || {};
    return {
      ...row,
      displayOrderId: buildDisplayOrderId(String(row.orderId || "")),
      productTitle: product.title || product.name || "",
      sellerName: seller.businessName || seller.displayName || seller.name || "",
      customer: {
        id: order.userId || "",
        name:
          order.customer?.name ||
          customer.displayName ||
          customer.name ||
          "",
        email: order.customer?.email || customer.email || "",
      },
    };
  });

// ─── PUBLIC GET ENDPOINTS ────────────────────────────────────────────────────

export const getCities = async (_req: Request, res: Response) => {
  try {
    const snap = await db.collection('cities').orderBy('name').get();
    res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const getMarketNodes = async (_req: Request, res: Response) => {
  try {
    const snap = await db.collection('marketNodes').get();
    res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const getBrands = async (_req: Request, res: Response) => {
  try {
    const snap = await db.collection('brands').get();
    res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const getHeroSlides = async (_req: Request, res: Response) => {
  try {
    // Avoid composite index requirement by fetching all and filtering/sorting in JS
    const snap = await db.collection('heroSlides').get();
    const slides = snap.docs
      .map(d => ({ id: d.id, ...d.data() as any }))
      .filter(s => s.active !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    res.json(slides);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const getCategories = async (_req: Request, res: Response) => {
  try {
    const snap = await db.collection('categories').get();
    res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const getCollections = async (_req: Request, res: Response) => {
  try {
    // Avoid composite index requirement by fetching all and filtering/sorting in JS
    const snap = await db.collection('collections').get();
    const collections = snap.docs
      .map(d => ({ id: d.id, ...d.data() as any }))
      .filter(c => c.active !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    res.json(collections);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const getFooterLinks = async (_req: Request, res: Response) => {
  try {
    const snap = await db.collection('config').doc('footerLinks').get();
    res.json(snap.data() || { groups: SEED_FOOTER_LINKS });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const getSiteConfig = async (_req: Request, res: Response) => {
  try {
    const snap = await db.collection('config').doc('site').get();
    const [categoriesSnap, productsSnap] = await Promise.all([
      db.collection('categories').get(),
      db.collection('products').get(),
    ]);
    const fromCategories = categoriesSnap.docs
      .map((d) => {
        const data = d.data() as any;
        return String(data?.name || d.id || '').trim();
      })
      .filter(Boolean);
    const fromProducts = productsSnap.docs
      .map((d) => {
        const data = d.data() as any;
        return String(data?.category || data?.categoryId || '').replace(/-/g, ' ').trim();
      })
      .filter(Boolean);
    const defaultSubNavCategories = Array.from(new Set([...fromCategories, ...fromProducts]));
    const defaultConfig = {
      sameDayCities: ['Surat', 'Mumbai'],
      maintenanceMode: false,
      maintenanceMessage: 'Zoop is under scheduled maintenance. Please check back shortly.',
      featuredCategoryId: 'men',
      announcementBanner: 'Same-Day Delivery active in Surat!',
      brandName: 'ZOOP',
      brandTextColor: '#b7e84b',
      brandFontFamily: 'inherit',
      brandFontWeight: '900',
      brandLogoUrl: '',
      sellerPanelTitle: 'Seller Panel',
      adminPanelTitle: 'Admin Control',
      customerSidebarCategories: defaultSubNavCategories,
      customerSidebarQuickLinks: [
        { label: 'Your Orders', path: '/history' },
        { label: 'Track Order', path: '/track' },
        { label: 'Wishlist', path: '/wishlist' },
        { label: 'Contact Support', path: '/contact' },
      ],
      homeSameDayCutoffText: 'Order before 6 PM for same-day delivery',
      homeHeroHeadline: 'Discover Local Gems',
      subNavCategories: defaultSubNavCategories,
      updatedAt: new Date().toISOString(),
    };
    const payload = snap.exists ? { ...defaultConfig, ...(snap.data() as any) } : defaultConfig;
    if (!Array.isArray(payload.subNavCategories) || payload.subNavCategories.length === 0) {
      payload.subNavCategories = defaultSubNavCategories;
    }
    res.json(payload);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const getPublicOffers = async (_req: Request, res: Response) => {
  try {
    const snap = await db.collection('offers').get();
    const offers = snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as any) }))
      .filter((offer) => offer.active !== false)
      .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
    res.json(offers);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const getAdminOffers = async (_req: Request, res: Response) => {
  try {
    const snap = await db.collection('offers').get();
    const offers = snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as any) }))
      .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
    res.json(offers);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const upsertOffer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const ref = db.collection('offers').doc(id || db.collection('offers').doc().id);
    const payload = normalizeOfferPayload(req.body, ref.id);
    await ref.set(payload, { merge: true });
    res.json({ message: 'Offer saved', offer: payload });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

// ─── ADMIN CONTENT MANAGEMENT ─────────────────────────────────────────────────

export const updateCity = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    await db.collection('cities').doc(id).update({ ...updates, updatedAt: new Date().toISOString() });
    res.json({ message: 'City updated' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const updateHeroSlide = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    await db.collection('heroSlides').doc(id).update({ ...updates, updatedAt: new Date().toISOString() });
    res.json({ message: 'Hero slide updated' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const updateSiteConfig = async (req: Request, res: Response) => {
  try {
    const updates = req.body;
    await db.collection('config').doc('site').set({ ...updates, updatedAt: new Date().toISOString() }, { merge: true });
    res.json({ message: 'Site config updated' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const createHeroSlide = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const ref = db.collection('heroSlides').doc();
    await ref.set({ ...data, id: ref.id, active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    res.status(201).json({ id: ref.id, message: 'Hero slide created' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const deleteHeroSlide = async (req: Request, res: Response) => {
  try {
    await db.collection('heroSlides').doc(req.params.id).delete();
    res.json({ message: 'Hero slide deleted' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

// ─── ADMIN ANALYTICS ─────────────────────────────────────────────────────────

export const getAdminAnalytics = async (_req: Request, res: Response) => {
  try {
    const range = String(_req.query?.range || 'week').toLowerCase();
    // Run parallel Firestore counts
    const [usersSnap, productsSnap, ordersSnap, sellersSnap] = await Promise.all([
      db.collection('users').get(),
      db.collection('products').get(),
      db.collection('orders').get(),
      db.collection('sellers').get(),
    ]);

    const users = usersSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    const products = productsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    const usersById = buildDirectory(users);
    const productsById = buildDirectory(products);
    const orders = ordersSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
    const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    // Category breakdown from products
    const productsByCategory: Record<string, number> = {};
    products.forEach((d) => {
      const cat = d.category || 'Other';
      productsByCategory[cat] = (productsByCategory[cat] || 0) + 1;
    });
    const categoryStats = Object.entries(productsByCategory).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

    // Recent orders (last 10)
    const recentOrders = orders
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
      .map((o) => {
        const enriched = enrichOrderRecord(o, usersById, productsById);
        return {
          id: o.id,
          displayOrderId: enriched.displayOrderId,
          userId: o.userId,
          customer: enriched.customer,
          status: o.status,
          totalAmount: o.totalAmount,
          createdAt: o.createdAt,
          items: enriched.itemCount,
          primaryProduct: enriched.primaryProduct,
          sellerSummaries: enriched.sellerSummaries,
        };
      });

    // Top sellers by products listed
    const sellerProductCount: Record<string, number> = {};
    productsSnap.docs.forEach(d => {
      const sid = (d.data() as any).sellerId;
      if (sid) sellerProductCount[sid] = (sellerProductCount[sid] || 0) + 1;
    });

    // Order status counts
    const orderStatusCounts: Record<string, number> = {};
    orders.forEach(o => {
      const s = o.status || 'unknown';
      orderStatusCounts[s] = (orderStatusCounts[s] || 0) + 1;
    });
    const now = new Date();
    const toKeyAndLabel = (date: Date) => {
      if (range === 'year') {
        const month = date.getMonth();
        return {
          key: `${date.getFullYear()}-${String(month + 1).padStart(2, '0')}`,
          label: date.toLocaleString('en-US', { month: 'short' }),
        };
      }
      if (range === 'month') {
        const day = date.getDate();
        return {
          key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
          label: String(day),
        };
      }
      return {
        key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
        label: date.toLocaleDateString('en-US', { weekday: 'short' }),
      };
    };
    const buckets: Array<{ key: string; label: string }> = [];
    const seriesMap: Record<string, number> = {};
    if (range === 'year') {
      for (let i = 11; i >= 0; i -= 1) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleString('en-US', { month: 'short' });
        buckets.push({ key, label });
        seriesMap[key] = 0;
      }
    } else if (range === 'month') {
      for (let i = 29; i >= 0; i -= 1) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        buckets.push({ key, label: String(d.getDate()) });
        seriesMap[key] = 0;
      }
    } else {
      for (let i = 6; i >= 0; i -= 1) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        buckets.push({ key, label: d.toLocaleDateString('en-US', { weekday: 'short' }) });
        seriesMap[key] = 0;
      }
    }
    orders.forEach((o) => {
      const createdAt = o.createdAt ? new Date(o.createdAt) : null;
      if (!createdAt || Number.isNaN(createdAt.getTime())) return;
      const { key } = toKeyAndLabel(createdAt);
      if (!(key in seriesMap)) return;
      seriesMap[key] += Number(o.totalAmount || 0);
    });
    const salesSeries = buckets.map((b) => ({
      key: b.key,
      label: b.label,
      value: Number(seriesMap[b.key] || 0),
    }));

    res.json({
      totalUsers: usersSnap.size,
      totalProducts: productsSnap.size,
      totalOrders: ordersSnap.size,
      totalSellers: sellersSnap.size,
      totalRevenue,
      recentOrders,
      categoryStats,
      orderStatusCounts,
      sellerProductCount,
      salesSeries,
      range,
    });
  } catch (e: any) {
    console.error('Analytics error:', e);
    res.status(500).json({ error: e.message });
  }
};

// ─── ADMIN: USER MANAGEMENT ───────────────────────────────────────────────────

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const { role = 'customer', page = '1', limit = '20' } = req.query;
    const [usersSnap, ordersSnap, authUsers] = await Promise.all([
      db.collection('users').get(),
      db.collection('orders').get(),
      auth.listUsers(1000),
    ]);
    const authMetaByUid: Record<string, any> = {};
    (authUsers.users || []).forEach((u) => {
      authMetaByUid[u.uid] = {
        lastSignInTime: u.metadata?.lastSignInTime || null,
      };
    });

    const docs = usersSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    const usersRaw = docs.filter((u) => String((u as any).role || 'customer') === String(role));
    const missingUsersFromAuth = (authUsers.users || [])
      .filter((u) => !docs.some((d: any) => d.id === u.uid))
      .filter((u) => String((u.customClaims as any)?.role || 'customer') === String(role))
      .map((u) => ({
        id: u.uid,
        email: u.email || '',
        displayName: u.displayName || '',
        role: String((u.customClaims as any)?.role || 'customer'),
        hasProfileDocument: false,
        isProfileComplete: false,
        profileMissingFields: ['name', 'phone', 'address', 'city', 'state', 'pincode'],
        status: 'pending',
        accountState: 'pending',
        createdAt: u.metadata?.creationTime || null,
        updatedAt: new Date().toISOString(),
      }));
    const mergedUsers = [...usersRaw, ...missingUsersFromAuth];
    const orders = ordersSnap.docs.map((d) => d.data() as any);

    const metricsByUser: Record<string, any> = {};
    orders.forEach((order) => {
      const uid = order.userId;
      if (!uid) return;
      if (!metricsByUser[uid]) {
        metricsByUser[uid] = {
          totalOrders: 0,
          totalSpent: 0,
          lastOrderAt: null,
        };
      }
      metricsByUser[uid].totalOrders += 1;
      metricsByUser[uid].totalSpent += Number(order.totalAmount || 0);
      if (
        !metricsByUser[uid].lastOrderAt ||
        new Date(order.createdAt || 0).getTime() > new Date(metricsByUser[uid].lastOrderAt).getTime()
      ) {
        metricsByUser[uid].lastOrderAt = order.createdAt || null;
      }
    });

    const users = mergedUsers
      .map((u: any) => {
        const metrics = metricsByUser[u.id] || {};
        const lastLoginAt =
          u.lastLoginAt ||
          u.lastLogin ||
          authMetaByUid[u.id]?.lastSignInTime ||
          null;
        const isActiveNow =
          !!lastLoginAt &&
          Date.now() - new Date(lastLoginAt).getTime() <= 15 * 60 * 1000;
        const accountState = getAccountStateLabel(u);
        return {
          ...u,
          password: undefined,
          joinedAt: u.createdAt || null,
          lastLoginAt,
          isActiveNow,
          totalOrders: metrics.totalOrders || 0,
          totalSpent: metrics.totalSpent || 0,
          lastOrderAt: metrics.lastOrderAt || null,
          accountState,
        };
      })
      .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice((Number(page) - 1) * Number(limit), Number(page) * Number(limit));
    res.json({ users, page: Number(page), limit: Number(limit), role: String(role) });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const getAllSellersDetails = async (_req: Request, res: Response) => {
  try {
    const [usersSnap, productsSnap, ordersSnap, authUsers] = await Promise.all([
      db.collection('users').get(),
      db.collection('products').get(),
      db.collection('orders').get(),
      auth.listUsers(1000),
    ]);
    const authMetaByUid: Record<string, any> = {};
    (authUsers.users || []).forEach((u) => {
      authMetaByUid[u.uid] = {
        lastSignInTime: u.metadata?.lastSignInTime || null,
      };
    });
    const userDocs = usersSnap.docs
      .map((d) => ({ id: d.id, ...(d.data() as any) }));
    const sellers = userDocs
      .filter((u) => String(u.role || '') === 'seller');
    const missingSellersFromAuth = (authUsers.users || [])
      .filter((u) => !userDocs.some((doc: any) => doc.id === u.uid))
      .filter((u) => String((u.customClaims as any)?.role || 'customer') === 'seller')
      .map((u: any) => ({
        id: u.uid,
        email: u.email || '',
        displayName: u.displayName || '',
        role: 'seller',
        verificationStatus: 'pending',
        isProfileComplete: false,
        accountState: 'pending',
        status: 'pending',
        createdAt: u.metadata?.creationTime || null,
        updatedAt: new Date().toISOString(),
      }));
    const products = productsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    const orders = ordersSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));

    const productCountBySeller: Record<string, number> = {};
    const lastProductAtBySeller: Record<string, string | null> = {};
    products.forEach((p: any) => {
      if (!p.sellerId) return;
      productCountBySeller[p.sellerId] = (productCountBySeller[p.sellerId] || 0) + 1;
      if (
        !lastProductAtBySeller[p.sellerId] ||
        new Date(p.createdAt || 0).getTime() >
          new Date(lastProductAtBySeller[p.sellerId] || 0).getTime()
      ) {
        lastProductAtBySeller[p.sellerId] = p.createdAt || null;
      }
    });

    const sellerOrderMetrics: Record<string, any> = {};
    orders.forEach((order: any) => {
      (order.items || []).forEach((item: any) => {
        const sellerId = item.sellerId;
        if (!sellerId) return;
        if (!sellerOrderMetrics[sellerId]) {
          sellerOrderMetrics[sellerId] = {
            totalOrders: 0,
            revenue: 0,
            lastOrderAt: null,
          };
        }
        sellerOrderMetrics[sellerId].totalOrders += 1;
        sellerOrderMetrics[sellerId].revenue += Number(item.price || 0) * Number(item.quantity || 0);
        if (
          !sellerOrderMetrics[sellerId].lastOrderAt ||
          new Date(order.createdAt || 0).getTime() >
            new Date(sellerOrderMetrics[sellerId].lastOrderAt).getTime()
        ) {
          sellerOrderMetrics[sellerId].lastOrderAt = order.createdAt || null;
        }
      });
    });

    const result = [...sellers, ...missingSellersFromAuth].map((s: any) => {
      const metrics = sellerOrderMetrics[s.id] || {};
      const lastLoginAt =
        s.lastLoginAt ||
        s.lastLogin ||
        authMetaByUid[s.id]?.lastSignInTime ||
        null;
      const isActiveNow =
        !!lastLoginAt && Date.now() - new Date(lastLoginAt).getTime() <= 15 * 60 * 1000;
      const accountState = getAccountStateLabel(s);
      return {
        ...s,
        productsCount: productCountBySeller[s.id] || 0,
        lastProductAt: lastProductAtBySeller[s.id] || null,
        totalOrders: metrics.totalOrders || 0,
        totalRevenue: metrics.revenue || 0,
        lastOrderAt: metrics.lastOrderAt || null,
        joinedAt: s.createdAt || null,
        lastLoginAt,
        isActiveNow,
        accountState,
      };
    });

    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const requester = (req as any).user;
    const { uid } = req.params;
    const { role } = req.body;
    if (!['customer', 'seller', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) return res.status(404).json({ error: 'User not found' });
    const target = userDoc.data() as any;
    if (String(target?.email || '').toLowerCase() === 'admin@zoop.com' && role !== 'admin') {
      return res.status(400).json({ error: 'Super admin role cannot be changed' });
    }
    if (role === 'admin' && String(requester?.email || '').toLowerCase() !== 'admin@zoop.com') {
      return res.status(403).json({ error: 'Only super admin can assign admin role' });
    }
    await db.collection('users').doc(uid).update({ role, updatedAt: new Date().toISOString() });
    await auth.setCustomUserClaims(uid, { role });
    res.json({ message: 'User role updated' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const banUser = async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    const { disabled } = req.body;
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    const userData = userDoc.data() as any;
    if (!disabled && (userData?.isDeleted || userData?.status === 'deleted')) {
      return res.status(400).json({ error: 'Deleted accounts cannot be restored from ban controls' });
    }
    await auth.updateUser(uid, { disabled: !!disabled });
    const nextAccountState = disabled
      ? 'banned'
      : getAccountStateLabel({ ...userData, disabled: false });
    await db.collection('users').doc(uid).update({
      disabled: !!disabled,
      status: nextAccountState,
      accountState: nextAccountState,
      updatedAt: new Date().toISOString(),
    });

    if (String(userData?.role || '') === 'seller') {
      const productsSnap = await db.collection('products').where('sellerId', '==', uid).get();
      const batch = db.batch();
      productsSnap.docs.forEach((p) => {
        batch.set(
          p.ref,
          {
            moderationStatus: disabled ? 'removed' : (p.data() as any)?.moderationStatus || 'pending',
            updatedAt: new Date().toISOString(),
          },
          { merge: true },
        );
      });
      await batch.commit();
    }
    if (userData?.email) {
      await sendAccountStatusEmail(
        userData.email,
        disabled ? 'banned' : 'unbanned',
        disabled ? 'Policy or compliance action by marketplace admin' : undefined,
      );
    }
    res.json({ message: `User ${disabled ? 'banned' : 'unbanned'} successfully` });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

// ─── ADMIN: SELLER MANAGEMENT ─────────────────────────────────────────────────

export const getPendingSellers = async (_req: Request, res: Response) => {
  try {
    // sellers with pending verification in 'users' collection
    const snap = await db.collection('users').where('verificationStatus', '==', 'pending').get();
    const sellers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(sellers);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const approveSeller = async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    await db.collection('users').doc(uid).update({
      verificationStatus: 'approved',
      role: 'seller',
      updatedAt: new Date().toISOString(),
    });
    await auth.setCustomUserClaims(uid, { role: 'seller' });
    res.json({ message: 'Seller approved' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const rejectSeller = async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    const { reason } = req.body;
    await db.collection('users').doc(uid).update({
      verificationStatus: 'rejected',
      rejectionReason: reason || 'Does not meet requirements',
      updatedAt: new Date().toISOString(),
    });
    res.json({ message: 'Seller rejected' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

// ─── ADMIN: ALL ORDERS ────────────────────────────────────────────────────────

export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const { status, page = '1', limit = '20' } = req.query;
    const [ordersSnap, usersSnap, productsSnap] = await Promise.all([
      db.collection('orders').get(),
      db.collection('users').get(),
      db.collection('products').get(),
    ]);
    const usersById = buildDirectory(
      usersSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })),
    );
    const productsById = buildDirectory(
      productsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })),
    );
    let orders = ordersSnap.docs
      .map(d => enrichOrderRecord({ id: d.id, ...d.data() as any }, usersById, productsById))
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    if (status) orders = orders.filter(o => o.status === status);
    const paginated = orders.slice((Number(page) - 1) * Number(limit), Number(page) * Number(limit));
    res.json({ orders: paginated, page: Number(page), limit: Number(limit), total: orders.length });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });
    const orderRef = db.collection('orders').doc(id);
    const orderDoc = await orderRef.get();
    if (!orderDoc.exists) return res.status(404).json({ error: 'Order not found' });
    const order = orderDoc.data() as any;

    let nextItems = Array.isArray(order.items) ? [...order.items] : [];
    const deliveredAt = status === 'delivered' ? new Date().toISOString() : order.deliveredAt || null;
    if (status === 'delivered') {
      nextItems = nextItems.map((item: any) => {
        const days = Number(item?.returnWindowDays || 0);
        return {
          ...item,
          status: 'DELIVERED',
          returnEligibleUntil:
            days > 0 ? new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString() : null,
        };
      });
    }
    await orderRef.update({
      status,
      items: nextItems,
      deliveredAt,
      updatedAt: new Date().toISOString(),
    });
    await processDueCommissionPayouts();
    res.json({ message: 'Order status updated' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

// ─── WISHLIST ENDPOINTS ───────────────────────────────────────────────────────

export const getWishlist = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const snap = await db.collection('wishlists').doc(user.uid).get();
    if (!snap.exists) return res.json({ items: [] });
    res.json(snap.data());
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const addToWishlist = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ error: 'productId required' });

    const productDoc = await db.collection('products').doc(productId).get();
    if (!productDoc.exists) return res.status(404).json({ error: 'Product not found' });

    const product = productDoc.data() as any;
    const wishlistRef = db.collection('wishlists').doc(user.uid);
    const wishlistDoc = await wishlistRef.get();
    let data: any = wishlistDoc.exists ? wishlistDoc.data() : { items: [] };
    if (!data) data = { items: [] };
    if (!data.items) data.items = [];

    const alreadyExists = data.items.some((i: any) => i.productId === productId);
    if (!alreadyExists) {
      data.items.push({
        productId,
        title: product.title || product.name || '',
        price: product.price,
        thumbnailUrl: product.thumbnailUrl || product.image || '',
        addedAt: new Date().toISOString(),
      });
      data.updatedAt = new Date().toISOString();
      await wishlistRef.set(data);
    }
    res.json({ message: 'Added to wishlist', wishlist: data });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const removeFromWishlist = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { productId } = req.params;
    const wishlistRef = db.collection('wishlists').doc(user.uid);
    const wishlistDoc = await wishlistRef.get();
    if (!wishlistDoc.exists) return res.status(404).json({ error: 'Wishlist not found' });
    let data: any = wishlistDoc.data();
    if (data && data.items) {
      data.items = data.items.filter((i: any) => i.productId !== productId);
      data.updatedAt = new Date().toISOString();
      await wishlistRef.set(data);
    }
    res.json({ message: 'Removed from wishlist' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

// ─── SELLER: DASHBOARD DATA ───────────────────────────────────────────────────

export const getSellerDashboardData = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const sellerId = user.uid;

    const [productsSnap, ordersSnap, userDoc] = await Promise.all([
      db.collection('products').where('sellerId', '==', sellerId).get(),
      db.collection('orders').get(), // we'll filter client-side since items are embedded
      db.collection('users').doc(sellerId).get(),
    ]);

    const products = productsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Filter orders that contain this seller's products
    const allProductIds = new Set(products.map((p: any) => p.id));
    const allOrders = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));
    const sellerOrders = allOrders.filter(o => o.items?.some((item: any) => allProductIds.has(item.productId)));

    const totalRevenue = sellerOrders.reduce((sum, o) => {
      const sellerItems = o.items?.filter((item: any) => allProductIds.has(item.productId)) || [];
      return sum + sellerItems.reduce((s: number, item: any) => s + (item.price * item.quantity), 0);
    }, 0);

    const pendingOrders = sellerOrders.filter(o => ['pending', 'confirmed', 'processing'].includes(o.status)).length;

    res.json({
      stats: {
        totalProducts: products.length,
        totalOrders: sellerOrders.length,
        totalRevenue,
        pendingOrders,
      },
      products: products.slice(0, 5), // recent 5
      recentOrders: sellerOrders.slice(0, 5),
      profile: userDoc.data(),
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const getSellerOrders = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const sellerId = user.uid;

    const [productsSnap, usersSnap] = await Promise.all([
      db.collection('products').where('sellerId', '==', sellerId).get(),
      db.collection('users').get(),
    ]);
    const products = productsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    const productIds = new Set(products.map((d) => d.id));
    const usersById = buildDirectory(
      usersSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })),
    );
    const productsById = buildDirectory(products);

    const ordersSnap = await db.collection('orders').orderBy('createdAt', 'desc').get();
    const sellerOrders = ordersSnap.docs
      .map(d => enrichOrderRecord({ id: d.id, ...d.data() as any }, usersById, productsById))
      .filter(o => o.items?.some((item: any) => productIds.has(item.productId)));

    res.json(sellerOrders);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const updateSellerOrderStatus = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const orderRef = db.collection('orders').doc(id);
    const orderDoc = await orderRef.get();
    if (!orderDoc.exists) {
      return res.status(404).json({ error: 'Order not found' });
    }
    const order = orderDoc.data() as any;
    const isSellerInvolved =
      (Array.isArray(order.sellerIds) && order.sellerIds.includes(user.uid)) ||
      (order.items || []).some((i: any) => i.sellerId === user.uid);
    if (!isSellerInvolved && user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const deliveredAt = status === 'delivered' ? new Date().toISOString() : order.deliveredAt || null;
    let nextItems = Array.isArray(order.items) ? [...order.items] : [];
    if (status === 'delivered') {
      nextItems = nextItems.map((item: any) => {
        const days = Number(item?.returnWindowDays || 0);
        return {
          ...item,
          status: item.sellerId === user.uid ? 'DELIVERED' : item.status,
          returnEligibleUntil:
            item.sellerId === user.uid
              ? days > 0
                ? new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
                : null
              : item.returnEligibleUntil || null,
        };
      });
    }

    await orderRef.update({ status, items: nextItems, deliveredAt, updatedAt: new Date().toISOString() });
    await processDueCommissionPayouts();
    res.json({ message: 'Order status updated' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

// ─── ADMIN: PRODUCT CURATION ────────────────────────────────────────────────
export const getProductsForCuration = async (_req: Request, res: Response) => {
  try {
    const [productsSnap, usersSnap] = await Promise.all([
      db.collection('products').get(),
      db.collection('users').get(),
    ]);
    const usersById: Record<string, any> = {};
    usersSnap.docs.forEach((d) => {
      usersById[d.id] = { id: d.id, ...(d.data() as any) };
    });
    const products = productsSnap.docs.map((d) => {
      const product = { id: d.id, ...(d.data() as any) };
      const seller = usersById[product.sellerId] || null;
      return {
        ...product,
        seller: seller
          ? {
              id: seller.id,
              displayName: seller.displayName || seller.name || "",
              businessName: seller.businessName || "",
              email: seller.email || "",
              phone: seller.phone || "",
              verificationStatus: seller.verificationStatus || "",
            }
          : null,
      };
    });
    res.json(products);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const updateProductModeration = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { moderationStatus, moderationNote } = req.body || {};
    const allowed = ['pending', 'approved', 'rejected', 'removed'];
    if (!allowed.includes(moderationStatus)) {
      return res.status(400).json({ error: 'Invalid moderation status' });
    }
    await db.collection('products').doc(id).set(
      {
        moderationStatus,
        moderationNote: moderationNote || '',
        moderatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
    res.json({ message: 'Product moderation updated' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

// ─── SUPPORT TICKETS ────────────────────────────────────────────────────────
export const createSupportTicket = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { subject, message, priority, category, contactType, phone, email } = req.body || {};
    if (!subject || !message) {
      return res.status(400).json({ error: 'Subject and message are required' });
    }
    const ref = db.collection('supportTickets').doc();
    const ticket = {
      id: ref.id,
      userId: user.uid,
      role: user.role || 'customer',
      subject: String(subject),
      message: String(message),
      priority: ['low', 'medium', 'high'].includes(priority) ? priority : 'medium',
      category: category || 'General',
      contactType: contactType || 'user',
      phone: phone || '',
      email: email || user.email || '',
      status: 'open',
      replies: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await ref.set(ticket);
    const adminUsers = await db.collection('users').where('role', '==', 'admin').get();
    const batch = db.batch();
    adminUsers.docs.forEach((adminDoc) => {
      const nRef = db.collection('notifications').doc();
      batch.set(nRef, {
        id: nRef.id,
        userId: adminDoc.id,
        title: 'New support ticket',
        message: `Ticket "${ticket.subject}" created by ${ticket.email || 'user'}`,
        type: 'support',
        ticketId: ref.id,
        read: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });
    await batch.commit();
    res.status(201).json({ message: 'Support ticket created', ticket });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const getMySupportTickets = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const snap = await db.collection('supportTickets').where('userId', '==', user.uid).get();
    const tickets = snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as any) }))
      .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
    res.json(tickets);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const getAllSupportTickets = async (_req: Request, res: Response) => {
  try {
    const snap = await db.collection('supportTickets').get();
    const tickets = snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as any) }))
      .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
    res.json(tickets);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const updateSupportTicketStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, reply } = req.body || {};
    const allowed = ['open', 'in-progress', 'resolved', 'closed'];
    if (status && !allowed.includes(status)) {
      return res.status(400).json({ error: 'Invalid ticket status' });
    }
    const docRef = db.collection('supportTickets').doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ error: 'Ticket not found' });
    const data = doc.data() as any;
    const replies = Array.isArray(data.replies) ? data.replies : [];
    if (reply) {
      replies.push({
        message: String(reply),
        by: 'admin',
        at: new Date().toISOString(),
      });
    }
    await docRef.set(
      {
        status: status || data.status || 'open',
        replies,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
    if (reply || status) {
      const nRef = db.collection('notifications').doc();
      await nRef.set({
        id: nRef.id,
        userId: data.userId,
        title: status === 'resolved' ? 'Support ticket resolved' : 'Support ticket updated',
        message: reply
          ? `Support replied on "${data.subject}"`
          : `Status changed to ${status || data.status}`,
        type: 'support',
        ticketId: id,
        read: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    res.json({ message: 'Ticket updated' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const subscribeProductAvailability = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const productId = String(req.body?.productId || '').trim();
    if (!productId) return res.status(400).json({ error: 'productId is required' });
    const ref = db.collection('stockAlerts').doc(`${user.uid}_${productId}`);
    await ref.set(
      {
        id: `${user.uid}_${productId}`,
        userId: user.uid,
        productId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
    res.json({ message: 'You will be notified when product is available' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const getMyNotifications = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const snap = await db.collection('notifications').where('userId', '==', user.uid).get();
    const items = snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as any) }))
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    res.json(items);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const markNotificationRead = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const ref = db.collection('notifications').doc(id);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ error: 'Notification not found' });
    const data = doc.data() as any;
    if (data.userId !== user.uid && user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    await ref.set({ read: true, updatedAt: new Date().toISOString() }, { merge: true });
    res.json({ message: 'Marked as read' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const getMyReviews = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const snap = await db.collection('reviews').where('userId', '==', user.uid).get();
    const items = snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as any) }))
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    res.json(items);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const getCommissionStructureConfig = async (_req: Request, res: Response) => {
  try {
    const structure = await getCommissionStructure();
    res.json({ items: structure });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const updateCommissionStructureConfig = async (req: Request, res: Response) => {
  try {
    const payload = Array.isArray(req.body?.items) ? req.body.items : [];
    const cleaned = payload
      .map((item: any) => ({
        categoryId: normalizeCategoryId(item?.categoryId || item?.category || 'all'),
        categoryName: String(item?.categoryName || item?.category || 'Category'),
        commissionPercent: Math.max(0, Math.min(99, Number(item?.commissionPercent || 0))),
        updatedAt: new Date().toISOString(),
      }))
      .filter((item: any) => !!item.categoryId);
    const finalItems = cleaned.length > 0 ? cleaned : DEFAULT_COMMISSION_STRUCTURE;
    await db.collection('config').doc('commissionStructure').set(
      { items: finalItems, updatedAt: new Date().toISOString() },
      { merge: true },
    );
    res.json({ message: 'Commission structure updated', items: finalItems });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const getMonetizationOverview = async (_req: Request, res: Response) => {
  try {
    await processDueCommissionPayouts();
    const [payouts, ordersSnap, commissionSnap, usersSnap, productsSnap] = await Promise.all([
      getAllPayoutRows(),
      db.collection('orders').get(),
      db.collection('config').doc('commissionStructure').get(),
      db.collection('users').get(),
      db.collection('products').get(),
    ]);
    const orders = ordersSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    const ordersById = buildDirectory(orders);
    const usersById = buildDirectory(
      usersSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })),
    );
    const productsById = buildDirectory(
      productsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })),
    );
    const payoutTotals = summarizePayoutRows(payouts);
    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
    res.json({
      totals: {
        totalRevenue,
        ...payoutTotals,
      },
      commissionStructure: commissionSnap.data()?.items || DEFAULT_COMMISSION_STRUCTURE,
      payouts: enrichPayoutRows(payouts, usersById, productsById, ordersById),
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const getSellerPayouts = async (req: Request, res: Response) => {
  try {
    await processDueCommissionPayouts();
    const user = (req as any).user;
    const [allPayoutRows, usersSnap, productsSnap, ordersSnap] = await Promise.all([
      getAllPayoutRows(),
      db.collection('users').get(),
      db.collection('products').get(),
      db.collection('orders').get(),
    ]);
    const payouts = allPayoutRows.filter(
      (row) => row.sellerId === user.uid,
    );
    const ordersById = buildDirectory(
      ordersSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })),
    );
    const usersById = buildDirectory(
      usersSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })),
    );
    const productsById = buildDirectory(
      productsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })),
    );
    const payoutTotals = summarizePayoutRows(payouts);
    const totals = {
      awaitingSettlement: payoutTotals.awaitingSettlement,
      onHold: payoutTotals.onHold,
      pendingTransfer: payoutTotals.pendingTransfer,
      transferred: payoutTotals.transferred,
      approximateBalance: payouts
        .filter((p) =>
          [
            'AWAITING_SETTLEMENT',
            'ON_HOLD',
            'PENDING_TRANSFER',
            'TRANSFERRED',
          ].includes(p.status),
        )
        .reduce((sum, p) => sum + Number(p.payoutAmount || 0), 0),
    };
    res.json({
      payouts: enrichPayoutRows(payouts, usersById, productsById, ordersById),
      totals,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const releasePayout = async (req: Request, res: Response) => {
  try {
    const adminUser = (req as any).user;
    const { id } = req.params;
    const { transferRef } = req.body || {};
    const ref = db.collection('payouts').doc(id);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ error: 'Payout not found' });
    const payout = doc.data() as any;
    if (payout.status !== 'PENDING_TRANSFER') {
      return res.status(400).json({ error: 'Payout already processed' });
    }
    await ref.set(
      {
        status: 'TRANSFERRED',
        transferRef: String(transferRef || `dummy_razorpay_${Date.now()}`),
        releasedBy: adminUser.uid,
        releasedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
    res.json({ message: 'Payout released' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const updateReturnRequestStatus = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id, productId } = req.params;
    const { status, note } = req.body || {};
    if (!['approved', 'rejected'].includes(String(status || '').toLowerCase())) {
      return res.status(400).json({ error: 'Invalid return status' });
    }
    const orderRef = db.collection('orders').doc(id);
    const orderDoc = await orderRef.get();
    if (!orderDoc.exists) return res.status(404).json({ error: 'Order not found' });
    const order = orderDoc.data() as any;
    const items = Array.isArray(order.items) ? [...order.items] : [];
    const idx = items.findIndex((i: any) => i.productId === productId);
    if (idx < 0) return res.status(404).json({ error: 'Order item not found' });
    const item = items[idx];
    if (user.role === 'seller' && item.sellerId !== user.uid) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    items[idx] = {
      ...item,
      returnRequest: {
        ...(item.returnRequest || {}),
        status: String(status).toLowerCase(),
        note: String(note || ''),
        updatedAt: new Date().toISOString(),
        actionedBy: user.uid,
      },
    };
    await orderRef.set({ items, updatedAt: new Date().toISOString() }, { merge: true });
    res.json({ message: 'Return request updated' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const getAdminAds = async (_req: Request, res: Response) => {
  try {
    const [slotsSnap, adsSnap] = await Promise.all([
      db.collection('adSlots').get(),
      db.collection('ads').get(),
    ]);
    res.json({
      slots: slotsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })),
      ads: adsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })),
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const upsertAdSlot = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const payload = req.body || {};
    const ref = db.collection('adSlots').doc(id || db.collection('adSlots').doc().id);
    await ref.set(
      {
        id: ref.id,
        name: payload.name || ref.id,
        placement: payload.placement || 'home_top',
        price: Math.max(0, Number(payload.price || 0)),
        description: String(payload.description || ''),
        active: payload.active !== false,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
    res.json({ message: 'Ad slot saved', id: ref.id });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const upsertAd = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const payload = req.body || {};
    const ref = db.collection('ads').doc(id || db.collection('ads').doc().id);
    await ref.set(
      {
        id: ref.id,
        sellerId: payload.sellerId || null,
        title: payload.title || 'Ad',
        mediaUrl: payload.mediaUrl || '',
        mediaType: payload.mediaType || 'image',
        targetUrl: payload.targetUrl || '',
        slotId: payload.slotId || 'home_top',
        active: payload.active !== false,
        status: payload.status || 'PUBLISHED',
        startAt: payload.startAt || null,
        endAt: payload.endAt || null,
        updatedAt: new Date().toISOString(),
        createdAt: payload.createdAt || new Date().toISOString(),
      },
      { merge: true },
    );
    res.json({ message: 'Ad saved', id: ref.id });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const getMyAds = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const snap = await db.collection('ads').where('sellerId', '==', user.uid).get();
    res.json(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const createMyAd = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const payload = req.body || {};
    const slotId = String(payload.slotId || 'home_top');
    const slotDoc = await db.collection('adSlots').doc(slotId).get();
    if (!slotDoc.exists) {
      return res.status(400).json({ error: 'Invalid ad slot selected' });
    }
    const slot = slotDoc.data() as any;
    if (slot?.active === false) {
      return res.status(400).json({ error: 'Selected ad slot is inactive' });
    }
    const requiredAmount = Math.max(0, Number(slot?.price || 0));
    const paidAmount = Math.max(0, Number(payload.paidAmount || payload.budget || 0));
    if (paidAmount < requiredAmount) {
      return res.status(400).json({
        error: `Insufficient ad payment. Required: ${requiredAmount}`,
        requiredAmount,
      });
    }
    const ref = db.collection('ads').doc();
    await ref.set({
      id: ref.id,
      sellerId: user.uid,
      title: payload.title || 'Seller Ad',
      mediaUrl: payload.mediaUrl || '',
      mediaType: payload.mediaType || 'image',
      targetUrl: payload.targetUrl || '',
      slotId,
      paidAmount,
      requiredAmount,
      paymentStatus: 'PAID',
      status: 'PENDING_REVIEW',
      active: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    res.status(201).json({ message: 'Ad submitted for review', id: ref.id });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const getPublicAdsBySlot = async (req: Request, res: Response) => {
  try {
    const slotId = String(req.query.slotId || req.params.slotId || 'home_top');
    const now = Date.now();
    const [adsSnap, slotsSnap] = await Promise.all([
      db.collection('ads').where('active', '==', true).get(),
      db.collection('adSlots').get(),
    ]);
    const slotPlacementMap = new Map(
      slotsSnap.docs.map((d) => [d.id, String((d.data() as any)?.placement || d.id)]),
    );
    const items = adsSnap.docs
      .map((d) => ({ id: d.id, ...(d.data() as any) }))
      .filter((ad) => ad.slotId === slotId || slotPlacementMap.get(ad.slotId) === slotId)
      .filter((ad) => {
        const startOk = !ad.startAt || new Date(ad.startAt).getTime() <= now;
        const endOk = !ad.endAt || new Date(ad.endAt).getTime() >= now;
        return startOk && endOk && ad.status === 'PUBLISHED';
      })
      .sort(() => Math.random() - 0.5);
    res.json(items);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

const isSuperAdmin = (user: any) =>
  String(user?.email || '').trim().toLowerCase() === 'admin@zoop.com';

const normalizeEmail = (value: any) =>
  String(value || '').trim().toLowerCase();

const archiveDeletedAccount = async (payload: {
  uid: string;
  email: string;
  role?: string;
  deletedBy?: string;
  source: 'admin';
  reason?: string;
  profile?: Record<string, any> | null;
}) => {
  const email = normalizeEmail(payload.email);
  if (!email) return;
  await db.collection('deleted_accounts').doc(email).set(
    {
      email,
      uid: payload.uid,
      role: payload.role || payload.profile?.role || 'customer',
      deletedAt: new Date().toISOString(),
      deletedBy: payload.deletedBy || null,
      source: payload.source,
      reason: payload.reason || null,
      profileSnapshot: payload.profile || null,
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );
};

const removeFirebaseUserIfPresent = async (uid: string) => {
  if (!uid) return;
  try {
    await auth.deleteUser(uid);
  } catch (error: any) {
    if (String(error?.code || '') !== 'auth/user-not-found') {
      throw error;
    }
  }
};

const deleteCollectionInBatches = async (collectionName: string, batchSize = 100) => {
  while (true) {
    const snap = await db.collection(collectionName).limit(batchSize).get();
    if (snap.empty) break;
    const batch = db.batch();
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    if (snap.size < batchSize) break;
  }
};

export const getSellerAdSlots = async (_req: Request, res: Response) => {
  try {
    const snap = await db.collection('adSlots').where('active', '==', true).get();
    const slots = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    res.json(slots);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const clearAdminActivities = async (req: Request, res: Response) => {
  try {
    const requester = (req as any).user;
    if (!isSuperAdmin(requester)) {
      return res.status(403).json({ error: 'Only super admin can clear admin activities' });
    }
    const adminUsersSnap = await db.collection('users').where('role', '==', 'admin').get();
    const adminIds = new Set(adminUsersSnap.docs.map((d) => d.id));
    const notificationsSnap = await db.collection('notifications').get();
    const toDelete = notificationsSnap.docs.filter((d) => adminIds.has(String((d.data() as any).userId || '')));
    for (let i = 0; i < toDelete.length; i += 100) {
      const chunk = toDelete.slice(i, i + 100);
      const batch = db.batch();
      chunk.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
    res.json({ message: 'Admin activity feed cleared', deleted: toDelete.length });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const superAdminDeleteAllProducts = async (req: Request, res: Response) => {
  try {
    const requester = (req as any).user;
    if (!isSuperAdmin(requester)) {
      return res.status(403).json({ error: 'Only super admin can delete all products' });
    }
    await deleteCollectionInBatches('products');
    res.json({ message: 'All products deleted' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const superAdminDeleteUsersByRole = async (req: Request, res: Response) => {
  try {
    const requester = (req as any).user;
    if (!isSuperAdmin(requester)) {
      return res.status(403).json({ error: 'Only super admin can delete user records' });
    }
    const role = String(req.body?.role || 'all').toLowerCase();
    const allowedRoles = new Set(['all', 'customer', 'seller', 'admin']);
    if (!allowedRoles.has(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    const usersSnap = await db.collection('users').get();
    const targets = usersSnap.docs.filter((d) => {
      const data = d.data() as any;
      const userRole = String(data?.role || 'customer').toLowerCase();
      const email = String(data?.email || '').toLowerCase();
      if (email === 'admin@zoop.com') return false;
      return role === 'all' ? true : userRole === role;
    });
    const deletedAt = new Date().toISOString();
    for (let i = 0; i < targets.length; i += 100) {
      const chunk = targets.slice(i, i + 100);
      const batch = db.batch();
      chunk.forEach((doc) => {
        const data = doc.data() as any;
        batch.set(
          doc.ref,
          {
            isDeleted: true,
            status: 'deleted',
            disabled: true,
            deletedAt,
            updatedAt: deletedAt,
          },
          { merge: true },
        );
        if (String(data?.role || '').toLowerCase() === 'seller') {
          batch.set(
            db.collection('users').doc(doc.id),
            {
              verificationStatus: 'deleted',
            },
            { merge: true },
          );
        }
      });
      await batch.commit();
      await Promise.all(
        chunk.map(async (doc) => {
          const data = doc.data() as any;
          if (String(data?.role || '').toLowerCase() === 'seller') {
            const productsSnap = await db.collection('products').where('sellerId', '==', doc.id).get();
            if (!productsSnap.empty) {
              const productsBatch = db.batch();
              productsSnap.docs.forEach((productDoc) => {
                productsBatch.set(
                  productDoc.ref,
                  {
                    moderationStatus: 'removed',
                    updatedAt: deletedAt,
                  },
                  { merge: true },
                );
              });
              await productsBatch.commit();
            }
          }
          await Promise.all([
            archiveDeletedAccount({
              uid: doc.id,
              email: data?.email || '',
              role: data?.role || 'customer',
              deletedBy: requester?.uid,
              source: 'admin',
              reason: `Admin deleted account via reset for role=${role}`,
              profile: data,
            }),
            db.collection('pending_users')
              .doc(normalizeEmail(data?.email))
              .delete()
              .catch(() => {}),
            removeFirebaseUserIfPresent(doc.id),
          ]);
        }),
      );
    }
    res.json({ message: 'User records updated as deleted', affected: targets.length, role });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const superAdminResetWeb = async (req: Request, res: Response) => {
  try {
    const requester = (req as any).user;
    if (!isSuperAdmin(requester)) {
      return res.status(403).json({ error: 'Only super admin can reset web data' });
    }
    const collections = [
      'products',
      'orders',
      'ads',
      'adSlots',
      'wishlists',
      'notifications',
      'supportTickets',
      'stockAlerts',
      'reviews',
      'payouts',
    ];
    for (const name of collections) {
      await deleteCollectionInBatches(name);
    }
    await db.collection('config').doc('site').set(
      {
        maintenanceMode: false,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
    res.json({ message: 'Website data reset completed', collections });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const getSubscriptionPlans = async (_req: Request, res: Response) => {
  try {
    const snap = await db.collection('subscriptionPlans').get();
    const plans = snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as any) }))
      .sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    res.json(plans);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const upsertSubscriptionPlan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const payload = req.body || {};
    const ref = db.collection('subscriptionPlans').doc(id || db.collection('subscriptionPlans').doc().id);
    await ref.set(
      {
        id: ref.id,
        name: payload.name || 'Plan',
        price: Number(payload.price || 0),
        durationDays: Number(payload.durationDays || 30),
        featureLimits: payload.featureLimits || {},
        features: Array.isArray(payload.features) ? payload.features : [],
        sidebarColor: payload.sidebarColor || '#111827',
        active: payload.active !== false,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
    res.json({ message: 'Plan saved', id: ref.id });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const subscribeSellerToPlan = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { planId } = req.body || {};
    if (!planId) return res.status(400).json({ error: 'planId is required' });
    const planDoc = await db.collection('subscriptionPlans').doc(String(planId)).get();
    if (!planDoc.exists) return res.status(404).json({ error: 'Plan not found' });
    const plan = planDoc.data() as any;
    const startsAt = new Date();
    const expiresAt = new Date(startsAt.getTime() + Number(plan.durationDays || 30) * 24 * 60 * 60 * 1000);
    await db.collection('users').doc(user.uid).set(
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
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
    res.json({ message: 'Subscription activated', planId: planDoc.id });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

export const removeAdminUser = async (req: Request, res: Response) => {
  try {
    const requester = (req as any).user;
    if (String(requester?.email || '').toLowerCase() !== 'admin@zoop.com') {
      return res.status(403).json({ error: 'Only super admin can remove admins' });
    }
    const { uid } = req.params;
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) return res.status(404).json({ error: 'Admin user not found' });
    const adminUser = userDoc.data() as any;
    if (String(adminUser?.email || '').toLowerCase() === 'admin@zoop.com') {
      return res.status(400).json({ error: 'Super admin cannot be removed' });
    }
    if (String(adminUser?.role || '') !== 'admin') {
      return res.status(400).json({ error: 'Target user is not an admin' });
    }
    await db.collection('users').doc(uid).set(
      {
        role: 'customer',
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
    await auth.setCustomUserClaims(uid, { role: 'customer' });
    res.json({ message: 'Admin removed successfully' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};

import { API_BASE_URL } from "../config/apiBase";
/**
 * Zoop API Service Layer — all frontend API calls go through here
 * Replaces scattered fetch() calls and hard-coded mock data.
 */

const API_URL = API_BASE_URL;

// ─── Auth Token ───────────────────────────────────────────────────────────────
const getAuthToken = (): string | null => localStorage.getItem('authToken');

// ─── Base Fetcher ─────────────────────────────────────────────────────────────
async function request<T>(
  method: string,
  endpoint: string,
  body?: unknown,
  requiresAuth = false
): Promise<T> {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  const token = getAuthToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (requiresAuth && !token) throw new Error('Authentication required');

  const options: RequestInit = { method, headers };
  if (body !== undefined) options.body = JSON.stringify(body);

  const response = await fetch(`${API_URL}${endpoint}`, options);

  if (!response.ok) {
    let errMsg = `HTTP ${response.status}`;
    let errPayload: any = null;
    try {
      errPayload = await response.json();
      const zodMessage = Array.isArray(errPayload?.error)
        ? errPayload.error[0]?.message
        : Array.isArray(errPayload?.issues)
          ? errPayload.issues[0]?.message
          : "";
      errMsg = zodMessage || errPayload.error || errPayload.message || errMsg;
    } catch {}
    const error: any = new Error(errMsg);
    error.status = response.status;
    if (errPayload) {
      error.data = errPayload;
      Object.assign(error, errPayload);
    }
    throw error;
  }

  return response.json();
}

const get  = <T>(ep: string) => request<T>('GET',    ep);
const post = <T>(ep: string, body: unknown) => request<T>('POST',   ep, body);
const put  = <T>(ep: string, body: unknown) => request<T>('PUT',    ep, body);
const del  = <T>(ep: string) => request<T>('DELETE', ep);

// ─── CONTENT ─────────────────────────────────────────────────────────────────
export const contentApi = {
  getCities:      () => get<any[]>('/content/cities'),
  getMarketNodes: () => get<any[]>('/content/market-nodes'),
  getBrands:      () => get<any[]>('/content/brands'),
  getHeroSlides:  () => get<any[]>('/content/hero-slides'),
  getCategories:  () => get<any[]>('/content/categories'),
  getCollections: () => get<any[]>('/content/collections'),
  getFooterLinks: () => get<any>('/content/footer-links'),
  getSiteConfig:  () => get<any>('/content/site-config'),
  getOffers: () => get<any[]>('/content/offers'),
  createSupportTicket: (data: unknown) => post<any>('/content/support-tickets', data),
  getMySupportTickets: () => get<any[]>('/content/support-tickets/my'),
  subscribeStockAlert: (productId: string) => post<any>('/content/stock-alerts', { productId }),
  getMyNotifications: () => get<any[]>('/content/notifications/my'),
  markNotificationRead: (id: string) => put<any>(`/content/notifications/${id}/read`, {}),
  getMyReviews: () => get<any[]>('/content/reviews/my'),
};

// ─── PRODUCTS ─────────────────────────────────────────────────────────────────
export const productsApi = {
  getAll: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return get<any[]>(`/products${qs}`);
  },
  getById:  (id: string) => get<any>(`/products/${id}`),
  getReviews: (id: string) => get<any[]>(`/products/${id}/reviews`),
  create:   (data: unknown) => post<any>('/products', data),
  update:   (id: string, data: unknown) => put<any>(`/products/${id}`, data),
  delete:   (id: string) => del<any>(`/products/${id}`),
};

// ─── COMMERCE: CART ──────────────────────────────────────────────────────────
export const cartApi = {
  get:    () => get<any>('/commerce/cart'),
  add:    (productId: string, quantity: number) => post<any>('/commerce/cart', { productId, quantity }),
  remove: (productId: string) => del<any>(`/commerce/cart/${productId}`),
  clear:  () => request<any>('DELETE', '/commerce/cart/clear'),
};

// ─── COMMERCE: ORDERS ────────────────────────────────────────────────────────
export const ordersApi = {
  create:  (data: unknown) => post<any>('/commerce/orders', data),
  createRazorpayOrder: (data: {
    items: Array<{ productId: string; quantity: number }>;
    receipt?: string;
    notes?: Record<string, string>;
    appliedOffer?: {
      id?: string;
      code?: string;
      title?: string;
      discountAmount?: number;
      scope?: "order" | "shipping";
    };
  }) => post<any>('/commerce/payments/razorpay/order', data),
  verifyRazorpayPayment: (data: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) => post<any>('/commerce/payments/razorpay/verify', data),
  getMyOrders: () => get<any[]>('/commerce/orders/my'),
  getById: (id: string) => get<any>(`/commerce/orders/${id}`),
  cancel: (id: string) => put<any>(`/commerce/orders/${id}/cancel`, {}),
  addReview: (id: string, data: { productId: string; rating: number; title?: string; comment?: string }) =>
    post<any>(`/commerce/orders/${id}/reviews`, data),
  requestReturn: (id: string, data: { productId: string; reason: string }) =>
    post<any>(`/commerce/orders/${id}/returns`, data),
  reserveCheckout: (items: Array<{ productId: string; quantity: number }>, ttlMinutes?: number) =>
    post<any>('/commerce/checkout/reserve', { items, ttlMinutes }),
  releaseCheckout: (productIds?: string[]) =>
    request<any>('DELETE', '/commerce/checkout/reserve', { productIds }),
};

// ─── WISHLIST ─────────────────────────────────────────────────────────────────
export const wishlistApi = {
  get:    () => get<any>('/content/wishlist'),
  add:    (productId: string) => post<any>('/content/wishlist', { productId }),
  remove: (productId: string) => del<any>(`/content/wishlist/${productId}`),
};

// ─── AUTH ─────────────────────────────────────────────────────────────────────
export const authApi = {
  signupOTP:  (data: unknown) => post<any>('/auth/signup', data),
  verifyOTP:  (data: unknown) => post<any>('/auth/verify-otp', data),
  verifyPhoneSignup: (data: { email: string; idToken: string }) =>
    post<any>('/auth/verify-phone-signup', data),
  resendOTP:  (email: string, otpChannel = 'email') => post<any>('/auth/resend-otp', { email, otpChannel }),
  requestLoginOTP: (email: string, otpChannel = 'email') => post<any>('/auth/login/request-otp', { email, otpChannel }),
  verifyLoginOTP: (data: { email: string; otp: string }) => post<any>('/auth/login/verify-otp', data),
  verifyPhoneLogin: (data: { email: string; idToken: string }) =>
    post<any>('/auth/login/verify-phone', data),
  syncUser:   (data?: unknown) => post<any>('/auth/sync', data || {}),
  registerSeller: (data: unknown) => post<any>('/auth/register-seller', data),
  getProfile: () => get<any>('/auth/profile'),
  updateProfile: (data: unknown) => put<any>('/auth/profile', data),
  requestDeleteAccountOTP: () => post<any>('/auth/delete-account/request-otp', {}),
  confirmDeleteAccount: (otp: string, reason?: string) =>
    post<any>('/auth/delete-account/confirm', { otp, reason }),
};

// ─── ADMIN ────────────────────────────────────────────────────────────────────
export const adminApi = {
  getAnalytics:       (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return get<any>(`/content/admin/analytics${qs}`);
  },
  getUsers:           (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return get<any>(`/content/admin/users${qs}`);
  },
  updateUserRole: (uid: string, role: string) => put<any>(`/content/admin/users/${uid}/role`, { role }),
  banUser: (uid: string, disabled: boolean) => put<any>(`/content/admin/users/${uid}/ban`, { disabled }),
  removeAdmin: (uid: string) => del<any>(`/content/admin/users/${uid}/remove-admin`),
  createUser: (data: any) => post<any>('/auth/admin-create-user', data),
  getPendingSellers: () => get<any[]>('/content/admin/sellers/pending'),
  getSellers: () => get<any[]>('/content/admin/sellers'),
  approveSeller:     (uid: string) => put<any>(`/content/admin/sellers/${uid}/approve`, {}),
  rejectSeller:      (uid: string, reason: string) => put<any>(`/content/admin/sellers/${uid}/reject`, { reason }),
  getAllOrders: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return get<any>(`/content/admin/orders${qs}`);
  },
  updateOrderStatus: (id: string, status: string) => put<any>(`/content/admin/orders/${id}/status`, { status }),
  getProductsForCuration: () => get<any[]>('/content/admin/products/curation'),
  updateProductModeration: (id: string, moderationStatus: string, moderationNote?: string) =>
    put<any>(`/content/admin/products/${id}/moderation`, { moderationStatus, moderationNote }),
  getSupportTickets: () => get<any[]>('/content/admin/support-tickets'),
  getSiteConfig: () => get<any>('/content/site-config'),
  getOffers: () => get<any[]>('/content/admin/offers'),
  createOffer: (data: any) => post<any>('/content/admin/offers', data),
  updateOffer: (id: string, data: any) => put<any>(`/content/admin/offers/${id}`, data),
  updateSupportTicketStatus: (id: string, status: string, reply?: string) =>
    put<any>(`/content/admin/support-tickets/${id}/status`, { status, reply }),
  getMonetizationOverview: () => get<any>('/content/admin/monetization'),
  getCommissionStructure: () => get<any>('/content/admin/commission-structure'),
  updateCommissionStructure: (items: any[]) =>
    put<any>('/content/admin/commission-structure', { items }),
  releasePayout: (id: string, transferRef?: string) =>
    post<any>(`/content/admin/payouts/${id}/release`, { transferRef }),
  getAds: () => get<any>('/content/admin/ads'),
  saveAdSlot: (id: string, data: any) => put<any>(`/content/admin/ad-slots/${id}`, data),
  deleteAdSlot: (id: string) => del<any>(`/content/admin/ad-slots/${id}`),
  createAd: (data: any) => post<any>('/content/admin/ads', data),
  updateAd: (id: string, data: any) => put<any>(`/content/admin/ads/${id}`, data),
  deleteAd: (id: string) => del<any>(`/content/admin/ads/${id}`),
  clearAdminActivities: () => post<any>('/content/admin/reset/activities', {}),
  deleteAllProducts: () => post<any>('/content/admin/reset/delete-all-products', {}),
  deleteUsersByRole: (role: "all" | "customer" | "seller" | "admin") =>
    post<any>('/content/admin/reset/delete-users', { role }),
  resetWebData: () => post<any>('/content/admin/reset/web', {}),
  getSubscriptionPlans: () => get<any[]>('/content/admin/subscription-plans'),
  createSubscriptionPlan: (data: any) => post<any>('/content/admin/subscription-plans', data),
  updateSubscriptionPlan: (id: string, data: any) =>
    put<any>(`/content/admin/subscription-plans/${id}`, data),
  updateCity:       (id: string, data: unknown) => put<any>(`/content/cities/${id}`, data),
  updateSiteConfig: (data: unknown) => put<any>('/content/site-config', data),
  createHeroSlide:  (data: unknown) => post<any>('/content/hero-slides', data),
  updateHeroSlide:  (id: string, data: unknown) => put<any>(`/content/hero-slides/${id}`, data),
  deleteHeroSlide:  (id: string) => del<any>(`/content/hero-slides/${id}`),
};

// ─── SELLER ───────────────────────────────────────────────────────────────────
export const sellerApi = {
  getDashboard: () => get<any>('/content/seller/dashboard'),
  getOrders:    () => get<any[]>('/content/seller/orders'),
  updateOrderStatus: (orderId: string, status: string) => put<any>(`/content/seller/orders/${orderId}/status`, { status }),
  updateReturnStatus: (orderId: string, productId: string, status: string, note?: string) =>
    put<any>(`/content/seller/orders/${orderId}/returns/${productId}/status`, { status, note }),
  getPayouts: () => get<any>('/content/seller/payouts'),
  getMyAds: () => get<any[]>('/content/seller/ads'),
  getAdSlots: () => get<any[]>('/content/seller/ad-slots'),
  createMyAd: (data: any) => post<any>('/content/seller/ads', data),
  getSubscriptionPlans: () => get<any[]>('/content/subscription-plans'),
  chooseSubscriptionPlan: (planId: string) =>
    post<any>('/content/seller/subscription/select', { planId }),
};

export const adsApi = {
  getPublicBySlot: (slotId: string) =>
    get<any[]>(`/content/ads/public?slotId=${encodeURIComponent(slotId)}`),
};

export { API_URL };

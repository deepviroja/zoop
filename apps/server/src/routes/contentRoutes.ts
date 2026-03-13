import express from 'express';
import {
  authenticate,
  authorize,
  requireCompletedProfile,
} from '../middleware/authMiddleware';
import {
  // Public content
  getCities,
  getMarketNodes,
  getBrands,
  getHeroSlides,
  getCategories,
  getCollections,
  getFooterLinks,
  getSiteConfig,
  getPublicOffers,
  // Admin content management
  updateCity,
  updateHeroSlide,
  updateSiteConfig,
  getAdminOffers,
  upsertOffer,
  createHeroSlide,
  deleteHeroSlide,
  // Admin analytics
  getAdminAnalytics,
  // Admin user management
  getAllUsers,
  updateUserRole,
  banUser,
  // Seller management
  getPendingSellers,
  getAllSellersDetails,
  approveSeller,
  rejectSeller,
  // Admin orders
  getAllOrders,
  updateOrderStatus,
  // Wishlist
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  // Seller dashboard
  getSellerDashboardData,
  getSellerOrders,
  updateSellerOrderStatus,
  getProductsForCuration,
  updateProductModeration,
  createSupportTicket,
  getMySupportTickets,
  getAllSupportTickets,
  updateSupportTicketStatus,
  subscribeProductAvailability,
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  getMyReviews,
  getCommissionStructureConfig,
  updateCommissionStructureConfig,
  getMonetizationOverview,
  getSellerPayouts,
  releasePayout,
  updateReturnRequestStatus,
  getAdminAds,
  upsertAdSlot,
  deleteAdSlot,
  upsertAd,
  deleteAd,
  getMyAds,
  createMyAd,
  getPublicAdsBySlot,
  getSellerAdSlots,
  getSubscriptionPlans,
  upsertSubscriptionPlan,
  deleteSubscriptionPlan,
  subscribeSellerToPlan,
  removeAdminUser,
  clearAdminActivities,
  superAdminDeleteAllProducts,
  superAdminDeleteUsersByRole,
  superAdminResetWeb,
} from '../controllers/contentController';
import {
  createSellerSubscriptionRazorpayOrder,
  verifySellerSubscriptionRazorpayPayment,
  createSellerAdRazorpayOrder,
  verifySellerAdRazorpayPayment,
} from '../controllers/sellerPaymentController';

const router = express.Router();

// ─── PUBLIC CONTENT ROUTES ────────────────────────────────────────────────────
router.get('/cities',       getCities);
router.get('/market-nodes', getMarketNodes);
router.get('/brands',       getBrands);
router.get('/hero-slides',  getHeroSlides);
router.get('/categories',   getCategories);
router.get('/collections',  getCollections);
router.get('/footer-links', getFooterLinks);
router.get('/site-config',  getSiteConfig);
router.get('/offers', getPublicOffers);

// ─── ADMIN CONTENT MANAGEMENT ─────────────────────────────────────────────────
router.put('/cities/:id',      authenticate, authorize(['admin']), requireCompletedProfile, updateCity);
router.get('/hero-slides',     getHeroSlides);
router.post('/hero-slides',    authenticate, authorize(['admin']), requireCompletedProfile, createHeroSlide);
router.put('/hero-slides/:id', authenticate, authorize(['admin']), requireCompletedProfile, updateHeroSlide);
router.delete('/hero-slides/:id', authenticate, authorize(['admin']), requireCompletedProfile, deleteHeroSlide);
router.put('/site-config',     authenticate, authorize(['admin']), requireCompletedProfile, updateSiteConfig);
router.get('/admin/offers', authenticate, authorize(['admin']), requireCompletedProfile, getAdminOffers);
router.post('/admin/offers', authenticate, authorize(['admin']), requireCompletedProfile, upsertOffer);
router.put('/admin/offers/:id', authenticate, authorize(['admin']), requireCompletedProfile, upsertOffer);

// ─── ADMIN ANALYTICS ─────────────────────────────────────────────────────────
router.get('/admin/analytics', authenticate, authorize(['admin']), requireCompletedProfile, getAdminAnalytics);

// ─── ADMIN USER MANAGEMENT ───────────────────────────────────────────────────
router.get('/admin/users',              authenticate, authorize(['admin']), requireCompletedProfile, getAllUsers);
router.put('/admin/users/:uid/role',    authenticate, authorize(['admin']), requireCompletedProfile, updateUserRole);
router.put('/admin/users/:uid/ban',     authenticate, authorize(['admin']), requireCompletedProfile, banUser);
router.delete('/admin/users/:uid/remove-admin', authenticate, authorize(['admin']), requireCompletedProfile, removeAdminUser);

// ─── ADMIN SELLER MANAGEMENT ─────────────────────────────────────────────────
router.get('/admin/sellers/pending',       authenticate, authorize(['admin']), requireCompletedProfile, getPendingSellers);
router.get('/admin/sellers',               authenticate, authorize(['admin']), requireCompletedProfile, getAllSellersDetails);
router.put('/admin/sellers/:uid/approve',  authenticate, authorize(['admin']), requireCompletedProfile, approveSeller);
router.put('/admin/sellers/:uid/reject',   authenticate, authorize(['admin']), requireCompletedProfile, rejectSeller);

// ─── ADMIN ORDERS ─────────────────────────────────────────────────────────────
router.get('/admin/orders',          authenticate, authorize(['admin']), requireCompletedProfile, getAllOrders);
router.put('/admin/orders/:id/status', authenticate, authorize(['admin']), requireCompletedProfile, updateOrderStatus);

// ─── WISHLIST (authenticated users) ──────────────────────────────────────────
router.get('/wishlist',                   authenticate, requireCompletedProfile, getWishlist);
router.post('/wishlist',                  authenticate, requireCompletedProfile, addToWishlist);
router.delete('/wishlist/:productId',     authenticate, requireCompletedProfile, removeFromWishlist);

// ─── SELLER DASHBOARD ─────────────────────────────────────────────────────────
router.get('/seller/dashboard', authenticate, authorize(['seller', 'admin']), requireCompletedProfile, getSellerDashboardData);
router.get('/seller/orders',    authenticate, authorize(['seller', 'admin']), requireCompletedProfile, getSellerOrders);
router.put('/seller/orders/:id/status', authenticate, authorize(['seller', 'admin']), requireCompletedProfile, updateSellerOrderStatus);
router.put('/seller/orders/:id/returns/:productId/status', authenticate, authorize(['seller', 'admin']), requireCompletedProfile, updateReturnRequestStatus);

// ─── ADMIN: CONTENT CURATION ────────────────────────────────────────────────
router.get('/admin/products/curation', authenticate, authorize(['admin']), requireCompletedProfile, getProductsForCuration);
router.put('/admin/products/:id/moderation', authenticate, authorize(['admin']), requireCompletedProfile, updateProductModeration);
router.get('/admin/monetization', authenticate, authorize(['admin']), requireCompletedProfile, getMonetizationOverview);
router.get('/admin/commission-structure', authenticate, authorize(['admin']), requireCompletedProfile, getCommissionStructureConfig);
router.put('/admin/commission-structure', authenticate, authorize(['admin']), requireCompletedProfile, updateCommissionStructureConfig);
router.post('/admin/payouts/:id/release', authenticate, authorize(['admin']), requireCompletedProfile, releasePayout);
router.get('/seller/payouts', authenticate, authorize(['seller', 'admin']), requireCompletedProfile, getSellerPayouts);

router.get('/admin/ads', authenticate, authorize(['admin']), requireCompletedProfile, getAdminAds);
router.put('/admin/ad-slots/:id', authenticate, authorize(['admin']), requireCompletedProfile, upsertAdSlot);
router.delete('/admin/ad-slots/:id', authenticate, authorize(['admin']), requireCompletedProfile, deleteAdSlot);
router.post('/admin/ads', authenticate, authorize(['admin']), requireCompletedProfile, upsertAd);
router.put('/admin/ads/:id', authenticate, authorize(['admin']), requireCompletedProfile, upsertAd);
router.delete('/admin/ads/:id', authenticate, authorize(['admin']), requireCompletedProfile, deleteAd);
router.get('/seller/ads', authenticate, authorize(['seller', 'admin']), requireCompletedProfile, getMyAds);
router.post('/seller/ads', authenticate, authorize(['seller', 'admin']), requireCompletedProfile, createMyAd);
router.get('/seller/ad-slots', authenticate, authorize(['seller', 'admin']), requireCompletedProfile, getSellerAdSlots);
router.get('/ads/public', getPublicAdsBySlot);
router.post('/admin/reset/activities', authenticate, authorize(['admin']), requireCompletedProfile, clearAdminActivities);
router.post('/admin/reset/delete-all-products', authenticate, authorize(['admin']), requireCompletedProfile, superAdminDeleteAllProducts);
router.post('/admin/reset/delete-users', authenticate, authorize(['admin']), requireCompletedProfile, superAdminDeleteUsersByRole);
router.post('/admin/reset/web', authenticate, authorize(['admin']), requireCompletedProfile, superAdminResetWeb);

router.get('/admin/subscription-plans', authenticate, authorize(['admin']), requireCompletedProfile, getSubscriptionPlans);
router.post('/admin/subscription-plans', authenticate, authorize(['admin']), requireCompletedProfile, upsertSubscriptionPlan);
router.put('/admin/subscription-plans/:id', authenticate, authorize(['admin']), requireCompletedProfile, upsertSubscriptionPlan);
router.delete('/admin/subscription-plans/:id', authenticate, authorize(['admin']), requireCompletedProfile, deleteSubscriptionPlan);
router.get('/subscription-plans', getSubscriptionPlans);
router.post('/seller/subscription/select', authenticate, authorize(['seller', 'admin']), requireCompletedProfile, subscribeSellerToPlan);
router.post('/seller/subscription/razorpay/order', authenticate, authorize(['seller', 'admin']), requireCompletedProfile, createSellerSubscriptionRazorpayOrder);
router.post('/seller/subscription/razorpay/verify', authenticate, authorize(['seller', 'admin']), requireCompletedProfile, verifySellerSubscriptionRazorpayPayment);
router.post('/seller/ads/razorpay/order', authenticate, authorize(['seller', 'admin']), requireCompletedProfile, createSellerAdRazorpayOrder);
router.post('/seller/ads/razorpay/verify', authenticate, authorize(['seller', 'admin']), requireCompletedProfile, verifySellerAdRazorpayPayment);

// ─── SUPPORT TICKETS ────────────────────────────────────────────────────────
router.post('/support-tickets', authenticate, requireCompletedProfile, createSupportTicket);
router.get('/support-tickets/my', authenticate, requireCompletedProfile, getMySupportTickets);
router.get('/admin/support-tickets', authenticate, authorize(['admin']), requireCompletedProfile, getAllSupportTickets);
router.put('/admin/support-tickets/:id/status', authenticate, authorize(['admin']), requireCompletedProfile, updateSupportTicketStatus);
router.post('/stock-alerts', authenticate, requireCompletedProfile, subscribeProductAvailability);
router.get('/notifications/my', authenticate, requireCompletedProfile, getMyNotifications);
router.put('/notifications/:id/read', authenticate, requireCompletedProfile, markNotificationRead);
router.put('/notifications/read-all', authenticate, requireCompletedProfile, markAllNotificationsRead);
router.delete('/notifications/:id', authenticate, requireCompletedProfile, deleteNotification);
router.get('/reviews/my', authenticate, requireCompletedProfile, getMyReviews);

export default router;

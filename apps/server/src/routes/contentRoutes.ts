import express from 'express';
import { authenticate, authorize } from '../middleware/authMiddleware';
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
  // Admin content management
  updateCity,
  updateHeroSlide,
  updateSiteConfig,
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
  getMyReviews,
  getCommissionStructureConfig,
  updateCommissionStructureConfig,
  getMonetizationOverview,
  getSellerPayouts,
  releasePayout,
  updateReturnRequestStatus,
  getAdminAds,
  upsertAdSlot,
  upsertAd,
  getMyAds,
  createMyAd,
  getPublicAdsBySlot,
  getSellerAdSlots,
  getSubscriptionPlans,
  upsertSubscriptionPlan,
  subscribeSellerToPlan,
  removeAdminUser,
  clearAdminActivities,
  superAdminDeleteAllProducts,
  superAdminDeleteUsersByRole,
  superAdminResetWeb,
} from '../controllers/contentController';

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

// ─── ADMIN CONTENT MANAGEMENT ─────────────────────────────────────────────────
router.put('/cities/:id',      authenticate, authorize(['admin']), updateCity);
router.get('/hero-slides',     getHeroSlides);
router.post('/hero-slides',    authenticate, authorize(['admin']), createHeroSlide);
router.put('/hero-slides/:id', authenticate, authorize(['admin']), updateHeroSlide);
router.delete('/hero-slides/:id', authenticate, authorize(['admin']), deleteHeroSlide);
router.put('/site-config',     authenticate, authorize(['admin']), updateSiteConfig);

// ─── ADMIN ANALYTICS ─────────────────────────────────────────────────────────
router.get('/admin/analytics', authenticate, authorize(['admin']), getAdminAnalytics);

// ─── ADMIN USER MANAGEMENT ───────────────────────────────────────────────────
router.get('/admin/users',              authenticate, authorize(['admin']), getAllUsers);
router.put('/admin/users/:uid/role',    authenticate, authorize(['admin']), updateUserRole);
router.put('/admin/users/:uid/ban',     authenticate, authorize(['admin']), banUser);
router.delete('/admin/users/:uid/remove-admin', authenticate, authorize(['admin']), removeAdminUser);

// ─── ADMIN SELLER MANAGEMENT ─────────────────────────────────────────────────
router.get('/admin/sellers/pending',       authenticate, authorize(['admin']), getPendingSellers);
router.get('/admin/sellers',               authenticate, authorize(['admin']), getAllSellersDetails);
router.put('/admin/sellers/:uid/approve',  authenticate, authorize(['admin']), approveSeller);
router.put('/admin/sellers/:uid/reject',   authenticate, authorize(['admin']), rejectSeller);

// ─── ADMIN ORDERS ─────────────────────────────────────────────────────────────
router.get('/admin/orders',          authenticate, authorize(['admin']), getAllOrders);
router.put('/admin/orders/:id/status', authenticate, authorize(['admin']), updateOrderStatus);

// ─── WISHLIST (authenticated users) ──────────────────────────────────────────
router.get('/wishlist',                   authenticate, getWishlist);
router.post('/wishlist',                  authenticate, addToWishlist);
router.delete('/wishlist/:productId',     authenticate, removeFromWishlist);

// ─── SELLER DASHBOARD ─────────────────────────────────────────────────────────
router.get('/seller/dashboard', authenticate, authorize(['seller', 'admin']), getSellerDashboardData);
router.get('/seller/orders',    authenticate, authorize(['seller', 'admin']), getSellerOrders);
router.put('/seller/orders/:id/status', authenticate, authorize(['seller', 'admin']), updateSellerOrderStatus);
router.put('/seller/orders/:id/returns/:productId/status', authenticate, authorize(['seller', 'admin']), updateReturnRequestStatus);

// ─── ADMIN: CONTENT CURATION ────────────────────────────────────────────────
router.get('/admin/products/curation', authenticate, authorize(['admin']), getProductsForCuration);
router.put('/admin/products/:id/moderation', authenticate, authorize(['admin']), updateProductModeration);
router.get('/admin/monetization', authenticate, authorize(['admin']), getMonetizationOverview);
router.get('/admin/commission-structure', authenticate, authorize(['admin']), getCommissionStructureConfig);
router.put('/admin/commission-structure', authenticate, authorize(['admin']), updateCommissionStructureConfig);
router.post('/admin/payouts/:id/release', authenticate, authorize(['admin']), releasePayout);
router.get('/seller/payouts', authenticate, authorize(['seller', 'admin']), getSellerPayouts);

router.get('/admin/ads', authenticate, authorize(['admin']), getAdminAds);
router.put('/admin/ad-slots/:id', authenticate, authorize(['admin']), upsertAdSlot);
router.post('/admin/ads', authenticate, authorize(['admin']), upsertAd);
router.put('/admin/ads/:id', authenticate, authorize(['admin']), upsertAd);
router.get('/seller/ads', authenticate, authorize(['seller', 'admin']), getMyAds);
router.post('/seller/ads', authenticate, authorize(['seller', 'admin']), createMyAd);
router.get('/seller/ad-slots', authenticate, authorize(['seller', 'admin']), getSellerAdSlots);
router.get('/ads/public', getPublicAdsBySlot);
router.post('/admin/reset/activities', authenticate, authorize(['admin']), clearAdminActivities);
router.post('/admin/reset/delete-all-products', authenticate, authorize(['admin']), superAdminDeleteAllProducts);
router.post('/admin/reset/delete-users', authenticate, authorize(['admin']), superAdminDeleteUsersByRole);
router.post('/admin/reset/web', authenticate, authorize(['admin']), superAdminResetWeb);

router.get('/admin/subscription-plans', authenticate, authorize(['admin']), getSubscriptionPlans);
router.post('/admin/subscription-plans', authenticate, authorize(['admin']), upsertSubscriptionPlan);
router.put('/admin/subscription-plans/:id', authenticate, authorize(['admin']), upsertSubscriptionPlan);
router.get('/subscription-plans', getSubscriptionPlans);
router.post('/seller/subscription/select', authenticate, authorize(['seller', 'admin']), subscribeSellerToPlan);

// ─── SUPPORT TICKETS ────────────────────────────────────────────────────────
router.post('/support-tickets', authenticate, createSupportTicket);
router.get('/support-tickets/my', authenticate, getMySupportTickets);
router.get('/admin/support-tickets', authenticate, authorize(['admin']), getAllSupportTickets);
router.put('/admin/support-tickets/:id/status', authenticate, authorize(['admin']), updateSupportTicketStatus);
router.post('/stock-alerts', authenticate, subscribeProductAvailability);
router.get('/notifications/my', authenticate, getMyNotifications);
router.put('/notifications/:id/read', authenticate, markNotificationRead);
router.get('/reviews/my', authenticate, getMyReviews);

export default router;

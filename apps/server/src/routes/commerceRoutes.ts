import express from 'express';
import { authenticate, requireCompletedProfile } from '../middleware/authMiddleware';
import { 
    getCart, 
    addToCart, 
    removeFromCart, 
    createOrder, 
    createRazorpayOrder,
    verifyRazorpayPayment,
    getMyOrders,
    getOrderById,
    cancelOrder,
    createReviewForOrderItem,
    requestOrderReturn,
    reserveCheckout,
    releaseCheckoutReservation,
} from '../controllers/commerceController';
import { db } from '../config/firebase';

const router = express.Router();

// Cart Routes - require authentication
router.get('/cart', authenticate, requireCompletedProfile, getCart);
router.post('/cart', authenticate, requireCompletedProfile, addToCart);
router.delete('/cart/clear', authenticate, requireCompletedProfile, async (req: any, res) => {
    try {
        await db.collection('carts').doc(req.user.uid).delete();
        res.json({ message: 'Cart cleared' });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});
router.delete('/cart/:productId', authenticate, requireCompletedProfile, removeFromCart);

// Order Routes - require authentication
router.post('/checkout/reserve', authenticate, requireCompletedProfile, reserveCheckout);
router.delete('/checkout/reserve', authenticate, requireCompletedProfile, releaseCheckoutReservation);
router.post('/payments/razorpay/order', authenticate, requireCompletedProfile, createRazorpayOrder);
router.post('/payments/razorpay/verify', authenticate, requireCompletedProfile, verifyRazorpayPayment);
router.post('/orders', authenticate, requireCompletedProfile, createOrder);
router.get('/orders/my', authenticate, requireCompletedProfile, getMyOrders);
router.get('/orders', authenticate, requireCompletedProfile, getMyOrders);
router.get('/orders/:id', authenticate, requireCompletedProfile, getOrderById);
router.put('/orders/:id/cancel', authenticate, requireCompletedProfile, cancelOrder);
router.post('/orders/:id/reviews', authenticate, requireCompletedProfile, createReviewForOrderItem);
router.post('/orders/:id/returns', authenticate, requireCompletedProfile, requestOrderReturn);

export default router;

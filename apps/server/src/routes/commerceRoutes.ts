import express from 'express';
import { authenticate } from '../middleware/authMiddleware';
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
router.get('/cart', authenticate, getCart);
router.post('/cart', authenticate, addToCart);
router.delete('/cart/clear', authenticate, async (req: any, res) => {
    try {
        await db.collection('carts').doc(req.user.uid).delete();
        res.json({ message: 'Cart cleared' });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});
router.delete('/cart/:productId', authenticate, removeFromCart);

// Order Routes - require authentication
router.post('/checkout/reserve', authenticate, reserveCheckout);
router.delete('/checkout/reserve', authenticate, releaseCheckoutReservation);
router.post('/payments/razorpay/order', authenticate, createRazorpayOrder);
router.post('/payments/razorpay/verify', authenticate, verifyRazorpayPayment);
router.post('/orders', authenticate, createOrder);
router.get('/orders/my', authenticate, getMyOrders);
router.get('/orders', authenticate, getMyOrders);
router.get('/orders/:id', authenticate, getOrderById);
router.put('/orders/:id/cancel', authenticate, cancelOrder);
router.post('/orders/:id/reviews', authenticate, createReviewForOrderItem);
router.post('/orders/:id/returns', authenticate, requestOrderReturn);

export default router;

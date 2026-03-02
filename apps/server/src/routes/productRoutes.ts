import express from 'express';
import { authenticate, authorize } from '../middleware/authMiddleware';
import { 
    getProducts, 
    getProductById, 
    getProductReviews,
    createProduct,
    updateProduct,
    deleteProduct
} from '../controllers/productController';

const router = express.Router();

// Public routes
router.get('/', getProducts);
router.get('/:id', getProductById);
router.get('/:id/reviews', getProductReviews);

// Protected routes - require authentication
router.post('/', authenticate, authorize(['seller', 'admin']), createProduct);
router.put('/:id', authenticate, authorize(['seller', 'admin']), updateProduct);
router.delete('/:id', authenticate, authorize(['seller', 'admin']), deleteProduct);

export default router;

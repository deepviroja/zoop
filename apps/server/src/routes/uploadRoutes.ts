import express from 'express';
import { authenticate } from '../middleware/authMiddleware';
import {
  uploadMiddleware,
  uploadImage,
  deleteImage,
  uploadVideoMiddleware,
  uploadVideo,
  uploadDocumentMiddleware,
  uploadDocument,
} from '../controllers/uploadController';

const router = express.Router();

// Upload routes - require authentication
router.post('/', authenticate, uploadMiddleware, uploadImage);
router.post('/video', authenticate, uploadVideoMiddleware, uploadVideo);
router.post('/document', authenticate, uploadDocumentMiddleware, uploadDocument);
router.post('/delete', authenticate, deleteImage);

export default router;

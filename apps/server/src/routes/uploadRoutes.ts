import express from 'express';
import { authenticate, requireCompletedProfile } from '../middleware/authMiddleware';
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
router.post('/', authenticate, requireCompletedProfile, uploadMiddleware, uploadImage);
router.post('/video', authenticate, requireCompletedProfile, uploadVideoMiddleware, uploadVideo);
router.post('/document', authenticate, requireCompletedProfile, uploadDocumentMiddleware, uploadDocument);
router.post('/delete', authenticate, requireCompletedProfile, deleteImage);

export default router;

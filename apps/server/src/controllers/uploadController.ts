
import { v2 as cloudinary } from 'cloudinary';
import { Request, Response } from 'express';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.warn('Cloudinary env vars missing: CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET');
}

// Configure Multer Storage for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'zoop-marketplace',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    transformation: [{ width: 1000, height: 1000, crop: 'limit' }], // Optimize images
  } as any, // Type cast to avoid TS error with multer-storage-cloudinary
});

const upload = multer({ storage: storage });
const videoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
});
const documentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

export const uploadMiddleware = upload.single('image');
export const uploadMultipleMiddleware = upload.array('images', 12);
export const uploadVideoMiddleware = videoUpload.single('video');
export const uploadDocumentMiddleware = documentUpload.single('document');

export const uploadImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Cloudinary automatically handles the upload with multer-storage-cloudinary
    // File info is in req.file
    const result = req.file as any; // Type assertion

    res.json({
      url: result.path,
      public_id: result.filename,
    });
  } catch (error: any) {
    console.error('Upload Error:', error);
    res.status(500).json({ error: 'Image upload failed' });
  }
};

export const uploadVideo = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video uploaded' });
    }

    if (!(req.file.mimetype || '').startsWith('video/')) {
      return res.status(400).json({ error: 'Invalid video file type' });
    }

    const result = await new Promise<any>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'zoop-marketplace',
          resource_type: 'video',
        },
        (error, uploaded) => {
          if (error) reject(error);
          else resolve(uploaded);
        },
      );
      stream.end(req.file?.buffer);
    });

    res.json({
      url: result.secure_url,
      public_id: result.public_id,
      resource_type: result.resource_type,
      duration: result.duration,
    });
  } catch (error: any) {
    console.error('Video Upload Error:', error);
    res.status(500).json({ error: 'Video upload failed' });
  }
};

export const uploadDocument = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No document uploaded' });
    }

    const mime = String(req.file.mimetype || '').toLowerCase();
    const allowed = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
    ];
    if (!allowed.includes(mime)) {
      return res
        .status(400)
        .json({ error: 'Only PDF, JPG, PNG or WEBP documents are allowed' });
    }

    const result = await new Promise<any>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'zoop-marketplace/documents',
          resource_type: 'auto',
          use_filename: true,
          unique_filename: true,
        },
        (error, uploaded) => {
          if (error) reject(error);
          else resolve(uploaded);
        },
      );
      stream.end(req.file?.buffer);
    });

    res.json({
      // Keep Cloudinary secure URL unchanged; client can derive viewer URLs if needed.
      url: String(result.secure_url || ''),
      public_id: result.public_id,
      resource_type: result.resource_type,
      format: result.format,
    });
  } catch (error: any) {
    console.error('Document Upload Error:', error);
    res.status(500).json({ error: 'Document upload failed' });
  }
};

export const deleteImage = async (req: Request, res: Response) => {
    try {
        const { public_id } = req.body;
        if (!public_id) {
            return res.status(400).json({ error: 'Public ID is required' });
        }

        const result = await cloudinary.uploader.destroy(public_id);
        res.json({ message: 'Image deleted', result });
    } catch (error: any) {
        console.error('Delete Error:', error);
        res.status(500).json({ error: 'Image delete failed' });
    }
};

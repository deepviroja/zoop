import express from 'express';
import cors, { CorsOptions } from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import './config/firebase'; // Initialize Firebase
import authRoutes from './routes/authRoutes';
import productRoutes from './routes/productRoutes';
import commerceRoutes from './routes/commerceRoutes';
import uploadRoutes from './routes/uploadRoutes';
import contentRoutes from './routes/contentRoutes';
import { seedContentData } from './controllers/contentController';

dotenv.config();

const app = express();

// Security Headers
app.use(helmet());

// Dynamic CORS Configuration
const allowedOrigins = new Set([
  'https://zoop-88df6.web.app',
  'http://localhost:5173',
  process.env.FRONTEND_URL || '',
  ...(String(process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)),
].filter(Boolean));

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.has(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

// Logging and Parsing
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api', (req, res, next) => {
  if (req.path === '/' || req.path === '') {
    return res.json({ message: 'Zoop API v2', status: 'running' });
  }
  next();
});

app.use('/api/auth',     authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/commerce', commerceRoutes);
app.use('/api/upload',   uploadRoutes);
app.use('/api/content',  contentRoutes);

// Health checks for Render
app.get('/', (_req, res) => res.send('Zoop API v2 is running ✅'));
app.get('/health', (_req, res) => res.json({ 
  status: 'ok', 
  timestamp: new Date().toISOString(),
  env: process.env.NODE_ENV 
}));

// 404 handler
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

// Global Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({ 
    error: err.message || 'Internal server error' 
  });
});

// Render dynamic port binding
const PORT = process.env.PORT || 5000;

// Important: Listen on '0.0.0.0' for Render to detect the port
app.listen(Number(PORT), '0.0.0.0', async () => {
  console.log(`🚀 Zoop Server running on http://0.0.0.0:${PORT}`);
  
  // Seed content data on startup
  try {
    await seedContentData();
    console.log('✅ Content seeding completed');
  } catch (err) {
    console.error('⚠️ Content seeding failed (non-fatal):', err);
  }
});
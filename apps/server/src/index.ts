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

app.use(helmet());
const allowedOrigins = new Set(
  [
    'https://zoop-88df6.web.app',
    'http://localhost:5173',
    process.env.FRONTEND_URL || '',
    ...(String(process.env.ALLOWED_ORIGINS || '')
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean)),
  ].filter(Boolean),
);
const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 204,
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  next();
});
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api', (req, res, next) => {
  if (req.path === '/') return res.json({ message: 'Zoop API v2', status: 'running' });
  next();
});

app.use('/api/auth',     authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/commerce', commerceRoutes);
app.use('/api/upload',   uploadRoutes);
app.use('/api/content',  contentRoutes);

// Health check
app.get('/', (_req, res) => res.send('Zoop API v2 is running ✅'));
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// 404 handler
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`🚀 Zoop Server running on port ${PORT}`);
  // Seed content data on startup (no-op if already seeded)
  try {
    await seedContentData();
  } catch (err) {
    console.error('⚠️  Content seeding failed (non-fatal):', err);
  }
});

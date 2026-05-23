import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { errorHandler } from './middleware/auth.js';
import prisma from './utils/prisma.js';
import authRoutes from './routes/auth.js';
import carRoutes from './routes/cars.js';
import customerRoutes from './routes/customers.js';
import guarantorRoutes from './routes/guarantors.js';
import contractRoutes from './routes/contracts.js';
import dashboardRoutes from './routes/dashboard.js';
import carOwnerRoutes from './routes/carOwners.js';
import ownerAuthRoutes from './routes/ownerAuth.js';
import ownerPortalRoutes from './routes/ownerPortal.js';
import expenseRoutes from './routes/expenses.js';
import draftRoutes from './routes/drafts.js';
import { cleanupExpiredDrafts } from './controllers/draftController.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const isProd = process.env.NODE_ENV === 'production';
const app    = express();
const PORT   = process.env.PORT || 5000;

// ── Security headers ───────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow /uploads from different origin
  contentSecurityPolicy: false, // handled by Next.js on the frontend
}));

// ── Compression ─────────────────────────────────────────────────────────────
app.use(compression());

// ── CORS — comma-separated origins in FRONTEND_URL ─────────────────────────
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, Railway health checks)
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin not allowed — ${origin}`));
  },
  credentials: true,
}));

// ── Cookie & body parsing ────────────────────────────────────────────────────
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Rate limiting ────────────────────────────────────────────────────────────
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: isProd ? 300 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'درخواست‌های زیاد. لطفاً بعداً دوباره امتحان کنید.' },
  skip: (req) => req.path === '/api/health',
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 15 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'تلاش‌های ورود بیش از حد. لطفاً ۱۵ دقیقه صبر کنید.' },
});

app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/owner-auth/login', authLimiter);

// ── Static files (uploads) ──────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: isProd ? '7d' : 0,
  etag: true,
}));

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',         authRoutes);
app.use('/api/cars',         carRoutes);
app.use('/api/customers',    customerRoutes);
app.use('/api/guarantors',   guarantorRoutes);
app.use('/api/contracts',    contractRoutes);
app.use('/api/dashboard',    dashboardRoutes);
app.use('/api/car-owners',   carOwnerRoutes);
app.use('/api/owner-auth',   ownerAuthRoutes);
app.use('/api/owner-portal', ownerPortalRoutes);
app.use('/api/expenses',     expenseRoutes);
app.use('/api/drafts',       draftRoutes);

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'OK',
      message: 'سرور فعال است',
      db: 'connected',
      uptime: Math.round(process.uptime()),
      env: process.env.NODE_ENV || 'development',
    });
  } catch {
    res.status(503).json({ status: 'ERROR', message: 'خطای اتصال به پایگاه داده', db: 'disconnected' });
  }
});

// ── Error handler ─────────────────────────────────────────────────────────────
app.use(errorHandler);

// ── Draft expiration: clean up on startup and every hour ──────────────────────
cleanupExpiredDrafts();
setInterval(cleanupExpiredDrafts, 60 * 60 * 1000);

// ── Server start ─────────────────────────────────────────────────────────────
const server = app.listen(PORT, () => {
  if (!isProd) console.log(`🚀 Server running on port ${PORT}`);
});

// ── Graceful shutdown ─────────────────────────────────────────────────────────
const shutdown = async (signal) => {
  if (!isProd) console.log(`Received ${signal}. Shutting down gracefully…`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000);
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

export default app;

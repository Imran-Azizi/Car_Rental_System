import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
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
import employeeRoutes from './routes/employees.js';
import { cleanupExpiredDrafts } from './controllers/draftController.js';
import { autoMarkOverdue } from './controllers/contractController.js';

dotenv.config();

const isProd = process.env.NODE_ENV === 'production';
const app    = express();
const PORT   = process.env.PORT || 5000;

// Trust Railway / Vercel reverse-proxy so X-Forwarded-For is read correctly
// and express-rate-limit can identify clients without ERR_ERL_UNEXPECTED_X_FORWARDED_FOR
app.set('trust proxy', 1);

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // handled by Next.js on the frontend
}));

// ── Compression ───────────────────────────────────────────────────────────────
app.use(compression());

// ── CORS — comma-separated origins in FRONTEND_URL ───────────────────────────
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

// In development always allow localhost
if (!isProd) {
  ['http://localhost:3000', 'http://localhost:5000'].forEach(o => {
    if (!allowedOrigins.includes(o)) allowedOrigins.push(o);
  });
}

// Optional regex for dynamic origins (e.g. Vercel preview deployments)
// Set CORS_ORIGIN_PATTERN=https://.*\.vercel\.app in Railway env vars
const corsPattern = process.env.CORS_ORIGIN_PATTERN
  ? new RegExp(process.env.CORS_ORIGIN_PATTERN)
  : null;

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (corsPattern && corsPattern.test(origin)) return callback(null, true);
    callback(new Error(`CORS: origin not allowed — ${origin}`));
  },
  credentials: true,
}));

// ── Cookie & body parsing ─────────────────────────────────────────────────────
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Rate limiting ─────────────────────────────────────────────────────────────
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
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
app.use('/api/auth/login',       authLimiter);
app.use('/api/owner-auth/login', authLimiter);

// ── Routes ────────────────────────────────────────────────────────────────────
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
app.use('/api/employees',    employeeRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
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

// ── Draft expiration: clean up on startup and every hour ─────────────────────
cleanupExpiredDrafts();
setInterval(cleanupExpiredDrafts, 60 * 60 * 1000);

// ── Overdue contracts: mark ACTIVE→OVERDUE on startup and every 30 min ───────
autoMarkOverdue();
setInterval(autoMarkOverdue, 30 * 60 * 1000);

// ── Server start ──────────────────────────────────────────────────────────────
const server = app.listen(PORT, () => {
  if (!isProd) console.log(`Server running on port ${PORT}`);
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

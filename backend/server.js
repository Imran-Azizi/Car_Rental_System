import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { errorHandler } from './middleware/auth.js';
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

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/guarantors', guarantorRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/car-owners', carOwnerRoutes);
app.use('/api/owner-auth', ownerAuthRoutes);
app.use('/api/owner-portal', ownerPortalRoutes);
app.use('/api/expenses', expenseRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'OK', message: 'سرور فعال است' }));
app.use(errorHandler);

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
export default app;

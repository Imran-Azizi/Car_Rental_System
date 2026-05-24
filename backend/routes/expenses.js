import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate } from '../middleware/auth.js';
import { authenticateOwner } from '../middleware/ownerAuth.js';
import {
  getExpenses, getExpenseById, getExpenseStats,
  createExpense, updateExpense, deleteExpense,
} from '../controllers/expenseController.js';

/* ensure upload directory exists */
const uploadDir = 'uploads/expenses/';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `expense-receipt-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
  },
});
const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  cb(null, allowed.includes(file.mimetype));
};
const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
const receiptUpload = upload.single('receiptPhoto');

const router = express.Router();

// ── Admin routes (full access) ───────────────────────────────────────────────
router.get('/stats',  authenticate, getExpenseStats);
router.get('/',       authenticate, getExpenses);
router.get('/:id',    authenticate, getExpenseById);
router.post('/',      authenticate, receiptUpload, createExpense);
router.put('/:id',    authenticate, receiptUpload, updateExpense);
router.delete('/:id', authenticate, deleteExpense);

export default router;

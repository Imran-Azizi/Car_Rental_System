import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { authenticateOwner } from '../middleware/ownerAuth.js';
import {
  getExpenses, getExpenseById, getExpenseStats,
  createExpense, updateExpense, deleteExpense,
} from '../controllers/expenseController.js';
import { createUpload, cloudinaryMiddleware } from '../utils/storage.js';

const upload        = createUpload('expenses');
const receiptUpload = upload.single('receiptPhoto');

const router = express.Router();

router.get('/stats',  authenticate, getExpenseStats);
router.get('/',       authenticate, getExpenses);
router.get('/:id',    authenticate, getExpenseById);
router.post('/',      authenticate, receiptUpload, cloudinaryMiddleware('expenses'), createExpense);
router.put('/:id',    authenticate, receiptUpload, cloudinaryMiddleware('expenses'), updateExpense);
router.delete('/:id', authenticate, deleteExpense);

export default router;

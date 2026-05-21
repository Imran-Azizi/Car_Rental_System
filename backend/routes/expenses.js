import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { authenticateOwner } from '../middleware/ownerAuth.js';
import {
  getExpenses, getExpenseById, getExpenseStats,
  createExpense, updateExpense, deleteExpense,
} from '../controllers/expenseController.js';

const router = express.Router();

// ── Admin routes (full access) ───────────────────────────────────────────────
router.get('/stats',  authenticate, getExpenseStats);
router.get('/',       authenticate, getExpenses);
router.get('/:id',    authenticate, getExpenseById);
router.post('/',      authenticate, createExpense);
router.put('/:id',    authenticate, updateExpense);
router.delete('/:id', authenticate, deleteExpense);

export default router;

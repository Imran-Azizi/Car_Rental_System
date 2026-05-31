import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getSalaryStats,
  createSalaryPayment,
  getSalaryPayments,
  getSalaryPaymentById,
  deleteSalaryPayment,
} from '../controllers/employeeController.js';

const router = express.Router();
router.use(authenticate);

// Employee CRUD
router.get('/stats',    getSalaryStats);
router.get('/',         getEmployees);
router.get('/:id',      getEmployeeById);
router.post('/',        createEmployee);
router.put('/:id',      updateEmployee);
router.delete('/:id',   deleteEmployee);

// Salary payments
router.get('/payments/all',  getSalaryPayments);
router.get('/payments/:id',  getSalaryPaymentById);
router.post('/payments',     createSalaryPayment);
router.delete('/payments/:id', deleteSalaryPayment);

export default router;

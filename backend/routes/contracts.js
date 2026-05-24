import express from 'express';
import {
  getContracts, getContractById, createContract,
  updateContract, markAsReturned, addPayment, deleteContract,
  triggerOverdueCheck,
} from '../controllers/contractController.js';
import { authenticate } from '../middleware/auth.js';
import { createUpload, cloudinaryMiddleware } from '../utils/storage.js';

const upload   = createUpload('contracts');
const docFields = upload.fields([
  { name: 'billDocPhoto',     maxCount: 1 },
  { name: 'tazkiraDocPhoto',  maxCount: 1 },
  { name: 'tazkiraDocPhoto2', maxCount: 1 },
]);

const router = express.Router();
router.use(authenticate);

router.get('/',               getContracts);
router.get('/:id',            getContractById);
router.post('/',              docFields, cloudinaryMiddleware('contracts'), createContract);
router.put('/:id',            docFields, cloudinaryMiddleware('contracts'), updateContract);
router.patch('/:id/return',   markAsReturned);
router.post('/:id/payment',   addPayment);
router.delete('/:id',         deleteContract);
router.post('/overdue-check', triggerOverdueCheck);

export default router;

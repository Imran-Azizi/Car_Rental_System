import express from 'express';
import {
  getCarOwners,
  getCarOwnerById,
  createCarOwner,
  updateCarOwner,
  deleteCarOwner,
  getCarOwnerPaymentStats,
  getNextCarOwnerPaymentReceiptNumber,
  getCarOwnerPayments,
  getCarOwnerPaymentById,
  createCarOwnerPayment,
  updateCarOwnerPayment,
  deleteCarOwnerPayment,
} from '../controllers/carOwnerController.js';
import { authenticate } from '../middleware/auth.js';
import { createUpload, cloudinaryMiddleware } from '../utils/storage.js';

const upload = createUpload('owners');

const router = express.Router();
router.use(authenticate);

router.get('/payment-stats', getCarOwnerPaymentStats);
router.get('/payments/next-receipt-number', getNextCarOwnerPaymentReceiptNumber);
router.get('/payments/all', getCarOwnerPayments);
router.get('/payments/:id', getCarOwnerPaymentById);
router.post('/payments', createCarOwnerPayment);
router.put('/payments/:id', updateCarOwnerPayment);
router.delete('/payments/:id', deleteCarOwnerPayment);

router.get('/',    getCarOwners);
router.get('/:id', getCarOwnerById);
router.post('/',   upload.single('photo'), cloudinaryMiddleware('owners'), createCarOwner);
router.put('/:id', upload.single('photo'), cloudinaryMiddleware('owners'), updateCarOwner);
router.delete('/:id', deleteCarOwner);

export default router;

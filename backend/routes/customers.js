import express from 'express';
import { getCustomers, getCustomerById, createCustomer, updateCustomer, deleteCustomer } from '../controllers/customerController.js';
import { authenticate } from '../middleware/auth.js';
import { createUpload, cloudinaryMiddleware } from '../utils/storage.js';

const upload = createUpload('customers');

const router = express.Router();
router.use(authenticate);

router.get('/',    getCustomers);
router.get('/:id', getCustomerById);
router.post('/',   upload.single('photo'), cloudinaryMiddleware('customers'), createCustomer);
router.put('/:id', upload.single('photo'), cloudinaryMiddleware('customers'), updateCustomer);
router.delete('/:id', deleteCustomer);

export default router;

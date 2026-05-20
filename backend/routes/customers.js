import express from 'express';
import multer from 'multer';
import path from 'path';
import { getCustomers, getCustomerById, createCustomer, updateCustomer, deleteCustomer } from '../controllers/customerController.js';
import { authenticate } from '../middleware/auth.js';

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/customers/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `customer-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
  },
});
const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  cb(null, allowed.includes(file.mimetype));
};
const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

const router = express.Router();
router.use(authenticate);

router.get('/', getCustomers);
router.get('/:id', getCustomerById);
router.post('/', upload.single('photo'), createCustomer);
router.put('/:id', upload.single('photo'), updateCustomer);
router.delete('/:id', deleteCustomer);

export default router;

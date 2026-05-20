import express from 'express';
import multer from 'multer';
import path from 'path';
import { getCarOwners, getCarOwnerById, createCarOwner, updateCarOwner, deleteCarOwner } from '../controllers/carOwnerController.js';
import { authenticate } from '../middleware/auth.js';

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/owners/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `owner-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('فقط فایل‌های تصویری (JPEG, PNG, WebP) قابل قبول هستند'), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

const router = express.Router();
router.use(authenticate);

router.get('/', getCarOwners);
router.get('/:id', getCarOwnerById);
router.post('/', upload.single('photo'), createCarOwner);
router.put('/:id', upload.single('photo'), updateCarOwner);
router.delete('/:id', deleteCarOwner);

export default router;

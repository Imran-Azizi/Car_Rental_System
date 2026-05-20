import express from 'express';
import multer from 'multer';
import path from 'path';
import { getCars, getCarById, createCar, updateCar, deleteCar } from '../controllers/carController.js';
import { addCarImage, deleteCarImage } from '../controllers/carImageController.js';
import { authenticate } from '../middleware/auth.js';

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/cars/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `car-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('فقط فایل‌های تصویری مجاز هستند'), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

const router = express.Router();
router.use(authenticate);

router.get('/', getCars);
router.get('/:id', getCarById);
router.post('/', createCar);
router.put('/:id', updateCar);
router.delete('/:id', deleteCar);

// Car images
router.post('/:id/images', upload.single('image'), addCarImage);
router.delete('/:id/images/:imageId', deleteCarImage);

export default router;

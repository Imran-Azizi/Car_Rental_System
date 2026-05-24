import express from 'express';
import multer from 'multer';
import path from 'path';
import { getGuarantors, getGuarantorById, createGuarantor, updateGuarantor, deleteGuarantor } from '../controllers/guarantorController.js';
import { authenticate } from '../middleware/auth.js';

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/guarantors/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `guarantor-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
  },
});
const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  cb(null, allowed.includes(file.mimetype));
};
const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

const router = express.Router();
router.use(authenticate);

router.get('/', getGuarantors);
router.get('/:id', getGuarantorById);
const photoFields = upload.fields([
  { name: 'photo',  maxCount: 1 },
  { name: 'photo2', maxCount: 1 },
]);
router.post('/', photoFields, createGuarantor);
router.put('/:id', photoFields, updateGuarantor);
router.delete('/:id', deleteGuarantor);

export default router;

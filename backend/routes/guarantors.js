import express from 'express';
import { getGuarantors, getGuarantorById, createGuarantor, updateGuarantor, deleteGuarantor } from '../controllers/guarantorController.js';
import { authenticate } from '../middleware/auth.js';
import { createUpload, cloudinaryMiddleware } from '../utils/storage.js';

const upload = createUpload('guarantors');
const photoFields = upload.fields([
  { name: 'photo',  maxCount: 1 },
  { name: 'photo2', maxCount: 1 },
]);

const router = express.Router();
router.use(authenticate);

router.get('/',    getGuarantors);
router.get('/:id', getGuarantorById);
router.post('/',   photoFields, cloudinaryMiddleware('guarantors'), createGuarantor);
router.put('/:id', photoFields, cloudinaryMiddleware('guarantors'), updateGuarantor);
router.delete('/:id', deleteGuarantor);

export default router;

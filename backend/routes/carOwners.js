import express from 'express';
import { getCarOwners, getCarOwnerById, createCarOwner, updateCarOwner, deleteCarOwner } from '../controllers/carOwnerController.js';
import { authenticate } from '../middleware/auth.js';
import { createUpload, cloudinaryMiddleware } from '../utils/storage.js';

const upload = createUpload('owners');

const router = express.Router();
router.use(authenticate);

router.get('/',    getCarOwners);
router.get('/:id', getCarOwnerById);
router.post('/',   upload.single('photo'), cloudinaryMiddleware('owners'), createCarOwner);
router.put('/:id', upload.single('photo'), cloudinaryMiddleware('owners'), updateCarOwner);
router.delete('/:id', deleteCarOwner);

export default router;

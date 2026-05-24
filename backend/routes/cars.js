import express from 'express';
import { getCars, getCarById, createCar, updateCar, deleteCar } from '../controllers/carController.js';
import { addCarImage, deleteCarImage } from '../controllers/carImageController.js';
import { authenticate } from '../middleware/auth.js';
import { createUpload, cloudinaryMiddleware } from '../utils/storage.js';

const upload = createUpload('cars');

const router = express.Router();
router.use(authenticate);

router.get('/',    getCars);
router.get('/:id', getCarById);
router.post('/',   createCar);
router.put('/:id', updateCar);
router.delete('/:id', deleteCar);

router.post('/:id/images',        upload.single('image'), cloudinaryMiddleware('cars'), addCarImage);
router.delete('/:id/images/:imageId', deleteCarImage);

export default router;

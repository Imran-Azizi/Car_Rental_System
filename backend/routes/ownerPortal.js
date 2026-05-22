import express from 'express';
import { authenticateOwner } from '../middleware/ownerAuth.js';
import { getOwnerDashboard, getOwnerCars, getOwnerContracts } from '../controllers/ownerPortalController.js';

const router = express.Router();
router.use(authenticateOwner);

router.get('/dashboard', getOwnerDashboard);
router.get('/cars', getOwnerCars);
router.get('/contracts', getOwnerContracts);

export default router;

import express from 'express';
import { ownerLogin, ownerGetMe, ownerLogout, ownerRefresh } from '../controllers/ownerAuthController.js';
import { authenticateOwner } from '../middleware/ownerAuth.js';

const router = express.Router();

router.post('/login', ownerLogin);
router.get('/me', authenticateOwner, ownerGetMe);
router.post('/logout', ownerLogout);
router.post('/refresh', ownerRefresh);

export default router;

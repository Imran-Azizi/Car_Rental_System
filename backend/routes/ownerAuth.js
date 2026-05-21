import express from 'express';
import { ownerLogin, ownerGetMe } from '../controllers/ownerAuthController.js';
import { authenticateOwner } from '../middleware/ownerAuth.js';

const router = express.Router();

router.post('/login', ownerLogin);
router.get('/me', authenticateOwner, ownerGetMe);

export default router;

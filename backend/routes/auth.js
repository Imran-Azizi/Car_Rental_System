import express from 'express';
import { login, getMe, refresh, logout } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
const router = express.Router();
router.post('/login', login);
router.get('/me', authenticate, getMe);
router.post('/refresh', refresh);
router.post('/logout', logout);
export default router;

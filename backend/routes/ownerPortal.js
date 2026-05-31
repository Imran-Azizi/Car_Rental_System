import express from 'express';
import { authenticateOwner } from '../middleware/ownerAuth.js';
import {
  getOwnerDashboard,
  getOwnerCars,
  getOwnerContracts,
  getOwnerPayments,
  getOwnerNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
} from '../controllers/ownerPortalController.js';

const router = express.Router();
router.use(authenticateOwner);

router.get('/dashboard',  getOwnerDashboard);
router.get('/cars',       getOwnerCars);
router.get('/contracts',  getOwnerContracts);
router.get('/payments',   getOwnerPayments);

// Notifications
router.get('/notifications',               getOwnerNotifications);
router.get('/notifications/unread-count',  getUnreadNotificationCount);
router.patch('/notifications/read-all',    markAllNotificationsRead);
router.patch('/notifications/:id/read',    markNotificationRead);

export default router;

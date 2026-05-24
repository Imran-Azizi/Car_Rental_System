import express from 'express';
import multer from 'multer';
import path from 'path';
import {
  getContracts, getContractById, createContract,
  updateContract, markAsReturned, addPayment, deleteContract,
  triggerOverdueCheck,
} from '../controllers/contractController.js';
import { authenticate } from '../middleware/auth.js';

/* ── multer: contract document photos ── */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/contracts/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `contract-${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
  },
});
const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  cb(null, allowed.includes(file.mimetype));
};
const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

const docFields = upload.fields([
  { name: 'billDocPhoto',     maxCount: 1 },
  { name: 'tazkiraDocPhoto',  maxCount: 1 },
  { name: 'tazkiraDocPhoto2', maxCount: 1 },
]);

const router = express.Router();
router.use(authenticate);

router.get('/',                  getContracts);
router.get('/:id',               getContractById);
router.post('/',                 docFields, createContract);
router.put('/:id',               docFields, updateContract);
router.patch('/:id/return',      markAsReturned);
router.post('/:id/payment',      addPayment);
router.delete('/:id',            deleteContract);
router.post('/overdue-check',    triggerOverdueCheck); // admin trigger or cron ping

export default router;

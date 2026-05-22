import express from 'express';
import { getDrafts, getDraftById, createDraft, updateDraft, deleteDraft } from '../controllers/draftController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);

router.get('/',     getDrafts);
router.get('/:id',  getDraftById);
router.post('/',    createDraft);
router.put('/:id',  updateDraft);
router.delete('/:id', deleteDraft);

export default router;

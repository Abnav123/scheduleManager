import express from 'express';
import {
  saveDiaryEntry,
  getDiaryEntryByDate,
  deleteDiaryEntry,
  searchDiaryEntries,
} from '../controllers/diaryController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // Secure all routes

router.route('/')
  .get(getDiaryEntryByDate)
  .post(saveDiaryEntry);

router.get('/search', searchDiaryEntries);
router.delete('/:id', deleteDiaryEntry);

export default router;

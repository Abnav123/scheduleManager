import express from 'express';
import { getNotesPlaceholder, createNoteDummy } from '../controllers/noteController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // Secure all routes

router.route('/')
  .get(getNotesPlaceholder)
  .post(createNoteDummy);

export default router;

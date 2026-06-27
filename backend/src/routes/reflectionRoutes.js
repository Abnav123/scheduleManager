import express from 'express';
import { saveReflection, getReflectionByDate } from '../controllers/reflectionController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // Secure all routes

router.route('/')
  .get(getReflectionByDate)
  .post(saveReflection);

export default router;

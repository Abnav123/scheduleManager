import express from 'express';
import authRoutes from './authRoutes.js';
import timetableRoutes from './timetableRoutes.js';
import taskRoutes from './taskRoutes.js';
import diaryRoutes from './diaryRoutes.js';
import reflectionRoutes from './reflectionRoutes.js';
import goalRoutes from './goalRoutes.js';
import noteRoutes from './noteRoutes.js';
import statsRoutes from './statsRoutes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/timetables', timetableRoutes);
router.use('/tasks', taskRoutes);
router.use('/diary', diaryRoutes);
router.use('/reflection', reflectionRoutes);
router.use('/goals', goalRoutes);
router.use('/notes', noteRoutes);
router.use('/stats', statsRoutes);

export default router;

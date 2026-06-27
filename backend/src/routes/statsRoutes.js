import express from 'express';
import {
  getDashboardData,
  getCalendarData,
  getHeatmapData,
  getReportData,
  getAchievementsList,
  getTimelineData,
} from '../controllers/statsController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // Secure all routes

router.get('/dashboard', getDashboardData);
router.get('/calendar', getCalendarData);
router.get('/heatmap', getHeatmapData);
router.get('/report', getReportData);
router.get('/achievements', getAchievementsList);
router.get('/timeline', getTimelineData);

export default router;

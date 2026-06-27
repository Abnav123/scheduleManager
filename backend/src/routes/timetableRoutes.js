import express from 'express';
import {
  createTimetable,
  getTimetables,
  getTimetableById,
  updateTimetable,
  deleteTimetable,
  addOrUpdateOverride,
} from '../controllers/timetableController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // Secure all routes

router.route('/')
  .post(createTimetable)
  .get(getTimetables);

router.route('/:id')
  .get(getTimetableById)
  .put(updateTimetable)
  .delete(deleteTimetable);

router.route('/:id/overrides')
  .post(addOrUpdateOverride);

export default router;

import express from 'express';
import {
  getTasksForDate,
  createCustomTask,
  editTaskInstance,
  deleteTaskInstance,
  markTaskComplete,
  spendXpForDuration,
  markTaskUnavoidable,
  updatePunishment,
} from '../controllers/taskController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // Secure all routes

router.route('/')
  .get(getTasksForDate)
  .post(createCustomTask);

router.route('/:id')
  .put(editTaskInstance)
  .delete(deleteTaskInstance);

router.post('/:id/complete', markTaskComplete);
router.post('/:id/reduce-duration', spendXpForDuration);
router.post('/:id/unavoidable', markTaskUnavoidable);
router.post('/:id/punishment', updatePunishment);

export default router;

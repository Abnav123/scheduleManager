import express from 'express';
import { createGoal, getGoals, updateGoal, deleteGoal } from '../controllers/goalController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // Secure all routes

router.route('/')
  .get(getGoals)
  .post(createGoal);

router.route('/:id')
  .put(updateGoal)
  .delete(deleteGoal);

export default router;

import Goal from '../models/Goal.js';
import { getNowIST } from '../utils/dateHelper.js';
import moment from 'moment-timezone';

/**
 * @desc    Create a new goal
 * @route   POST /api/goals
 * @access  Private (Admin)
 */
export const createGoal = async (req, res, next) => {
  try {
    const { name, targetValue, type, category, startDate, endDate } = req.body;

    if (!name || !targetValue || !type || !startDate || !endDate) {
      res.status(400);
      throw new Error('Please fill all required fields');
    }

    if (!['FocusHours', 'TasksCompleted', 'Custom'].includes(type)) {
      res.status(400);
      throw new Error("Goal type must be one of: 'FocusHours', 'TasksCompleted', 'Custom'");
    }

    const start = moment.tz(startDate, 'Asia/Kolkata').startOf('day').toDate();
    const end = moment.tz(endDate, 'Asia/Kolkata').endOf('day').toDate();

    if (start > end) {
      res.status(400);
      throw new Error('Start date must be before end date');
    }

    const goal = await Goal.create({
      userId: req.user._id,
      name,
      targetValue: Number(targetValue),
      currentValue: 0,
      type,
      category: category || null,
      status: 'Active',
      startDate: start,
      endDate: end,
    });

    res.status(201).json(goal);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all goals (optionally filtered by status)
 * @route   GET /api/goals
 * @access  Private (Admin)
 */
export const getGoals = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = { userId: req.user._id };
    
    if (status) {
      filter.status = status;
    }

    // Auto-update expired Active goals to 'Failed' if end date passed
    const now = getNowIST().toDate();
    const expiredActiveGoals = await Goal.find({
      userId: req.user._id,
      status: 'Active',
      endDate: { $lt: now },
    });

    for (const goal of expiredActiveGoals) {
      goal.status = 'Failed';
      await goal.save();
    }

    const goals = await Goal.find(filter).sort({ endDate: 1 });
    res.json(goals);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a goal (including manually updating currentValue/status)
 * @route   PUT /api/goals/:id
 * @access  Private (Admin)
 */
export const updateGoal = async (req, res, next) => {
  try {
    const { name, targetValue, currentValue, type, category, status, startDate, endDate } = req.body;
    const goal = await Goal.findOne({ _id: req.params.id, userId: req.user._id });

    if (!goal) {
      res.status(404);
      throw new Error('Goal not found');
    }

    if (name) goal.name = name;
    if (targetValue !== undefined) goal.targetValue = Number(targetValue);
    if (type) goal.type = type;
    if (category !== undefined) goal.category = category || null;

    if (currentValue !== undefined) {
      goal.currentValue = Number(currentValue);
      // Auto complete if target reached
      if (goal.currentValue >= goal.targetValue) {
        goal.status = 'Completed';
      }
    }

    if (status) {
      if (!['Active', 'Completed', 'Failed'].includes(status)) {
        res.status(400);
        throw new Error("Invalid goal status. Must be: 'Active', 'Completed', 'Failed'");
      }
      goal.status = status;
    }

    if (startDate) {
      goal.startDate = moment.tz(startDate, 'Asia/Kolkata').startOf('day').toDate();
    }

    if (endDate) {
      goal.endDate = moment.tz(endDate, 'Asia/Kolkata').endOf('day').toDate();
    }

    const updatedGoal = await goal.save();
    res.json(updatedGoal);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a goal
 * @route   DELETE /api/goals/:id
 * @access  Private (Admin)
 */
export const deleteGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, userId: req.user._id });
    if (!goal) {
      res.status(404);
      throw new Error('Goal not found');
    }
    await goal.deleteOne();
    res.json({ message: 'Goal removed' });
  } catch (error) {
    next(error);
  }
};

import TaskInstance from '../models/TaskInstance.js';
import User from '../models/User.js';
import {
  generateDailyTasks,
  completeTask,
  reduceTaskDuration,
  markUnavoidable,
} from '../services/taskService.js';
import { getTodayIST, parseISTTime, getDiffMinutes, getNowIST } from '../utils/dateHelper.js';
import moment from 'moment-timezone';

/**
 * @desc    Get tasks for a specific date (auto-generating if missing)
 * @route   GET /api/tasks
 * @access  Private (Admin)
 */
export const getTasksForDate = async (req, res, next) => {
  try {
    const dateStr = req.query.date || getTodayIST();
    // Validate format YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      res.status(400);
      throw new Error('Date format must be YYYY-MM-DD');
    }

    const tasks = await generateDailyTasks(dateStr, req.user._id);
    res.json(tasks);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a custom task instance
 * @route   POST /api/tasks
 * @access  Private (Admin)
 */
export const createCustomTask = async (req, res, next) => {
  try {
    const { name, category, date, startTime, endTime, punishment, notes } = req.body;

    if (!name || !category || !date || !startTime || !endTime || !punishment) {
      res.status(400);
      throw new Error('Please fill all required fields');
    }

    const scheduledStart = parseISTTime(date, startTime);
    const scheduledEnd = parseISTTime(date, endTime);
    
    if (scheduledStart >= scheduledEnd) {
      res.status(400);
      throw new Error('End time must be after start time');
    }

    const originalDuration = getDiffMinutes(scheduledStart, scheduledEnd);
    const now = getNowIST();

    let status = 'Upcoming';
    let punishmentStatus = 'None';

    if (now.isAfter(moment(scheduledEnd))) {
      status = 'Missed';
      punishmentStatus = 'Pending';
    } else if (now.isSameOrAfter(moment(scheduledStart)) && now.isSameOrBefore(moment(scheduledEnd))) {
      const fiveMinsBeforeEnd = moment(scheduledEnd).subtract(5, 'minutes');
      status = now.isSameOrAfter(fiveMinsBeforeEnd) ? 'Ready To Complete' : 'In Progress';
    }

    const task = await TaskInstance.create({
      userId: req.user._id,
      name,
      category,
      date,
      startTime,
      endTime,
      scheduledStart,
      scheduledEnd,
      punishment,
      notes: notes || '',
      status,
      punishmentStatus,
      originalDuration,
      reducedDuration: originalDuration,
    });

    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Edit a task instance
 * @route   PUT /api/tasks/:id
 * @access  Private (Admin)
 */
export const editTaskInstance = async (req, res, next) => {
  try {
    const { name, category, startTime, endTime, punishment, notes } = req.body;
    const task = await TaskInstance.findOne({ _id: req.params.id, userId: req.user._id });

    if (!task) {
      res.status(404);
      throw new Error('Task not found');
    }

    const now = getNowIST();
    if (now.isAfter(moment(task.scheduledEnd))) {
      res.status(400);
      throw new Error('Task is immutable because its end time has passed');
    }

    if (task.status === 'Completed' || task.status === 'Missed' || task.status === 'Unavoidable') {
      res.status(400);
      throw new Error(`Task is immutable (Status: ${task.status})`);
    }

    if (name) task.name = name;
    if (category) task.category = category;
    if (punishment) task.punishment = punishment;
    if (notes !== undefined) task.notes = notes;

    if (startTime || endTime) {
      const startStr = startTime || task.startTime;
      const endStr = endTime || task.endTime;

      const scheduledStart = parseISTTime(task.date, startStr);
      const scheduledEnd = parseISTTime(task.date, endStr);

      if (scheduledStart >= scheduledEnd) {
        res.status(400);
        throw new Error('End time must be after start time');
      }

      task.startTime = startStr;
      task.endTime = endStr;
      task.scheduledStart = scheduledStart;
      task.scheduledEnd = scheduledEnd;

      const originalDuration = getDiffMinutes(scheduledStart, scheduledEnd);
      task.originalDuration = originalDuration;
      task.reducedDuration = originalDuration; // reset reduction if times modified
      if (task.xpSpent > 0) {
        const user = await User.findById(req.user._id);
        if (user) {
          user.xp += task.xpSpent;
          user.xpSpent = Math.max(0, user.xpSpent - task.xpSpent);
          await user.save();
        }
      }
      task.xpSpent = 0;
    }

    const updatedTask = await task.save();
    res.json(updatedTask);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a task instance
 * @route   DELETE /api/tasks/:id
 * @access  Private (Admin)
 */
export const deleteTaskInstance = async (req, res, next) => {
  try {
    const task = await TaskInstance.findOne({ _id: req.params.id, userId: req.user._id });
    if (!task) {
      res.status(404);
      throw new Error('Task not found');
    }
    const now = getNowIST();
    if (now.isAfter(moment(task.scheduledEnd))) {
      res.status(400);
      throw new Error('Task is immutable because its end time has passed');
    }
    if (task.xpSpent > 0) {
      const user = await User.findById(req.user._id);
      if (user) {
        user.xp += task.xpSpent;
        user.xpSpent = Math.max(0, user.xpSpent - task.xpSpent);
        await user.save();
      }
    }
    await task.deleteOne();
    res.json({ message: 'Task instance removed' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Complete a task
 * @route   POST /api/tasks/:id/complete
 * @access  Private (Admin)
 */
export const markTaskComplete = async (req, res, next) => {
  try {
    const updatedTask = await completeTask(req.params.id, req.user);
    res.json(updatedTask);
  } catch (error) {
    res.status(400);
    next(error);
  }
};

/**
 * @desc    Spend XP to reduce task duration
 * @route   POST /api/tasks/:id/reduce-duration
 * @access  Private (Admin)
 */
export const spendXpForDuration = async (req, res, next) => {
  try {
    const { minutes } = req.body;
    if (!minutes || minutes <= 0) {
      res.status(400);
      throw new Error('Please specify valid minutes to reduce');
    }
    const updatedTask = await reduceTaskDuration(req.params.id, Number(minutes), req.user);
    res.json(updatedTask);
  } catch (error) {
    res.status(400);
    next(error);
  }
};

/**
 * @desc    Mark a task as unavoidable
 * @route   POST /api/tasks/:id/unavoidable
 * @access  Private (Admin)
 */
export const markTaskUnavoidable = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const updatedTask = await markUnavoidable(req.params.id, reason, req.user._id);
    res.json(updatedTask);
  } catch (error) {
    res.status(400);
    next(error);
  }
};

/**
 * @desc    Update a missed task's punishment status
 * @route   POST /api/tasks/:id/punishment
 * @access  Private (Admin)
 */
export const updatePunishment = async (req, res, next) => {
  try {
    const { status } = req.body; // 'Pending' or 'Completed'
    if (!['Pending', 'Completed'].includes(status)) {
      res.status(400);
      throw new Error("Punishment status must be 'Pending' or 'Completed'");
    }

    const task = await TaskInstance.findOne({ _id: req.params.id, userId: req.user._id });
    if (!task) {
      res.status(404);
      throw new Error('Task not found');
    }

    if (task.status !== 'Missed') {
      res.status(400);
      throw new Error('Punishment tracking is only valid for Missed tasks');
    }

    task.punishmentStatus = status;
    await task.save();
    res.json(task);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all pending punishments
 * @route   GET /api/tasks/punishments/pending
 * @access  Private (Admin)
 */
export const getPendingPunishments = async (req, res, next) => {
  try {
    const punishments = await TaskInstance.find({
      userId: req.user._id,
      status: 'Missed',
      punishmentStatus: 'Pending',
    }).sort({ date: -1, startTime: -1 });
    res.json(punishments);
  } catch (error) {
    next(error);
  }
};

import Timetable from '../models/Timetable.js';
import TaskInstance from '../models/TaskInstance.js';
import User from '../models/User.js';
import { toISTDateString } from '../utils/dateHelper.js';
import moment from 'moment-timezone';
import { updateStreak } from '../services/taskService.js';

const refundXpForTasks = async (filter, userId) => {
  try {
    const tasksToRefund = await TaskInstance.find(filter);
    const totalRefund = tasksToRefund.reduce((sum, t) => sum + (t.xpSpent || 0), 0);
    if (totalRefund > 0) {
      const user = await User.findById(userId);
      if (user) {
        user.xp += totalRefund;
        user.xpSpent = Math.max(0, user.xpSpent - totalRefund);
        await user.save();
        console.log(`Refunded ${totalRefund} XP to user ${user.username}. New XP: ${user.xp}`);
      }
    }
  } catch (err) {
    console.error('Error during XP refund:', err);
  }
};

/**
 * Helper to check if a list of tasks has any time overlaps
 * @param {Array} tasks - Array of task templates with { startTime, endTime, name }
 * @returns {string|null} - Error message describing the overlap, or null if no overlap
 */
const checkTaskOverlaps = (tasks) => {
  const sorted = [...tasks].sort((a, b) => a.startTime.localeCompare(b.startTime));
  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];
    if (current.endTime > next.startTime) {
      return `Task "${current.name}" (${current.startTime} - ${current.endTime}) overlaps with task "${next.name}" (${next.startTime} - ${next.endTime})`;
    }
  }
  return null;
};


/**
 * @desc    Create a new timetable
 * @route   POST /api/timetables
 * @access  Private (Admin)
 */
export const createTimetable = async (req, res, next) => {
  try {
    const { name, startDate, endDate, defaultSchedule, overrides } = req.body;

    if (!name || !startDate || !endDate) {
      res.status(400);
      throw new Error('Please fill all required fields');
    }

    // Validate default schedule task overlaps
    if (defaultSchedule && defaultSchedule.length > 0) {
      const overlapErr = checkTaskOverlaps(defaultSchedule);
      if (overlapErr) {
        res.status(400);
        throw new Error(overlapErr);
      }
    }

    // Validate overrides task overlaps
    if (overrides && overrides.length > 0) {
      for (const ov of overrides) {
        const overlapErr = checkTaskOverlaps(ov.tasks);
        if (overlapErr) {
          res.status(400);
          throw new Error(`Override date ${ov.date} has overlapping tasks: ${overlapErr}`);
        }
      }
    }

    const start = moment.tz(startDate, 'Asia/Kolkata').startOf('day').toDate();
    const end = moment.tz(endDate, 'Asia/Kolkata').endOf('day').toDate();

    if (start > end) {
      res.status(400);
      throw new Error('Start date must be before end date');
    }

    // Check for overlap with existing timetables for this user
    const overlap = await Timetable.findOne({
      userId: req.user._id,
      $or: [
        { startDate: { $lte: end }, endDate: { $gte: start } },
      ],
    });

    if (overlap) {
      res.status(400);
      throw new Error(`Timetable dates overlap with existing timetable: ${overlap.name}`);
    }

    const timetable = await Timetable.create({
      userId: req.user._id,
      name,
      startDate: start,
      endDate: end,
      defaultSchedule: defaultSchedule || [],
      overrides: overrides || [],
    });

    res.status(201).json(timetable);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all timetables
 * @route   GET /api/timetables
 * @access  Private (Admin)
 */
export const getTimetables = async (req, res, next) => {
  try {
    const timetables = await Timetable.find({ userId: req.user._id }).sort({ startDate: -1 });
    res.json(timetables);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single timetable details
 * @route   GET /api/timetables/:id
 * @access  Private (Admin)
 */
export const getTimetableById = async (req, res, next) => {
  try {
    const timetable = await Timetable.findOne({ _id: req.params.id, userId: req.user._id });
    if (!timetable) {
      res.status(404);
      throw new Error('Timetable not found');
    }
    res.json(timetable);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a timetable
 * @route   PUT /api/timetables/:id
 * @access  Private (Admin)
 */
export const updateTimetable = async (req, res, next) => {
  try {
    const { name, startDate, endDate, defaultSchedule } = req.body;
    const timetable = await Timetable.findOne({ _id: req.params.id, userId: req.user._id });

    if (!timetable) {
      res.status(404);
      throw new Error('Timetable not found');
    }

    if (name) timetable.name = name;
    
    if (startDate || endDate) {
      const start = startDate ? moment.tz(startDate, 'Asia/Kolkata').startOf('day').toDate() : timetable.startDate;
      const end = endDate ? moment.tz(endDate, 'Asia/Kolkata').endOf('day').toDate() : timetable.endDate;

      if (start > end) {
        res.status(400);
        throw new Error('Start date must be before end date');
      }

      // Check overlap excluding itself for this user
      const overlap = await Timetable.findOne({
        userId: req.user._id,
        _id: { $ne: timetable._id },
        startDate: { $lte: end },
        endDate: { $gte: start },
      });

      if (overlap) {
        res.status(400);
        throw new Error(`Timetable dates overlap with existing timetable: ${overlap.name}`);
      }

      timetable.startDate = start;
      timetable.endDate = end;
    }

    if (defaultSchedule) {
      const overlapErr = checkTaskOverlaps(defaultSchedule);
      if (overlapErr) {
        res.status(400);
        throw new Error(overlapErr);
      }

      timetable.defaultSchedule = defaultSchedule;

      // Clear overrides for today and the future so they reset to this new default schedule
      const todayStr = moment().tz('Asia/Kolkata').format('YYYY-MM-DD');
      timetable.overrides = timetable.overrides.filter((ov) => ov.date < todayStr);
      timetable.markModified('overrides');

      // Delete all future task instances generated from this timetable (not started yet)
      // so they can be regenerated using the new default schedule blueprint
      const now = moment().tz('Asia/Kolkata').toDate();
      const filter = {
        userId: req.user._id,
        timetableId: timetable._id,
        scheduledStart: { $gt: now }
      };
      await refundXpForTasks(filter, req.user._id);
      await TaskInstance.deleteMany(filter);
    }

    const updatedTimetable = await timetable.save();
    res.json(updatedTimetable);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a timetable
 * @route   DELETE /api/timetables/:id
 * @access  Private (Admin)
 */
export const deleteTimetable = async (req, res, next) => {
  try {
    const timetable = await Timetable.findOne({ _id: req.params.id, userId: req.user._id });
    if (!timetable) {
      res.status(404);
      throw new Error('Timetable not found');
    }

    const now = moment.tz('Asia/Kolkata').toDate();
    // Check if there are any generated task instances for this timetable that have already ended
    const pastTasksCount = await TaskInstance.countDocuments({
      userId: req.user._id,
      timetableId: timetable._id,
      scheduledEnd: { $lt: now }
    });

    if (pastTasksCount > 0) {
      res.status(400);
      throw new Error('Timetable cannot be deleted because it has task instances in the past');
    }

    // Delete all task instances generated from this timetable
    const filter = {
      userId: req.user._id,
      timetableId: timetable._id
    };
    await refundXpForTasks(filter, req.user._id);
    await TaskInstance.deleteMany(filter);

    await timetable.deleteOne();

    // Recalculate streak
    await updateStreak(req.user._id);

    res.json({ message: 'Timetable removed and all task instances cleared' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add or update a date override
 * @route   POST /api/timetables/:id/overrides
 * @access  Private (Admin)
 */
export const addOrUpdateOverride = async (req, res, next) => {
  try {
    const { date, tasks } = req.body; // date format: YYYY-MM-DD
    const timetable = await Timetable.findOne({ _id: req.params.id, userId: req.user._id });

    if (!timetable) {
      res.status(404);
      throw new Error('Timetable not found');
    }

    if (!date || !tasks) {
      res.status(400);
      throw new Error('Date and tasks details are required');
    }

    // Validate override task overlaps
    if (tasks && tasks.length > 0) {
      const overlapErr = checkTaskOverlaps(tasks);
      if (overlapErr) {
        res.status(400);
        throw new Error(overlapErr);
      }
    }

    // Verify date is within timetable range
    const overrideDate = moment.tz(date, 'YYYY-MM-DD', 'Asia/Kolkata').startOf('day').toDate();
    if (overrideDate < timetable.startDate || overrideDate > timetable.endDate) {
      res.status(400);
      throw new Error(`Override date ${date} is outside timetable range (${toISTDateString(timetable.startDate)} to ${toISTDateString(timetable.endDate)})`);
    }

    // Verify date is not in the past (completed date)
    const today = moment.tz('Asia/Kolkata').startOf('day').toDate();
    if (overrideDate < today) {
      res.status(400);
      throw new Error('Cannot add or modify overrides for completed (past) dates');
    }

    // Check if override for date already exists
    const overrideIndex = timetable.overrides.findIndex((ov) => ov.date === date);

    if (overrideIndex > -1) {
      // Update existing override
      timetable.overrides[overrideIndex].tasks = tasks;
    } else {
      // Add new override
      timetable.overrides.push({ date, tasks });
    }

    timetable.markModified('overrides');

    // Delete future task instances for this specific date
    // so they regenerate using the new override
    const now = moment().tz('Asia/Kolkata').toDate();
    const filter = {
      userId: req.user._id,
      timetableId: timetable._id,
      date,
      scheduledStart: { $gt: now }
    };
    await refundXpForTasks(filter, req.user._id);
    await TaskInstance.deleteMany(filter);

    const updatedTimetable = await timetable.save();
    res.json(updatedTimetable);
  } catch (error) {
    next(error);
  }
};

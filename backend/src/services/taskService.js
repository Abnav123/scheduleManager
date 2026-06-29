import TaskInstance from '../models/TaskInstance.js';
import Timetable from '../models/Timetable.js';
import User from '../models/User.js';
import {
  getNowIST,
  parseISTTime,
  getDiffMinutes,
} from '../utils/dateHelper.js';
import { checkAndUnlockAchievements } from './achievementService.js';
import { updateGoalProgress } from './goalService.js';
import moment from 'moment-timezone';

/**
 * Generate task instances for a specific date if they don't already exist for the user.
 * Lazy creation when user views a day.
 */
export const generateDailyTasks = async (dateStr, userId) => {
  // Clean up any orphaned task instances whose timetable has been deleted
  const activeTimetables = await Timetable.find({ userId }).select('_id');
  const activeIds = activeTimetables.map(t => t._id);
  const deletedRes = await TaskInstance.deleteMany({
    userId,
    timetableId: { $nin: activeIds }
  });
  if (deletedRes.deletedCount > 0) {
    await updateStreak(userId);
  }

  // Find active timetable for this date
  const targetDate = moment.tz(dateStr, 'Asia/Kolkata').startOf('day').toDate();
  const timetable = await Timetable.findOne({
    userId,
    startDate: { $lte: targetDate },
    endDate: { $gte: targetDate },
  });

  if (!timetable) {
    return [];
  }

  // Check if there is an override for this date
  const override = timetable.overrides.find((ov) => ov.date === dateStr);
  const taskTemplates = override ? override.tasks : timetable.defaultSchedule;

  // Get existing task instances for this date
  let existingInstances = await TaskInstance.find({ userId, date: dateStr }).sort({ createdAt: 1 });

  // Clean up duplicate task instances for this date (keep the earliest one, delete the rest)
  const seenKeys = new Set();
  const uniqueInstances = [];
  for (const inst of existingInstances) {
    const key = `${inst.name}_${inst.startTime}_${inst.endTime}`;
    if (seenKeys.has(key)) {
      await TaskInstance.deleteOne({ _id: inst._id, userId });
    } else {
      seenKeys.add(key);
      uniqueInstances.push(inst);
    }
  }
  existingInstances = uniqueInstances;

  const now = getNowIST();

  // Clean up any existing future task instances that are no longer in the template
  for (const inst of existingInstances) {
    const isFuture = moment(inst.scheduledStart).isAfter(now);
    if (isFuture) {
      const stillExistsInTemplate = taskTemplates.some(
        (temp) => temp.name === inst.name && 
                  temp.startTime === inst.startTime
      );
      if (!stillExistsInTemplate) {
        if (inst.xpSpent > 0) {
          const user = await User.findById(userId);
          if (user) {
            user.xp += inst.xpSpent;
            user.xpSpent = Math.max(0, user.xpSpent - inst.xpSpent);
            await user.save();
          }
        }
        await TaskInstance.deleteOne({ _id: inst._id, userId });
      }
    }
  }

  // Reload existing instances after cleanup
  const freshInstances = await TaskInstance.find({ userId, date: dateStr });

  for (const template of taskTemplates) {
    // Check if this template already has an instance (ignore endTime to account for duration reductions)
    const exists = freshInstances.some(
      (inst) => inst.name === template.name && 
                inst.startTime === template.startTime
    );

    if (!exists) {
      const scheduledStart = parseISTTime(dateStr, template.startTime);
      const scheduledEnd = parseISTTime(dateStr, template.endTime);
      const originalDuration = getDiffMinutes(scheduledStart, scheduledEnd);

      let status = 'Upcoming';
      let punishmentStatus = 'None';

      const startMoment = moment(scheduledStart);
      const endMoment = moment(scheduledEnd);

      if (now.isAfter(endMoment)) {
        status = 'Missed';
        punishmentStatus = 'Pending';
      } else if (now.isSameOrAfter(startMoment) && now.isSameOrBefore(endMoment)) {
        // Check if it's in the completion window: max of 5 mins or 3% of task duration
        const windowMinutes = Math.max(5, originalDuration * 0.03);
        const startWindow = moment(endMoment).subtract(windowMinutes, 'minutes');
        if (now.isSameOrAfter(startWindow)) {
          status = 'Ready To Complete';
        } else {
          status = 'In Progress';
        }
      }

      await TaskInstance.create({
        userId,
        timetableId: timetable._id,
        name: template.name,
        category: template.category,
        date: dateStr,
        startTime: template.startTime,
        endTime: template.endTime,
        scheduledStart,
        scheduledEnd,
        punishment: template.punishment,
        notes: template.notes,
        status,
        punishmentStatus,
        originalDuration,
        reducedDuration: originalDuration,
      });
    }
  }

  // If any new tasks were created, or if we need to check expirations
  await checkAndUpdateExpiredTasksForDate(dateStr, userId);

  return await TaskInstance.find({ userId, date: dateStr }).sort({ startTime: 1 });
};

/**
 * Checks and updates status of tasks that have expired.
 * Runs on cron globally.
 */
export const checkAndUpdateExpiredTasks = async () => {
  const now = getNowIST().toDate();
  
  // Find all tasks whose end time has passed, but still have active status
  const expiredTasks = await TaskInstance.find({
    scheduledEnd: { $lt: now },
    status: { $in: ['Upcoming', 'In Progress', 'Ready To Complete'] },
  });

  if (expiredTasks.length === 0) {
    return;
  }

  const userIdsToUpdate = new Set();

  for (const task of expiredTasks) {
    task.status = 'Missed';
    task.punishmentStatus = 'Pending';
    await task.save();
    userIdsToUpdate.add(task.userId.toString());
  }

  for (const userId of userIdsToUpdate) {
    await updateStreak(userId);
  }
};

/**
 * Helper to update expired tasks on a specific date query for a user
 */
export const checkAndUpdateExpiredTasksForDate = async (dateStr, userId) => {
  const now = getNowIST();
  const tasks = await TaskInstance.find({
    userId,
    date: dateStr,
    status: { $in: ['Upcoming', 'In Progress', 'Ready To Complete'] },
  });

  let changed = false;

  for (const task of tasks) {
    const endMoment = moment(task.scheduledEnd);
    if (now.isAfter(endMoment)) {
      task.status = 'Missed';
      task.punishmentStatus = 'Pending';
      await task.save();
      changed = true;
    } else if (now.isSameOrAfter(moment(task.scheduledStart)) && now.isSameOrBefore(endMoment)) {
      const windowMinutes = Math.max(5, task.reducedDuration * 0.03);
      const startWindow = moment(endMoment).subtract(windowMinutes, 'minutes');
      const newStatus = now.isSameOrAfter(startWindow) ? 'Ready To Complete' : 'In Progress';
      if (task.status !== newStatus) {
        task.status = newStatus;
        await task.save();
        changed = true;
      }
    }
  }

  if (changed) {
    await updateStreak(userId);
  }
};

/**
 * Mark a task as completed (validating 5 minute completion window)
 */
export const completeTask = async (taskId, user) => {
  const task = await TaskInstance.findOne({ _id: taskId, userId: user._id });
  if (!task) {
    throw new Error('Task not found');
  }

  if (task.status === 'Completed') {
    throw new Error('Task is already completed');
  }

  if (task.status === 'Missed' || task.status === 'Unavoidable') {
    throw new Error('Task is immutable (Missed/Unavoidable)');
  }

  // Check completion window: max of 5 mins or 3% of task duration
  const now = getNowIST();
  const endMoment = moment(task.scheduledEnd);
  const windowMinutes = Math.max(5, task.reducedDuration * 0.03);
  const startWindow = moment(endMoment).subtract(windowMinutes, 'minutes');

  const isWithinWindow = now.isSameOrAfter(startWindow) && now.isSameOrBefore(endMoment);
  
  if (!isWithinWindow) {
    throw new Error(`Completion is only allowed in the final completion window (last ${Math.round(windowMinutes)} minutes) of the task`);
  }

  task.status = 'Completed';
  task.completionTime = now.toDate();
  
  // Calculate XP earned: 1 XP per completed minute
  const xpEarned = task.reducedDuration;
  task.xpEarned = xpEarned;
  
  await task.save();

  // Award XP to User
  user.xp += xpEarned;
  await user.save();

  // Recalculate Streak
  await updateStreak(user._id);

  // Update goals progress
  await updateGoalProgress(user._id, 'TasksCompleted', 1, task.category);
  await updateGoalProgress(user._id, 'FocusHours', task.reducedDuration / 60, task.category);

  // Check achievements
  await checkAndUnlockAchievements(user);

  return task;
};

/**
 * Spend XP to reduce a future task's duration
 */
export const reduceTaskDuration = async (taskId, minutes, user) => {
  const task = await TaskInstance.findOne({ _id: taskId, userId: user._id });
  if (!task) {
    throw new Error('Task not found');
  }

  const now = getNowIST();
  if (now.isAfter(moment(task.scheduledStart))) {
    throw new Error('Cannot reduce duration of a task that has already started or ended');
  }

  if (task.status !== 'Upcoming') {
    throw new Error('Can only reduce duration of upcoming tasks');
  }

  // Max 25% reduction
  const maxReduction = Math.floor(task.originalDuration * 0.25);
  
  // Calculate total already reduced if any
  const currentReduction = task.originalDuration - task.reducedDuration;
  const newTotalReduction = currentReduction + minutes;

  if (newTotalReduction > maxReduction) {
    throw new Error(`Maximum allowed reduction is 25% (${maxReduction} mins). You requested to reduce it by ${newTotalReduction} mins total.`);
  }

  if (user.xp < minutes) {
    throw new Error(`Insufficient XP. You need ${minutes} XP, but you have ${user.xp} XP.`);
  }

  // Deduct XP
  user.xp -= minutes;
  user.xpSpent += minutes;
  await user.save();

  // Update task
  task.reducedDuration = task.originalDuration - newTotalReduction;
  task.xpSpent = (task.xpSpent || 0) + minutes;
  
  // Recalculate scheduledEnd based on reduced duration
  task.scheduledEnd = moment(task.scheduledStart).add(task.reducedDuration, 'minutes').toDate();
  // Adjust formatted endTime string
  task.endTime = moment(task.scheduledEnd).tz('Asia/Kolkata').format('HH:mm');

  await task.save();

  // Check achievements (since XP is spent/earned)
  await checkAndUnlockAchievements(user);

  return task;
};

/**
 * Mark a task as Unavoidable
 */
export const markUnavoidable = async (taskId, reason, userId) => {
  const task = await TaskInstance.findOne({ _id: taskId, userId });
  if (!task) {
    throw new Error('Task not found');
  }

  const now = getNowIST();
  if (now.isAfter(moment(task.scheduledEnd))) {
    throw new Error('Cannot mark a task as unavoidable after its end time has passed');
  }

  if (!reason || reason.trim() === '') {
    throw new Error('Unavoidable status requires a mandatory reason');
  }

  task.status = 'Unavoidable';
  task.unavoidableReason = reason;
  task.xpEarned = 0;
  await task.save();

  // Streak calculations
  await updateStreak(userId);

  return task;
};

/**
 * Recalculate the user's current and longest streaks.
 * A day counts towards a streak if:
 * 1. The user had scheduled tasks for that day.
 * 2. The user completed at least 1 task.
 * 3. The user has 0 missed tasks.
 * (If a day had no tasks or only unavoidable tasks, it does not break the streak, but does not increment it.)
 */
export const updateStreak = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return;

  const now = getNowIST();
  let currentStreak = 0;
  let maxStreak = user.longestStreak || 0;
  
  // Fetch all task instances in the last 366 days in a single query
  const oneYearAgo = now.clone().subtract(366, 'days').startOf('day').toDate();
  const allTasks = await TaskInstance.find({
    userId,
    scheduledStart: { $gte: oneYearAgo }
  });

  // Group task instances by date string in memory
  const tasksByDate = {};
  for (const task of allTasks) {
    if (!tasksByDate[task.date]) {
      tasksByDate[task.date] = [];
    }
    tasksByDate[task.date].push(task);
  }

  // We will scan backwards day by day from today
  let checkDate = now.clone();
  let consecutiveDays = 0;
  
  // To avoid infinite loop, search up to 365 days back
  for (let i = 0; i < 365; i++) {
    const dateStr = checkDate.format('YYYY-MM-DD');
    const tasks = tasksByDate[dateStr] || [];

    if (tasks.length > 0) {
      const missedCount = tasks.filter((t) => t.status === 'Missed').length;
      const completedCount = tasks.filter((t) => t.status === 'Completed').length;
      const upcomingOrProgress = tasks.filter((t) => ['Upcoming', 'In Progress', 'Ready To Complete'].includes(t.status)).length;

      if (missedCount > 0) {
        // Streak is broken at this date! Stop checking backward.
        break;
      }

      // If we are looking at today:
      // The day is not over yet. If there are upcoming tasks, it shouldn't break the streak,
      // and if there are completed tasks, we can count it. If there are no completed tasks yet but it is today
      // and nothing is missed, we just skip it but do NOT break the streak.
      const isToday = dateStr === now.format('YYYY-MM-DD');
      
      if (completedCount > 0 && missedCount === 0) {
        // Success day
        consecutiveDays++;
      } else if (upcomingOrProgress > 0 && isToday) {
        // Today has tasks but none missed yet and not completed all yet.
        // We do not break, but we also don't count today yet as a success day in the streak count.
        // We just proceed backward.
      } else if (completedCount === 0 && missedCount === 0) {
        // A day where tasks exist but they are all unavoidable or something?
        // Doesn't break streak, doesn't increment. Just proceed.
      }
    } else {
      // 0 tasks on this day. Doesn't break, doesn't increment.
    }

    checkDate.subtract(1, 'day');
  }

  currentStreak = consecutiveDays;
  if (currentStreak > maxStreak) {
    maxStreak = currentStreak;
  }

  user.currentStreak = currentStreak;
  user.longestStreak = maxStreak;
  await user.save();

  // Check achievements for streak updates
  await checkAndUnlockAchievements(user);
};

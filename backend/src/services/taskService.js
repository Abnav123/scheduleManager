import mongoose from 'mongoose';
import TaskInstance from '../models/TaskInstance.js';
import Timetable from '../models/Timetable.js';
import User from '../models/User.js';
import {
  getTodayIST,
  getNowIST,
  parseISTTime,
  isWithinLastFiveMinutes,
  isPastEndTime,
  getDiffMinutes,
} from '../utils/dateHelper.js';
import { checkAndUnlockAchievements } from './achievementService.js';
import { updateGoalProgress } from './goalService.js';
import moment from 'moment-timezone';

/**
 * Generate task instances for a specific date if they don't already exist.
 * Lazy creation when user views a day.
 */
export const generateDailyTasks = async (dateStr) => {
  // Clean up any orphaned task instances whose timetable has been deleted
  const activeTimetables = await Timetable.find().select('_id');
  const activeIds = activeTimetables.map(t => t._id);
  const deletedRes = await TaskInstance.deleteMany({
    timetableId: { $nin: activeIds }
  });
  if (deletedRes.deletedCount > 0) {
    await updateStreak();
  }

  // Check if instances already exist
  let instances = await TaskInstance.find({ date: dateStr }).sort({ startTime: 1 });
  if (instances.length > 0) {
    // If they exist, let's run a quick expiration check on them to make sure statuses are fresh
    await checkAndUpdateExpiredTasksForDate(dateStr);
    return await TaskInstance.find({ date: dateStr }).sort({ startTime: 1 });
  }

  // Find active timetable for this date
  const targetDate = moment.tz(dateStr, 'Asia/Kolkata').startOf('day').toDate();
  const timetable = await Timetable.findOne({
    startDate: { $lte: targetDate },
    endDate: { $gte: targetDate },
  });

  if (!timetable) {
    return [];
  }

  // Check if there is an override for this date
  const override = timetable.overrides.find((ov) => ov.date === dateStr);
  const taskTemplates = override ? override.tasks : timetable.defaultSchedule;

  const newInstances = [];
  const now = getNowIST();

  for (const template of taskTemplates) {
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

    newInstances.push({
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

  if (newInstances.length > 0) {
    instances = await TaskInstance.insertMany(newInstances);
    // If any tasks were generated as Missed, we should trigger streak updates
    const hasMissed = instances.some((inst) => inst.status === 'Missed');
    if (hasMissed) {
      await updateStreak();
    }
  }

  return instances;
};

/**
 * Checks and updates status of tasks that have expired.
 * Runs on cron or when querying today's/past tasks.
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

  let streakBroken = false;

  for (const task of expiredTasks) {
    task.status = 'Missed';
    task.punishmentStatus = 'Pending';
    await task.save();
    streakBroken = true;
  }

  if (streakBroken) {
    await updateStreak();
  }
};

/**
 * Helper to update expired tasks on a specific date query
 */
export const checkAndUpdateExpiredTasksForDate = async (dateStr) => {
  const now = getNowIST();
  const tasks = await TaskInstance.find({
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
    await updateStreak();
  }
};

/**
 * Mark a task as completed (validating 5 minute completion window)
 */
export const completeTask = async (taskId, adminUser) => {
  const task = await TaskInstance.findById(taskId);
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

  // Award XP to Admin User
  adminUser.xp += xpEarned;
  await adminUser.save();

  // Recalculate Streak
  await updateStreak();

  // Update goals progress
  await updateGoalProgress('TasksCompleted', 1, task.category);
  await updateGoalProgress('FocusHours', task.reducedDuration / 60, task.category);

  // Check achievements
  await checkAndUnlockAchievements(adminUser);

  return task;
};

/**
 * Spend XP to reduce a future task's duration
 */
export const reduceTaskDuration = async (taskId, minutes, adminUser) => {
  const task = await TaskInstance.findById(taskId);
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

  if (adminUser.xp < minutes) {
    throw new Error(`Insufficient XP. You need ${minutes} XP, but you have ${adminUser.xp} XP.`);
  }

  // Deduct XP
  adminUser.xp -= minutes;
  adminUser.xpSpent += minutes;
  await adminUser.save();

  // Update task
  task.reducedDuration = task.originalDuration - newTotalReduction;
  task.xpSpent = (task.xpSpent || 0) + minutes;
  
  // Recalculate scheduledEnd based on reduced duration
  task.scheduledEnd = moment(task.scheduledStart).add(task.reducedDuration, 'minutes').toDate();
  // Adjust formatted endTime string
  task.endTime = moment(task.scheduledEnd).tz('Asia/Kolkata').format('HH:mm');

  await task.save();

  // Check achievements (since XP is spent/earned)
  await checkAndUnlockAchievements(adminUser);

  return task;
};

/**
 * Mark a task as Unavoidable
 */
export const markUnavoidable = async (taskId, reason) => {
  const task = await TaskInstance.findById(taskId);
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
  await updateStreak();

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
export const updateStreak = async () => {
  const user = await User.findOne({});
  if (!user) return;

  const now = getNowIST();
  let currentStreak = 0;
  let maxStreak = user.longestStreak || 0;
  
  // Fetch all task instances in the last 366 days in a single query
  const oneYearAgo = now.clone().subtract(366, 'days').startOf('day').toDate();
  const allTasks = await TaskInstance.find({
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

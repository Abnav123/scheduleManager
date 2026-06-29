import mongoose from 'mongoose';
import TaskInstance from '../models/TaskInstance.js';
import User from '../models/User.js';
import moment from 'moment-timezone';

/**
 * Get comprehensive statistics for the admin dashboard
 */
export const getStatsSummary = async (userId) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const [
    user,
    totalTasks,
    completed,
    missed,
    unavoidable,
    focusTimeAggregate,
    categoryHoursAggregate,
    mostCompletedAggregate,
    mostMissedAggregate
  ] = await Promise.all([
    User.findById(userId),
    TaskInstance.countDocuments({ userId }),
    TaskInstance.countDocuments({ userId, status: 'Completed' }),
    TaskInstance.countDocuments({ userId, status: 'Missed' }),
    TaskInstance.countDocuments({ userId, status: 'Unavoidable' }),
    TaskInstance.aggregate([
      { $match: { userId: userObjectId, status: 'Completed' } },
      { $group: { _id: null, totalMinutes: { $sum: '$reducedDuration' } } },
    ]),
    TaskInstance.aggregate([
      { $match: { userId: userObjectId, status: 'Completed' } },
      { $group: { _id: '$category', totalMinutes: { $sum: '$reducedDuration' } } },
    ]),
    TaskInstance.aggregate([
      { $match: { userId: userObjectId, status: 'Completed' } },
      { $group: { _id: '$name', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]),
    TaskInstance.aggregate([
      { $match: { userId: userObjectId, status: 'Missed' } },
      { $group: { _id: '$name', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ])
  ]);

  // Focus Hours (Sum of reducedDuration of Completed tasks)
  const focusHours = focusTimeAggregate.length > 0 ? Number((focusTimeAggregate[0].totalMinutes / 60).toFixed(2)) : 0;

  // Completion percentage = Completed / (Total - Unavoidable)
  const divisor = totalTasks - unavoidable;
  const completionPercentage = divisor > 0 ? Math.round((completed / divisor) * 100) : 0;

  // XP details
  const xpEarned = user ? user.xp + user.xpSpent : 0;
  const xpSpent = user ? user.xpSpent : 0;

  // Category-wise hours
  const categoryHours = {};
  categoryHoursAggregate.forEach((item) => {
    categoryHours[item._id] = Number((item.totalMinutes / 60).toFixed(2));
  });

  // Most completed task name
  const mostCompletedTask = mostCompletedAggregate.length > 0 ? mostCompletedAggregate[0]._id : 'None';

  // Most missed task name
  const mostMissedTask = mostMissedAggregate.length > 0 ? mostMissedAggregate[0]._id : 'None';

  // Productivity Score
  // Productivity Score = Completion Percentage
  const productivityScore = completionPercentage;

  // Discipline Score = Completed / (Completed + Missed) * 100
  const totalCompletedOrMissed = completed + missed;
  const disciplineScore = totalCompletedOrMissed > 0 ? Math.round((completed / totalCompletedOrMissed) * 100) : 100;

  return {
    totalTasks,
    completed,
    missed,
    unavoidable,
    completionPercentage,
    currentStreak: user ? user.currentStreak : 0,
    longestStreak: user ? user.longestStreak : 0,
    focusHours,
    xpEarned,
    xpSpent,
    categoryHours,
    mostCompletedTask,
    mostMissedTask,
    productivityScore,
    disciplineScore,
  };
};

/**
 * Get monthly calendar status mappings.
 * Returns date strings mapped to colors: Green (Completed), Red (Missed), Grey (Unavoidable / Neutral)
 */
export const getMonthlyCalendar = async (userId, year, month) => {
  // Setup date range
  const startOfMonth = moment.tz(`${year}-${month}-01`, 'YYYY-MM-DD', 'Asia/Kolkata').startOf('month');
  const endOfMonth = startOfMonth.clone().endOf('month');

  const tasks = await TaskInstance.find({
    userId,
    scheduledStart: { $gte: startOfMonth.toDate(), $lte: endOfMonth.toDate() },
  });

  const dailyStatus = {};

  // Group by date string (YYYY-MM-DD)
  tasks.forEach((task) => {
    if (!dailyStatus[task.date]) {
      dailyStatus[task.date] = { completed: 0, missed: 0, unavoidable: 0, total: 0 };
    }
    dailyStatus[task.date].total++;
    if (task.status === 'Completed') dailyStatus[task.date].completed++;
    else if (task.status === 'Missed') dailyStatus[task.date].missed++;
    else if (task.status === 'Unavoidable') dailyStatus[task.date].unavoidable++;
  });

  const calendarData = {};
  
  // Fill calendar
  let current = startOfMonth.clone();
  while (current.isSameOrBefore(endOfMonth)) {
    const dateStr = current.format('YYYY-MM-DD');
    const dayStats = dailyStatus[dateStr];

    if (dayStats) {
      if (dayStats.missed > 0) {
        calendarData[dateStr] = 'Red'; // Missed
      } else if (dayStats.completed > 0) {
        calendarData[dateStr] = 'Green'; // Completed
      } else if (dayStats.unavoidable > 0 && dayStats.completed === 0) {
        calendarData[dateStr] = 'Grey'; // Unavoidable
      } else {
        calendarData[dateStr] = 'None';
      }
    } else {
      calendarData[dateStr] = 'None';
    }
    current.add(1, 'day');
  }

  return calendarData;
};

/**
 * Get data formatted for a GitHub-style heatmap (dates + activity counts)
 */
export const getProductivityHeatmap = async (userId) => {
  const oneYearAgo = moment.tz('Asia/Kolkata').subtract(1, 'year').startOf('day').toDate();

  const completedTasks = await TaskInstance.find({
    userId,
    status: 'Completed',
    scheduledStart: { $gte: oneYearAgo },
  });

  const heatmap = {};
  completedTasks.forEach((task) => {
    heatmap[task.date] = (heatmap[task.date] || 0) + 1;
  });

  return heatmap;
};

/**
 * Generate weekly or monthly productivity reports
 */
export const getProductivityReport = async (userId, rangeType = 'weekly') => {
  const now = moment.tz('Asia/Kolkata');
  const formatStr = 'YYYY-MM-DD';

  let startCurrent, endCurrent, startPrevious, endPrevious;

  if (rangeType === 'weekly') {
    startCurrent = now.clone().startOf('week');
    endCurrent = now.clone().endOf('week');
    startPrevious = startCurrent.clone().subtract(1, 'week');
    endPrevious = startCurrent.clone().subtract(1, 'day');
  } else {
    startCurrent = now.clone().startOf('month');
    endCurrent = now.clone().endOf('month');
    startPrevious = startCurrent.clone().subtract(1, 'month');
    endPrevious = startCurrent.clone().subtract(1, 'day');
  }

  const getRangeStats = async (start, end) => {
    const tasks = await TaskInstance.find({
      userId,
      scheduledStart: { $gte: start.toDate(), $lte: end.toDate() },
    });

    const completed = tasks.filter((t) => t.status === 'Completed').length;
    const missed = tasks.filter((t) => t.status === 'Missed').length;
    const unavoidable = tasks.filter((t) => t.status === 'Unavoidable').length;
    const total = tasks.length;

    const focusMinutes = tasks
      .filter((t) => t.status === 'Completed')
      .reduce((sum, t) => sum + t.reducedDuration, 0);

    const completionRate = total - unavoidable > 0 ? (completed / (total - unavoidable)) * 100 : 0;

    return {
      total,
      completed,
      missed,
      unavoidable,
      focusHours: Number((focusMinutes / 60).toFixed(2)),
      completionRate: Math.round(completionRate),
    };
  };

  const currentStats = await getRangeStats(startCurrent, endCurrent);
  const previousStats = await getRangeStats(startPrevious, endPrevious);

  // Generate Insights
  let insightText = '';
  if (currentStats.completionRate >= 80) {
    insightText = 'Excellent discipline! You are maintaining a highly productive schedule. Keep moving forward like water flowing around stones.';
  } else if (currentStats.completionRate >= 50) {
    insightText = 'Steady progress, but there is room for refinement. Reflect on what caused your missed tasks and adjust your timing accordingly.';
  } else {
    insightText = 'Discipline has wavered. Remember that the way of the sword is long, and every step counts. Start small to build your streak again.';
  }

  if (currentStats.missed > previousStats.missed) {
    insightText += ` Your missed tasks increased by ${currentStats.missed - previousStats.missed} compared to the previous period. Focus on commitment.`;
  }

  return {
    rangeType,
    period: {
      current: { start: startCurrent.format(formatStr), end: endCurrent.format(formatStr) },
      previous: { start: startPrevious.format(formatStr), end: endPrevious.format(formatStr) },
    },
    current: currentStats,
    previous: previousStats,
    insights: insightText,
  };
};

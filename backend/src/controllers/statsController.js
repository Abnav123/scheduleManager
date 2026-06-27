import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import TaskInstance from '../models/TaskInstance.js';
import DailyDiary from '../models/DailyDiary.js';
import DailyReflection from '../models/DailyReflection.js';
import Goal from '../models/Goal.js';
import Achievement from '../models/Achievement.js';
import User from '../models/User.js';
import {
  getStatsSummary,
  getMonthlyCalendar,
  getProductivityHeatmap,
  getProductivityReport,
} from '../services/statsService.js';
import { generateDailyTasks, checkAndUpdateExpiredTasksForDate } from '../services/taskService.js';
import { getTodayIST, getNowIST } from '../utils/dateHelper.js';
import moment from 'moment-timezone';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to get a stable quote for a specific date string
const getQuoteForDate = (dateStr) => {
  try {
    const filePath = path.join(__dirname, '../utils/quotes.json');
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const quotes = JSON.parse(rawData);

    let hash = 0;
    for (let i = 0; i < dateStr.length; i++) {
      hash = dateStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % quotes.length;
    return quotes[index];
  } catch (error) {
    console.error('Error reading quotes.json:', error);
    return {
      quote: "Do nothing that is of no use.",
      author: "Miyamoto Musashi"
    };
  }
};

/**
 * @desc    Get dashboard metrics, today's tasks, active goals, today's diary/reflection, and the daily quote
 * @route   GET /api/stats/dashboard
 * @access  Private (Admin)
 */
export const getDashboardData = async (req, res, next) => {
  try {
    const todayStr = getTodayIST();
    
    // Ensure today's task instances are created and updated
    await generateDailyTasks(todayStr);

    const stats = await getStatsSummary();
    const todayTasks = await TaskInstance.find({ date: todayStr }).sort({ startTime: 1 });
    const todayDiary = await DailyDiary.findOne({ date: todayStr });
    const todayReflection = await DailyReflection.findOne({ date: todayStr });
    
    // Find active goals
    const now = getNowIST().toDate();
    const activeGoals = await Goal.find({
      status: 'Active',
      startDate: { $lte: now },
      endDate: { $gte: now },
    });

    const dailyQuote = getQuoteForDate(todayStr);

    // Calculate level and completion %
    // Let's say Level = Math.floor(totalXP / 1000) + 1, and progress = totalXP % 1000
    const totalXp = stats.xpEarned;
    const level = Math.floor(totalXp / 1000) + 1;
    const levelProgressPercent = Math.round((totalXp % 1000) / 10); // progress towards next level

    // Find current task, next task, and countdown
    let currentTask = null;
    let nextTask = null;
    let countdownSeconds = 0;

    const nowMoment = getNowIST();
    
    // Find current task
    currentTask = todayTasks.find((task) => {
      const start = moment(task.scheduledStart);
      const end = moment(task.scheduledEnd);
      return nowMoment.isSameOrAfter(start) && nowMoment.isSameOrBefore(end);
    }) || null;

    // Find next task (upcoming task starting today after now)
    const upcomingTasks = todayTasks.filter((task) => {
      const start = moment(task.scheduledStart);
      return start.isAfter(nowMoment) && task.status === 'Upcoming';
    });

    if (upcomingTasks.length > 0) {
      nextTask = upcomingTasks[0]; // Already sorted by startTime
      countdownSeconds = moment(nextTask.scheduledStart).diff(nowMoment, 'seconds');
    } else if (currentTask) {
      // If there is a current task in progress, countdown to the end of it
      countdownSeconds = moment(currentTask.scheduledEnd).diff(nowMoment, 'seconds');
    }

    res.json({
      stats,
      todayTasks,
      todayDiary,
      todayReflection,
      activeGoals,
      dailyQuote,
      currentTask,
      nextTask,
      countdownSeconds: countdownSeconds > 0 ? countdownSeconds : 0,
      levelInfo: {
        level,
        totalXp,
        levelProgressPercent,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get monthly calendar data mapping dates to status colors
 * @route   GET /api/stats/calendar
 * @access  Private (Admin)
 */
export const getCalendarData = async (req, res, next) => {
  try {
    const { year, month } = req.query;
    if (!year || !month) {
      res.status(400);
      throw new Error('Year and month parameters are required');
    }
    const calendar = await getMonthlyCalendar(year, month);
    res.json(calendar);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get GitHub-style heatmap data
 * @route   GET /api/stats/heatmap
 * @access  Private (Admin)
 */
export const getHeatmapData = async (req, res, next) => {
  try {
    const heatmap = await getProductivityHeatmap();
    res.json(heatmap);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get productivity report (weekly or monthly)
 * @route   GET /api/stats/report
 * @access  Private (Admin)
 */
export const getReportData = async (req, res, next) => {
  try {
    const type = req.query.type || 'weekly';
    if (!['weekly', 'monthly'].includes(type)) {
      res.status(400);
      throw new Error("Report type must be 'weekly' or 'monthly'");
    }
    const report = await getProductivityReport(type);
    res.json(report);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get list of all achievements (including unlocked ones)
 * @route   GET /api/stats/achievements
 * @access  Private (Admin)
 */
export const getAchievementsList = async (req, res, next) => {
  try {
    const achievements = await Achievement.find().sort({ unlockedAt: -1, threshold: 1 });
    res.json(achievements);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get complete historical timeline record for a specific date
 * @route   GET /api/stats/timeline
 * @access  Private (Admin)
 */
export const getTimelineData = async (req, res, next) => {
  try {
    const dateStr = req.query.date || getTodayIST();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      res.status(400);
      throw new Error('Date format must be YYYY-MM-DD');
    }

    // Ensure tasks are generated and checked for expiration for the target day
    await generateDailyTasks(dateStr);

    const tasks = await TaskInstance.find({ date: dateStr }).sort({ startTime: 1 });
    const diary = await DailyDiary.findOne({ date: dateStr });
    const reflection = await DailyReflection.findOne({ date: dateStr });

    // Compute day summary
    const completed = tasks.filter((t) => t.status === 'Completed');
    const missed = tasks.filter((t) => t.status === 'Missed');
    const unavoidable = tasks.filter((t) => t.status === 'Unavoidable');
    
    const xpEarned = completed.reduce((sum, t) => sum + t.xpEarned, 0);
    const focusTimeMinutes = completed.reduce((sum, t) => sum + t.reducedDuration, 0);
    
    // Format focus hours
    const focusHoursStr = `${Math.floor(focusTimeMinutes / 60)}h ${focusTimeMinutes % 60}m`;

    const total = tasks.length;
    const completedCount = completed.length;
    const missedCount = missed.length;
    const unavoidableCount = unavoidable.length;

    const divisor = total - unavoidableCount;
    const productivityScore = divisor > 0 ? Math.round((completedCount / divisor) * 100) : 100;
    
    const totalCompletedOrMissed = completedCount + missedCount;
    const disciplineScore = totalCompletedOrMissed > 0 ? Math.round((completedCount / totalCompletedOrMissed) * 100) : 100;

    // Get stable quote for this date
    const dailyQuote = getQuoteForDate(dateStr);

    // Achievements unlocked on this specific day
    const startOfDay = moment.tz(dateStr, 'Asia/Kolkata').startOf('day').toDate();
    const endOfDay = moment.tz(dateStr, 'Asia/Kolkata').endOf('day').toDate();
    const achievementsUnlocked = await Achievement.find({
      unlockedAt: { $gte: startOfDay, $lte: endOfDay },
    });

    // Formatting date label: e.g. "28 June 2026"
    const formattedDateLabel = moment.tz(dateStr, 'YYYY-MM-DD', 'Asia/Kolkata').format('DD MMMM YYYY');

    res.json({
      date: dateStr,
      formattedDateLabel,
      dailyQuote,
      tasks,
      diary,
      reflection,
      achievementsUnlocked,
      summary: {
        completedTasksCount: completedCount,
        missedTasksCount: missedCount,
        unavoidableTasksCount: unavoidableCount,
        xpEarned,
        focusTimeMinutes,
        focusHoursStr,
        disciplineScore,
        productivityScore,
      },
    });
  } catch (error) {
    next(error);
  }
};

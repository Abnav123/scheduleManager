import Achievement from '../models/Achievement.js';
import TaskInstance from '../models/TaskInstance.js';

// Predefined achievements to seed if they do not exist
export const DEFAULT_ACHIEVEMENTS = [
  { name: '7 Day Streak', description: 'Maintain a 7-day task completion streak', type: 'Streak', threshold: 7 },
  { name: '30 Day Streak', description: 'Maintain a 30-day task completion streak', type: 'Streak', threshold: 30 },
  { name: '100 Tasks Completed', description: 'Complete 100 tasks in total', type: 'TasksCompleted', threshold: 100 },
  { name: '100 Hours Focus', description: 'Accumulate 100 hours of focus time', type: 'FocusHours', threshold: 100 },
  { name: '500 XP', description: 'Earn 500 total XP', type: 'XPEarned', threshold: 500 },
];

/**
 * Seed achievements if database is empty for this user
 */
export const seedAchievements = async (userId) => {
  for (const ach of DEFAULT_ACHIEVEMENTS) {
    const existing = await Achievement.findOne({ userId, name: ach.name });
    if (!existing) {
      await Achievement.create({ ...ach, userId });
    }
  }
};

/**
 * Check and unlock achievements for the current user
 */
export const checkAndUnlockAchievements = async (user) => {
  // Ensure default achievements are seeded for this user
  await seedAchievements(user._id);

  // Get metrics
  const totalCompletedTasks = await TaskInstance.countDocuments({ userId: user._id, status: 'Completed' });
  
  const focusTimeAggregate = await TaskInstance.aggregate([
    { $match: { userId: user._id, status: 'Completed' } },
    { $group: { _id: null, totalMinutes: { $sum: '$reducedDuration' } } },
  ]);
  const totalFocusHours = focusTimeAggregate.length > 0 ? focusTimeAggregate[0].totalMinutes / 60 : 0;
  
  const totalXpEarned = user.xp + user.xpSpent;

  // Find all locked achievements for this user
  const lockedAchievements = await Achievement.find({ userId: user._id, unlockedAt: null });

  for (const ach of lockedAchievements) {
    let qualifies = false;

    switch (ach.type) {
      case 'Streak':
        if (user.currentStreak >= ach.threshold) qualifies = true;
        break;
      case 'TasksCompleted':
        if (totalCompletedTasks >= ach.threshold) qualifies = true;
        break;
      case 'FocusHours':
        if (totalFocusHours >= ach.threshold) qualifies = true;
        break;
      case 'XPEarned':
        if (totalXpEarned >= ach.threshold) qualifies = true;
        break;
      default:
        break;
    }

    if (qualifies) {
      ach.unlockedAt = new Date();
      await ach.save();
      console.log(`ACHIEVEMENT UNLOCKED: ${ach.name} for user ${user.username}`);
    }
  }
};

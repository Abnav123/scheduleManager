import Goal from '../models/Goal.js';
import { getNowIST } from '../utils/dateHelper.js';

/**
 * Increment the currentValue of active goals matching type (and optional category)
 */
export const updateGoalProgress = async (userId, type, incrementVal, category = null) => {
  const now = getNowIST().toDate();
  
  // Find active goals of the matching type where current time falls within start & end dates
  const query = {
    userId,
    type,
    status: 'Active',
    startDate: { $lte: now },
    endDate: { $gte: now },
  };

  const activeGoals = await Goal.find(query);

  for (const goal of activeGoals) {
    // If the goal has a category filter, verify the category matches
    if (goal.category && goal.category.toLowerCase() !== category?.toLowerCase()) {
      continue;
    }

    goal.currentValue += incrementVal;
    
    // Check if goal completed
    if (goal.currentValue >= goal.targetValue) {
      goal.currentValue = goal.targetValue;
      goal.status = 'Completed';
    }

    await goal.save();
  }
};

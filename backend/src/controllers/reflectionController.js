import DailyReflection from '../models/DailyReflection.js';
import { getTodayIST } from '../utils/dateHelper.js';

/**
 * @desc    Create or update a daily reflection
 * @route   POST /api/reflection
 * @access  Private (Admin)
 */
export const saveReflection = async (req, res, next) => {
  try {
    const { date, mood, reflectionNotes } = req.body;

    if (!date) {
      res.status(400);
      throw new Error('Date is required');
    }

    const today = getTodayIST();
    if (date !== today) {
      res.status(400);
      throw new Error('Daily reflections can only be logged or modified on the active day');
    }

    // If reflectionNotes is empty or blank, delete the reflection entry for this date
    if (!reflectionNotes || reflectionNotes.trim() === '') {
      await DailyReflection.findOneAndDelete({ date, userId: req.user._id });
      return res.json({ message: 'Reflection cleared', cleared: true });
    }

    if (!mood) {
      res.status(400);
      throw new Error('Mood is required');
    }

    if (!['Excellent', 'Good', 'Average', 'Bad'].includes(mood)) {
      res.status(400);
      throw new Error("Mood must be one of: 'Excellent', 'Good', 'Average', 'Bad'");
    }

    const reflection = await DailyReflection.findOneAndUpdate(
      { date, userId: req.user._id },
      { userId: req.user._id, mood, reflectionNotes },
      { new: true, upsert: true }
    );

    res.json(reflection);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get reflection for a specific date
 * @route   GET /api/reflection
 * @access  Private (Admin)
 */
export const getReflectionByDate = async (req, res, next) => {
  try {
    const date = req.query.date || getTodayIST();
    const reflection = await DailyReflection.findOne({ date, userId: req.user._id });

    if (!reflection) {
      return res.json(null); // Return null instead of error if not reflection set yet
    }

    res.json(reflection);
  } catch (error) {
    next(error);
  }
};

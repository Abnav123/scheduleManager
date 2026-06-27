import DailyDiary from '../models/DailyDiary.js';
import { getTodayIST } from '../utils/dateHelper.js';

/**
 * @desc    Create or update a diary entry for a specific date
 * @route   POST /api/diary
 * @access  Private (Admin)
 */
export const saveDiaryEntry = async (req, res, next) => {
  try {
    const { date, title, content, mood, tags } = req.body;

    if (!date) {
      res.status(400);
      throw new Error('Date is required');
    }

    // If content is empty or blank, delete the diary entry for this date
    if (!content || content.trim() === '') {
      await DailyDiary.findOneAndDelete({ date });
      return res.json({ message: 'Diary entry cleared', cleared: true });
    }

    // Find and update, or insert if missing (upsert)
    const diary = await DailyDiary.findOneAndUpdate(
      { date },
      {
        title: title || '',
        content,
        mood: mood || '',
        tags: tags || [],
      },
      { new: true, upsert: true }
    );

    res.json(diary);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a diary entry for a specific date
 * @route   GET /api/diary
 * @access  Private (Admin)
 */
export const getDiaryEntryByDate = async (req, res, next) => {
  try {
    const date = req.query.date || getTodayIST();
    const diary = await DailyDiary.findOne({ date });

    if (!diary) {
      return res.json(null); // Return null instead of error so frontend knows no entry exists
    }

    res.json(diary);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete diary entry
 * @route   DELETE /api/diary/:id
 * @access  Private (Admin)
 */
export const deleteDiaryEntry = async (req, res, next) => {
  try {
    const diary = await DailyDiary.findById(req.params.id);
    if (!diary) {
      res.status(404);
      throw new Error('Diary entry not found');
    }
    await diary.deleteOne();
    res.json({ message: 'Diary entry removed' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Search diary entries by query or tags
 * @route   GET /api/diary/search
 * @access  Private (Admin)
 */
export const searchDiaryEntries = async (req, res, next) => {
  try {
    const { query, tag } = req.query;
    const filter = {};

    if (query) {
      filter.$or = [
        { title: { $regex: query, $options: 'i' } },
        { content: { $regex: query, $options: 'i' } },
      ];
    }

    if (tag) {
      filter.tags = { $in: [tag] };
    }

    const entries = await DailyDiary.find(filter).sort({ date: -1 });
    res.json(entries);
  } catch (error) {
    next(error);
  }
};

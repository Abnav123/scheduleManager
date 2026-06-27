import Note from '../models/Note.js';

/**
 * @desc    Get notes placeholder info
 * @route   GET /api/notes
 * @access  Private (Admin)
 */
export const getNotesPlaceholder = async (req, res, next) => {
  try {
    res.json({
      message: 'Notes module is reserved for future updates.',
      status: 'placeholder',
      plannedFeatures: [
        'Rich text editing',
        'Markdown & Code snippets',
        'Folders organization & Tags',
        'PDF & Image attachments',
        'AI-powered note summarization',
      ],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Dummy create endpoint to verify architecture extensibility
 * @route   POST /api/notes
 * @access  Private (Admin)
 */
export const createNoteDummy = async (req, res, next) => {
  try {
    res.status(501).json({
      message: 'Notes creation is not implemented yet. Notes module is reserved for future updates.',
    });
  } catch (error) {
    next(error);
  }
};

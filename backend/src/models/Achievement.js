import mongoose from 'mongoose';

const achievementSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['Streak', 'TasksCompleted', 'FocusHours', 'XPEarned', 'PerfectWeek'],
    },
    threshold: {
      type: Number,
      required: true,
    },
    unlockedAt: {
      type: Date,
      default: null, // Null means locked
    },
  },
  {
    timestamps: true,
  }
);

achievementSchema.index({ userId: 1, name: 1 }, { unique: true });

const Achievement = mongoose.model('Achievement', achievementSchema);
export default Achievement;

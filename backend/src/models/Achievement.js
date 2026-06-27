import mongoose from 'mongoose';

const achievementSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
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

const Achievement = mongoose.model('Achievement', achievementSchema);
export default Achievement;

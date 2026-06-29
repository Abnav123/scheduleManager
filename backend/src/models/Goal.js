import mongoose from 'mongoose';

const goalSchema = new mongoose.Schema(
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
    targetValue: {
      type: Number,
      required: true,
    },
    currentValue: {
      type: Number,
      default: 0,
    },
    type: {
      type: String,
      required: true,
      enum: ['FocusHours', 'TasksCompleted', 'Custom'],
    },
    category: {
      type: String,
      default: null, // e.g. DSA or Development
    },
    status: {
      type: String,
      required: true,
      enum: ['Active', 'Completed', 'Failed'],
      default: 'Active',
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

goalSchema.index({ userId: 1 });

const Goal = mongoose.model('Goal', goalSchema);
export default Goal;

import mongoose from 'mongoose';

const goalSchema = new mongoose.Schema(
  {
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

const Goal = mongoose.model('Goal', goalSchema);
export default Goal;

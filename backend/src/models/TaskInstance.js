import mongoose from 'mongoose';

const taskInstanceSchema = new mongoose.Schema(
  {
    timetableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Timetable',
      default: null,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['DSA', 'Development', 'College', 'Health', 'Reading', 'Personal', 'Custom'],
    },
    date: {
      type: String,
      required: true, // "YYYY-MM-DD"
    },
    startTime: {
      type: String,
      required: true, // "HH:MM"
    },
    endTime: {
      type: String,
      required: true, // "HH:MM"
    },
    scheduledStart: {
      type: Date,
      required: true,
    },
    scheduledEnd: {
      type: Date,
      required: true,
    },
    punishment: {
      type: String,
      required: true,
      trim: true,
    },
    notes: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      required: true,
      enum: ['Upcoming', 'In Progress', 'Ready To Complete', 'Completed', 'Missed', 'Unavoidable'],
      default: 'Upcoming',
    },
    completionTime: {
      type: Date,
      default: null,
    },
    unavoidableReason: {
      type: String,
      default: null,
    },
    punishmentStatus: {
      type: String,
      enum: ['Pending', 'Completed', 'None'],
      default: 'None',
    },
    xpEarned: {
      type: Number,
      default: 0,
    },
    xpSpent: {
      type: Number,
      default: 0,
    },
    originalDuration: {
      type: Number, // in minutes
      required: true,
    },
    reducedDuration: {
      type: Number, // in minutes, same as original if not reduced
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index to search tasks by date quickly
taskInstanceSchema.index({ date: 1 });

const TaskInstance = mongoose.model('TaskInstance', taskInstanceSchema);
export default TaskInstance;

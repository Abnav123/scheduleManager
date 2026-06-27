import mongoose from 'mongoose';

const taskTemplateSchema = new mongoose.Schema({
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
  startTime: {
    type: String,
    required: true, // "HH:MM"
  },
  endTime: {
    type: String,
    required: true, // "HH:MM"
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
});

const overrideSchema = new mongoose.Schema({
  date: {
    type: String,
    required: true, // "YYYY-MM-DD"
  },
  tasks: [taskTemplateSchema],
});

const timetableSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    defaultSchedule: [taskTemplateSchema],
    overrides: [overrideSchema],
  },
  {
    timestamps: true,
  }
);

const Timetable = mongoose.model('Timetable', timetableSchema);
export default Timetable;

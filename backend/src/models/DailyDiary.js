import mongoose from 'mongoose';

const dailyDiarySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      default: '',
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    mood: {
      type: String,
      default: '',
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

dailyDiarySchema.index({ userId: 1, date: 1 }, { unique: true });

const DailyDiary = mongoose.model('DailyDiary', dailyDiarySchema);
export default DailyDiary;

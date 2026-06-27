import mongoose from 'mongoose';

const dailyDiarySchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: true,
      unique: true, // Unique per date
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

const DailyDiary = mongoose.model('DailyDiary', dailyDiarySchema);
export default DailyDiary;

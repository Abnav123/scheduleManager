import mongoose from 'mongoose';

const dailyReflectionSchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: true,
      unique: true, // One reflection per day
    },
    mood: {
      type: String,
      required: true,
      enum: ['Excellent', 'Good', 'Average', 'Bad'],
    },
    reflectionNotes: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const DailyReflection = mongoose.model('DailyReflection', dailyReflectionSchema);
export default DailyReflection;

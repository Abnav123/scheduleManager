import mongoose from 'mongoose';

const dailyReflectionSchema = new mongoose.Schema(
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

dailyReflectionSchema.index({ userId: 1, date: 1 }, { unique: true });

const DailyReflection = mongoose.model('DailyReflection', dailyReflectionSchema);
export default DailyReflection;

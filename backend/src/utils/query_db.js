import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Timetable from '../models/Timetable.js';
import TaskInstance from '../models/TaskInstance.js';

dotenv.config();

const cleanup = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to DB.");
    const tDelete = await Timetable.deleteMany({});
    console.log(`Deleted ${tDelete.deletedCount} timetables.`);
    const tiDelete = await TaskInstance.deleteMany({});
    console.log(`Deleted ${tiDelete.deletedCount} task instances.`);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await mongoose.connection.close();
  }
};

cleanup();

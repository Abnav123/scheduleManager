import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Timetable from '../models/Timetable.js';
import TaskInstance from '../models/TaskInstance.js';
import { generateDailyTasks } from '../services/taskService.js';

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    console.log('\n--- Before Running generateDailyTasks ---');
    const taskInstancesBefore = await TaskInstance.find({ date: '2026-06-28' });
    console.log('Task Instances count for 2026-06-28:', taskInstancesBefore.length);
    taskInstancesBefore.forEach(inst => {
      console.log(`  - ${inst.name} [${inst.startTime} - ${inst.endTime}] status=${inst.status}`);
    });

    console.log('\n--- Running generateDailyTasks ---');
    const regenerated = await generateDailyTasks('2026-06-28');
    console.log('Returned instances count:', regenerated.length);

    console.log('\n--- After Running generateDailyTasks ---');
    const taskInstancesAfter = await TaskInstance.find({ date: '2026-06-28' });
    console.log('Task Instances count for 2026-06-28:', taskInstancesAfter.length);
    taskInstancesAfter.forEach(inst => {
      console.log(`  - ${inst.name} [${inst.startTime} - ${inst.endTime}] status=${inst.status}`);
    });

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
};

run();

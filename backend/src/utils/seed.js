import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Timetable from '../models/Timetable.js';
import TaskInstance from '../models/TaskInstance.js';
import { seedAchievements } from '../services/achievementService.js';
import moment from 'moment-timezone';

export const seedData = async () => {
  try {
    // 1. Seed Admin User
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'adminpassword123';

    let admin = await User.findOne({ username: adminUsername });
    if (!admin) {
      console.log(`Seeding Admin User: ${adminUsername}`);
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      admin = await User.create({
        username: adminUsername,
        password: hashedPassword,
        xp: 0,
        xpSpent: 0,
        currentStreak: 0,
        longestStreak: 0,
      });
      console.log('Admin user seeded successfully');
    }

    // 2. Seed Default Achievements for Admin
    await seedAchievements(admin._id);
    console.log('Achievements seeded successfully');

    // 3. Clean up previously seeded default timetable if it exists
    const deletedTimetable = await Timetable.findOneAndDelete({ name: 'The Way of the Warrior (Default)' });
    if (deletedTimetable) {
      console.log('Cleaned up existing default seeded timetable.');
      const deleteInstancesRes = await TaskInstance.deleteMany({ timetableId: deletedTimetable._id });
      console.log(`Deleted ${deleteInstancesRes.deletedCount} task instances related to seeded default timetable.`);
    }
  } catch (error) {
    console.error('Seeding error:', error);
  }
};

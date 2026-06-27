import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import apiRoutes from '../routes/index.js';
import connectDB from '../config/db.js';
import { seedData } from './seed.js';
import User from '../models/User.js';
import Timetable from '../models/Timetable.js';
import TaskInstance from '../models/TaskInstance.js';
import DailyDiary from '../models/DailyDiary.js';
import DailyReflection from '../models/DailyReflection.js';
import Goal from '../models/Goal.js';
import { errorHandler } from '../middleware/errorHandler.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', apiRoutes);
app.use(errorHandler);

const TEST_PORT = 5001;
const BASE_URL = `http://localhost:${TEST_PORT}/api`;

const runTests = async () => {
  let server;
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Database connected.');

    // Seed data
    console.log('Seeding admin and default achievements...');
    await seedData();

    // Start local test server
    console.log(`Starting test server on port ${TEST_PORT}...`);
    server = app.listen(TEST_PORT);
    console.log('Test server started.');

    let authToken = '';

    // --- TEST 1: Admin Login ---
    console.log('\n--- Test 1: Admin Login ---');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: process.env.ADMIN_USERNAME || 'admin',
        password: process.env.ADMIN_PASSWORD || 'adminpassword123',
      }),
    });
    
    if (loginRes.status !== 200) {
      throw new Error(`Login failed with status ${loginRes.status}`);
    }
    const loginData = await loginRes.json();
    authToken = loginData.token;
    console.log('✓ Login successful! Token retrieved.');

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    };

    // --- TEST 2: Get Me ---
    console.log('\n--- Test 2: Get Profile (/auth/me) ---');
    const meRes = await fetch(`${BASE_URL}/auth/me`, { headers });
    if (meRes.status !== 200) {
      throw new Error(`Get Profile failed with status ${meRes.status}`);
    }
    const meData = await meRes.json();
    console.log(`✓ Get Profile successful! Username: ${meData.username}, XP: ${meData.xp}`);

    // --- TEST 3: Get Dashboard ---
    console.log('\n--- Test 3: Get Dashboard (/stats/dashboard) ---');
    const dashRes = await fetch(`${BASE_URL}/stats/dashboard`, { headers });
    if (dashRes.status !== 200) {
      throw new Error(`Dashboard fetch failed with status ${dashRes.status}`);
    }
    const dashData = await dashRes.json();
    console.log(`✓ Dashboard data retrieved!`);
    console.log(`  Quote of the Day: "${dashData.dailyQuote.quote}" - ${dashData.dailyQuote.author}`);
    console.log(`  Seeded Tasks count today: ${dashData.todayTasks.length}`);
    if (dashData.todayTasks.length > 0) {
      console.log(`  First task: ${dashData.todayTasks[0].name} (${dashData.todayTasks[0].startTime} - ${dashData.todayTasks[0].endTime})`);
    }

    // --- TEST 4: Create Custom Task ---
    console.log('\n--- Test 4: Create Custom Task (/tasks) ---');
    const customTaskRes = await fetch(`${BASE_URL}/tasks`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: 'LeetCode Hard Practice',
        category: 'DSA',
        date: '2026-06-27',
        startTime: '16:00',
        endTime: '17:00',
        punishment: 'No social media for the day',
        notes: 'Practice trees and dynamic programming',
      }),
    });
    if (customTaskRes.status !== 201) {
      const errText = await customTaskRes.text();
      throw new Error(`Custom task creation failed: ${errText}`);
    }
    const customTask = await customTaskRes.json();
    console.log(`✓ Custom task created! ID: ${customTask._id}, Duration: ${customTask.originalDuration} mins`);

    // --- TEST 5: Save Diary Entry ---
    console.log('\n--- Test 5: Save Diary Entry (/diary) ---');
    const diaryRes = await fetch(`${BASE_URL}/diary`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        date: '2026-06-27',
        title: 'Reflections on Musashi',
        content: 'Today I learned that "there is nothing outside of yourself that can ever enable you to get better... everything is within." Focus is everything.',
        mood: 'Excellent',
        tags: ['philosophical', 'discipline'],
      }),
    });
    if (diaryRes.status !== 200) {
      throw new Error(`Save diary failed: ${await diaryRes.text()}`);
    }
    const diary = await diaryRes.json();
    console.log(`✓ Diary entry saved successfully! Title: ${diary.title}`);

    // --- TEST 6: Get Timeline ---
    console.log('\n--- Test 6: Get Timeline (/stats/timeline) ---');
    const timelineRes = await fetch(`${BASE_URL}/stats/timeline?date=2026-06-27`, { headers });
    if (timelineRes.status !== 200) {
      throw new Error(`Get Timeline failed with status ${timelineRes.status}`);
    }
    const timeline = await timelineRes.json();
    console.log(`✓ Timeline data retrieved successfully for ${timeline.formattedDateLabel}!`);
    console.log(`  Tasks scheduled: ${timeline.tasks.length}`);
    console.log(`  Diary entry: ${timeline.diary ? timeline.diary.title : 'None'}`);
    console.log(`  Discipline Score: ${timeline.summary.disciplineScore}%`);
    console.log(`  Productivity Score: ${timeline.summary.productivityScore}%`);

    // --- TEST 7: Notes Placeholder ---
    console.log('\n--- Test 7: Notes Placeholder (/notes) ---');
    const notesRes = await fetch(`${BASE_URL}/notes`, { headers });
    if (notesRes.status !== 200) {
      throw new Error(`Get Notes failed with status ${notesRes.status}`);
    }
    const notesData = await notesRes.json();
    console.log(`✓ Notes placeholder check successful!`);
    console.log(`  Message: "${notesData.message}"`);
    console.log(`  Planned Features: [${notesData.plannedFeatures.join(', ')}]`);

    console.log('\n=========================================');
    console.log('ALL API TESTS PASSED SUCCESSFULLY! ✓');
    console.log('=========================================');

    // Clean up test custom tasks & diary entries created for 2026-06-27
    console.log('\nCleaning up test entries...');
    await TaskInstance.deleteOne({ _id: customTask._id });
    await DailyDiary.deleteOne({ _id: diary._id });
    console.log('Clean up complete.');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    process.exitCode = 1;
  } finally {
    if (server) {
      console.log('Closing test server...');
      server.close();
    }
    console.log('Closing Mongoose connection...');
    await mongoose.connection.close();
    console.log('Done.');
  }
};

runTests();

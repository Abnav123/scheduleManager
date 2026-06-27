import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import cron from 'node-cron';
import connectDB from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';
import apiRoutes from './routes/index.js';
import { seedData } from './utils/seed.js';
import { checkAndUpdateExpiredTasks } from './services/taskService.js';

// Load env variables
dotenv.config();

// Connect to Database
connectDB().then(() => {
  // Seed Database (Admin account, achievements, sample timetable)
  seedData();
});

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Welcome Route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Personal Discipline Scheduler API' });
});

// API Routes
app.use('/api', apiRoutes);

// Error Handling Middleware
app.use(errorHandler);

// Setup Cron Job - check for expired tasks every minute
// Runs at second 0 of every minute
cron.schedule('* * * * *', async () => {
  try {
    console.log('Cron Job: Checking for expired tasks...');
    await checkAndUpdateExpiredTasks();
  } catch (error) {
    console.error('Error in expired tasks cron job:', error);
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in development mode on port ${PORT}`);
});

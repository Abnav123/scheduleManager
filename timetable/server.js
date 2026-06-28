import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://abhinav:abhinav@cluster0.am0xoe1.mongodb.net/discipline_scheduler?retryWrites=true&w=majority';
const TIMETABLE_PASSWORD = process.env.TIMETABLE_PASSWORD || 'adminpassword123';

// 1. Connect to MongoDB Atlas
mongoose.connect(MONGO_URI)
  .then(() => console.log('Successfully connected to MongoDB Atlas (discipline_scheduler)'))
  .catch(err => {
    console.error('Failed to connect to MongoDB Atlas:', err);
    process.exit(1);
  });

// 2. Define Mongoose Schema for Task Instances
const taskInstanceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    date: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    notes: { type: String, default: '' },
    status: { type: String, required: true }
  },
  { collection: 'taskinstances' }
);

const TaskInstance = mongoose.model('TaskInstance', taskInstanceSchema);

// 3. Middlewares
app.use(cors());
app.use(express.json());

// 4. API Route: Verify passcode securely on server-side
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ success: false, error: 'Password is required' });
  }

  if (password === TIMETABLE_PASSWORD) {
    return res.json({ success: true });
  } else {
    return res.status(401).json({ success: false, error: 'Invalid access code' });
  }
});

// 5. API Route: Fetch tasks for specific date
app.get('/api/tasks', async (req, res) => {
  try {
    const { date } = req.query;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Valid date query (YYYY-MM-DD) is required.' });
    }

    const tasks = await TaskInstance.find({ date });
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 6. Serve Static HTML/CSS/JS page files
app.use(express.static(path.join(__dirname, 'public')));

// 7. Fallback route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.listen(PORT, () => {
  console.log(`Standalone Timetable Viewer active on port ${PORT}`);
});

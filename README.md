# 🌿 Personal Discipline Scheduler

A production-quality, full-stack scheduling and journaling application designed to build habits, maintain focus, and foster self-discipline. Heavily inspired by the philosophy, aesthetic, and atmosphere of *Vagabond*—focusing on a calm, minimalist, and immersive environment rather than gamified distraction.

---

## 🎨 Design Philosophy & Aesthetic
* **Vagabond Atmosphere**: Designed with a matte appearance, earthy color palettes (charcoal, warm parchment, dark olive, muted brown, and subtle gold accents) and elegant typography (serif headings with brush-inspired title accents).
* **Calm & Focused**: Emphasizes spaciousness and clean borders over flashy, hyper-vibrant gamification, keeping you grounded in your daily path.
* **Zen Scroll Quotes**: Features a daily discipline and self-improvement themed quote displayed in a minimalist scroll layout.

---

## 🚀 Key Features

* **🔒 Secure Authentication**: Single-admin setup using JWT and `bcrypt` for secure, persistent password-protected access without open public sign-ups.
* **📅 Timetable & Task Management**:
  * Create multiple overlapping or sequential timetables with start and end dates.
  * Define a default daily schedule and add date-specific overrides.
  * Tasks are categorized (e.g., DSA, Development, College, Health, Reading, Personal, Custom) and become immutable once past their end times.
* **⚖️ Discipline & Punishments**:
  * Tasks can be completed only during the final 5 minutes of their scheduled window.
  * Missing a task incurs a mandatory, user-defined punishment (e.g., push-ups, writing lessons) tracked as pending/completed.
  * *Unavoidable Misses* (e.g., exams, medical reasons) bypass punishments but require a logged explanation.
* **⚡ XP & Leveling System**:
  * Earn 1 XP per minute of successfully completed tasks.
  * Spend accrued XP to reduce the duration of future tasks (up to 25%).
* **🌿 Focus Mode**:
  * Hide unnecessary UI when a task is in progress.
  * Displays only the active task, countdown timer, live IST clock, progress bar, daily quote, and the completion button.
* **📝 Daily Diary**:
  * A minimalist, distraction-free writing interface for reflections, thoughts, mood tracking, and custom tags.
* **📅 Interactive Calendar & Heatmap**:
  * A GitHub-style productivity heatmap and a color-coded monthly calendar (Green = Completed, Red = Missed, Grey = Unavoidable, Blue = Today).
* **⏳ Historical Timeline**:
  * A digital chronicle of each day. View scheduled tasks, XP, achievements, diary entries, reflections, and productivity metrics in a unified chronological view.

---

## 📁 Repository Structure

```
scheduleManager/
├── backend/
│   ├── src/
│   │   ├── config/       # Configuration (db connect, environment, etc.)
│   │   ├── controllers/  # API route handlers (thin controller layer)
│   │   ├── middleware/   # JWT verification, request validation, etc.
│   │   ├── models/       # Mongoose schemas (User, Task, Timetable, Diary, etc.)
│   │   ├── routes/       # Express endpoints mapping
│   │   ├── services/     # Core business logic
│   │   ├── utils/        # Utility helpers and time-zone conversions
│   │   └── server.js     # Entry point
│   ├── .env.example      # Example environment variables
│   ├── package.json      # Backend dependencies
│   └── src/server.js     # Express server starter
│
├── frontend/
│   ├── src/
│   │   ├── assets/       # Static assets, themes
│   │   ├── components/   # Reusable UI elements (Buttons, Inputs, Cards)
│   │   ├── context/      # AuthContext, ThemeContext, TaskContext
│   │   ├── pages/        # Dashboard, FocusMode, Calendar, Timeline, Diary, Notes
│   │   ├── utils/        # API client (Axios), date helpers (IST)
│   │   ├── App.jsx       # Layout, main routing
│   │   ├── index.css     # Design tokens and custom styling
│   │   └── main.jsx      # Vite React root
│   ├── package.json      # Frontend dependencies
│   ├── tailwind.config.js# Tailwind configuration
│   └── vite.config.js    # Vite configuration
│
└── Personal_Discipline_Scheduler_Project_Specification.docx  # Project spec doc
```

---

## ⚙️ Installation & Setup

### Prerequisites
* [Node.js](https://nodejs.org/) (v16+ recommended)
* [MongoDB](https://www.mongodb.com/) (Local or Atlas instance)

---

### 1. Backend Setup

1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend/` directory:
   ```env
   PORT=5000
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/discipline_db
   JWT_SECRET=your_super_secure_jwt_secret_key
   ```
4. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The server will run on `http://localhost:5000`.*

---

### 2. Frontend Setup

1. Navigate to the `frontend` folder:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The application will be accessible at `http://localhost:5173`.*

---

## 🌐 Timezone Consistency
All schedules, timestamps, and histories are calculated and formatted strictly in **Asia/Kolkata (IST)** time to maintain accurate statistics and streaks, regardless of local client browser timezones.

---

## 🏛️ Future-Ready Architecture
This codebase is organized using a highly modular MVC structure on the backend and context-driven routing on the frontend, ensuring simple extensibility for upcoming milestones:
* 👥 Multi-user cloud synchronization.
* 🤖 AI-powered schedule optimization and journal summarization.
* 📱 Progressive Web App (PWA) offline capabilities.
* 📝 Fully featured rich-text/markdown Notes editor (currently placeholder page).

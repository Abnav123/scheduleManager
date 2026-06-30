# Personal Discipline Scheduler

A full-stack scheduling, journaling, and discipline-tracking app built to help maintain focus, build habits, and review daily progress. The project is inspired by the calm, minimalist atmosphere of *Vagabond*, with a focus on structure and reflection instead of noisy gamification.

---

## Current Project State

- **Uncommitted edits currently present**:
  - `backend/src/services/taskService.js` includes duplicate task-instance cleanup during daily task generation.
  - `frontend/src/pages/TimetableManager.jsx` includes task editing behavior for timetable blueprints and date overrides.
  - `backend/src/utils/checkDb.js` is a new local database inspection/debug utility.
- **Verification status**:
  - `npm.cmd run lint` in `frontend/` passes cleanly.
  - `npm.cmd run build` in `frontend/` passes and generates the production bundle.

---

## Design Philosophy

- **Calm and focused**: The app favors a grounded interface, clear borders, and quiet visual hierarchy.
- **Discipline-first workflow**: Tasks are tied to scheduled time windows, completion rules, XP, and punishment tracking.
- **Reflection loop**: Diary, history, goals, stats, and achievements help connect daily action with long-term progress.
- **IST consistency**: Scheduling logic is centered around `Asia/Kolkata` time to keep tasks, streaks, and history aligned.

---

## Key Features

- **Secure authentication**: Single-admin JWT authentication with bcrypt password hashing.
- **Timetable management**: Create dated timetables, define default schedules, and add date-specific overrides.
- **Task lifecycle tracking**: Tasks move through upcoming, in-progress, ready-to-complete, completed, missed, and unavoidable states.
- **Completion window rules**: Tasks can only be completed near the end of their scheduled window.
- **Punishment tracking**: Missed tasks can create pending punishments that must be marked complete.
- **XP system**: Completed task minutes award XP, and XP can be spent to reduce future task duration.
- **Focus mode**: Shows the active task, countdown, progress, clock, quote, and completion action.
- **Diary and reflections**: Daily writing and review screens support habit reflection.
- **Stats and history**: Dashboard, calendar-style views, goals, achievements, and historical task data.

---

## Repository Structure

```text
scheduleManager/
  backend/
    src/
      config/        Database configuration
      controllers/   API route handlers
      middleware/    Auth and error middleware
      models/        Mongoose schemas
      routes/        Express route definitions
      services/      Core business logic
      utils/         Date helpers, seed scripts, debug utilities
      server.js      Express entry point
    package.json

  frontend/
    src/
      assets/        Static assets
      components/    Reusable UI components
      context/       Auth context
      pages/         App screens
      utils/         API client and date helpers
      App.jsx        Main routing
      main.jsx       React entry point
    package.json
    vite.config.js

  Personal_Discipline_Scheduler_Project_Specification.docx
```

---

## Setup

### Backend

```bash
cd backend
npm install
npm run dev
```

Create `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/discipline_db
JWT_SECRET=your_super_secure_jwt_secret_key
```

The backend runs on `http://localhost:5000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173`.

On Windows PowerShell, use `npm.cmd` if script execution policy blocks `npm.ps1`:

```bash
npm.cmd run dev
```

---

## Hosting

The frontend of the application is hosted on Vercel and can be accessed at:
- **Live URL**: [https://frontend-nine-steel-34.vercel.app/](https://frontend-nine-steel-34.vercel.app/)

### Deployment Configuration
- **Vercel Settings**: The project includes a [vercel.json](file:///E:/scheduleManager/frontend/vercel.json) configuration in the frontend directory to handle client-side routing rewrites for React Router.
- **Backend API URL**: In Vercel, the `VITE_API_URL` environment variable should be configured to point to the production backend API URL (e.g., `https://your-backend-domain.com/api`). If not set, it defaults to `http://localhost:5000/api` for local development.

---

## Useful Commands

```bash
# Frontend lint
cd frontend
npm.cmd run lint

# Frontend production build
cd frontend
npm.cmd run build

# Backend dev server
cd backend
npm.cmd run dev
```

---

## Notes

- The backend currently exposes `start` and `dev` scripts only.
- Frontend API calls currently target `http://localhost:5000/api` directly from `frontend/src/utils/api.js`.
- Add automated backend tests before treating the scheduling and XP logic as production-safe.

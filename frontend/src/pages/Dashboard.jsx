import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import api from '../utils/api.js';
import { 
  Flame, Award, CheckCircle, AlertTriangle, HelpCircle, 
  Clock, ShieldAlert, Sparkles, ChevronRight, Eye, RefreshCw 
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import moment from 'moment';

// Memoized Task Card to optimize rendering
const TaskCard = React.memo(({ task, onComplete, onReduce, onUnavoidable, onPunishmentComplete, userXp }) => {
  const [showReduceInput, setShowReduceInput] = useState(false);
  const [reduceMinutes, setReduceMinutes] = useState('');
  const [showUnavoidableInput, setShowUnavoidableInput] = useState(false);
  const [unavoidableReason, setUnavoidableReason] = useState('');
  const [error, setError] = useState('');

  const statusColors = {
    Upcoming: 'border-vagabond-slate bg-vagabond-dark bg-opacity-40 text-vagabond-parchment text-opacity-60',
    'In Progress': 'border-vagabond-olive bg-vagabond-olive bg-opacity-10 text-[#a3b899]',
    'Ready To Complete': 'border-vagabond-gold bg-vagabond-gold bg-opacity-10 text-vagabond-gold animate-pulse',
    Completed: 'border-vagabond-green bg-vagabond-green bg-opacity-25 text-[#73af88]',
    Missed: 'border-vagabond-red bg-vagabond-red bg-opacity-20 text-[#bf6363]',
    Unavoidable: 'border-gray-700 bg-gray-900 bg-opacity-50 text-gray-400',
  };

  const categoryLabels = {
    DSA: 'DSA ⚔️',
    Development: 'Development 💻',
    College: 'College 🏛️',
    Health: 'Health 🌿',
    Reading: 'Reading 📖',
    Personal: 'Personal 👤',
    Custom: 'Custom ✨',
  };

  const handleReduceSubmit = (e) => {
    e.preventDefault();
    const mins = Number(reduceMinutes);
    if (!mins || mins <= 0) {
      setError('Enter valid minutes');
      return;
    }
    onReduce(task._id, mins);
    setShowReduceInput(false);
    setReduceMinutes('');
    setError('');
  };

  const handleUnavoidableSubmit = (e) => {
    e.preventDefault();
    if (!unavoidableReason.trim()) {
      setError('Reason required');
      return;
    }
    onUnavoidable(task._id, unavoidableReason);
    setShowUnavoidableInput(false);
    setUnavoidableReason('');
    setError('');
  };

  // Determine actions visibility
  const isUpcoming = task.status === 'Upcoming';
  const isExpired = task.status === 'Missed';
  const isCompleted = task.status === 'Completed';
  const isUnavoidable = task.status === 'Unavoidable';
  const isActionable = !isCompleted && !isUnavoidable && !isExpired;

  return (
    <div className={`p-5 rounded-lg border transition-all duration-300 ${statusColors[task.status]} hover:shadow-zen hover:scale-[1.005]`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Header Metadata */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] uppercase tracking-widest font-serif font-bold text-vagabond-gold">
              {categoryLabels[task.category] || task.category}
            </span>
            <span className="text-[10px] font-mono text-vagabond-brown">
              {task.startTime} - {task.endTime} ({task.reducedDuration}m)
            </span>
            {task.xpSpent > 0 && (
              <span className="text-[9px] font-mono px-1.5 py-0.5 border border-vagabond-gold rounded text-vagabond-gold text-opacity-90">
                Reduced (-{task.xpSpent}m)
              </span>
            )}
          </div>
          <h4 className="text-lg font-serif tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-vagabond-parchment to-white">
            {task.name}
          </h4>
          {task.notes && (
            <p className="text-xs text-vagabond-brown italic font-serif mt-1">
              "{task.notes}"
            </p>
          )}
          {task.unavoidableReason && (
            <p className="text-xs text-[#a19888] font-serif mt-1">
              <strong>Reason:</strong> {task.unavoidableReason}
            </p>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 1. Complete Task (Visible in Ready to Complete) */}
          {task.status === 'Ready To Complete' && (
            <button
              onClick={() => onComplete(task._id)}
              className="px-4 py-2 bg-vagabond-gold text-black rounded text-xs uppercase tracking-widest font-bold hover:bg-opacity-90 font-serif"
            >
              Sheathe Sword
            </button>
          )}

          {/* 2. Spend XP (Visible in Upcoming) */}
          {isUpcoming && (
            <button
              onClick={() => {
                setShowReduceInput(!showReduceInput);
                setShowUnavoidableInput(false);
              }}
              className="px-3 py-1.5 border border-vagabond-gold border-opacity-35 text-vagabond-gold rounded text-xs hover:bg-vagabond-gold hover:text-black font-serif transition-all duration-200"
            >
              Spend XP
            </button>
          )}

          {/* 3. Mark Unavoidable */}
          {isActionable && (
            <button
              onClick={() => {
                setShowUnavoidableInput(!showUnavoidableInput);
                setShowReduceInput(false);
              }}
              className="px-3 py-1.5 border border-gray-600 text-gray-300 rounded text-xs hover:bg-gray-700 hover:text-white font-serif transition-all duration-200"
            >
              Unavoidable
            </button>
          )}

          {/* 4. Missed tasks punishment controls */}
          {isExpired && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-vagabond-red font-serif">
                Punishment: <strong className="underline">{task.punishment}</strong>
              </span>
              {task.punishmentStatus === 'Pending' ? (
                <button
                  onClick={() => onPunishmentComplete(task._id)}
                  className="px-2.5 py-1.5 border border-vagabond-red text-vagabond-red rounded text-xs hover:bg-vagabond-red hover:text-white font-serif transition-all duration-200"
                >
                  Completed
                </button>
              ) : (
                <span className="text-xs font-serif font-bold text-vagabond-green">
                  ✓ Done
                </span>
              )}
            </div>
          )}

          {/* XP details */}
          {isCompleted && (
            <span className="text-xs font-mono text-vagabond-green font-bold">
              +{task.xpEarned} XP
            </span>
          )}
        </div>
      </div>

      {/* Error Callouts in forms */}
      {error && <p className="text-[10px] text-vagabond-red font-serif mt-2">{error}</p>}

      {/* Inline Forms for Spend XP */}
      {showReduceInput && (
        <form onSubmit={handleReduceSubmit} className="mt-4 pt-4 border-t border-vagabond-slate flex items-center gap-2 animate-fade-in">
          <input
            type="number"
            value={reduceMinutes}
            onChange={(e) => setReduceMinutes(e.target.value)}
            placeholder={`Mins (Max ${Math.floor(task.originalDuration * 0.25)}m)`}
            className="px-3 py-1.5 rounded border border-vagabond-slate bg-vagabond-dark text-xs w-40 text-vagabond-parchment focus:outline-none focus:border-vagabond-gold"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-vagabond-gold text-black rounded text-xs uppercase font-bold font-serif"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={() => setShowReduceInput(false)}
            className="p-1.5 text-gray-400 hover:text-white"
          >
            <X size={16} />
          </button>
        </form>
      )}

      {/* Inline Forms for Unavoidable Reason */}
      {showUnavoidableInput && (
        <form onSubmit={handleUnavoidableSubmit} className="mt-4 pt-4 border-t border-vagabond-slate flex items-center gap-2 animate-fade-in">
          <input
            type="text"
            value={unavoidableReason}
            onChange={(e) => setUnavoidableReason(e.target.value)}
            placeholder="e.g. Travel, Exam, Interview"
            className="px-3 py-1.5 rounded border border-vagabond-slate bg-vagabond-dark text-xs w-full max-w-sm text-vagabond-parchment focus:outline-none focus:border-vagabond-gold"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-vagabond-gold text-black rounded text-xs uppercase font-bold font-serif"
          >
            Submit
          </button>
          <button
            type="button"
            onClick={() => setShowUnavoidableInput(false)}
            className="p-1.5 text-gray-400 hover:text-white"
          >
            <X size={16} />
          </button>
        </form>
      )}
    </div>
  );
});

const Dashboard = ({ onEnterFocusMode }) => {
  const { user, refreshUser } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState('');
  const [error, setError] = useState('');

  // 1. Fetch Dashboard data
  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/stats/dashboard');
      setData(res.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Could not establish connection to the Way.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // 2. Countdown Ticker calculations
  useEffect(() => {
    if (!data) return;

    let totalSeconds = data.countdownSeconds;
    if (totalSeconds <= 0) {
      setCountdown('');
      return;
    }

    const interval = setInterval(() => {
      totalSeconds--;
      if (totalSeconds <= 0) {
        setCountdown('');
        clearInterval(interval);
        // Refresh dashboard to pull new task structures
        fetchDashboard();
        return;
      }

      const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
      const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
      const s = String(totalSeconds % 60).padStart(2, '0');
      setCountdown(`${h}:${m}:${s}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [data, fetchDashboard]);

  // 3. Memoize task action callbacks using useCallback as requested
  const handleCompleteTask = useCallback(async (taskId) => {
    try {
      await api.post(`/tasks/${taskId}/complete`);
      await fetchDashboard();
      await refreshUser();
    } catch (err) {
      alert(err.response?.data?.message || 'Completion failed.');
    }
  }, [fetchDashboard, refreshUser]);

  const handleReduceDuration = useCallback(async (taskId, minutes) => {
    try {
      await api.post(`/tasks/${taskId}/reduce-duration`, { minutes });
      await fetchDashboard();
      await refreshUser();
    } catch (err) {
      alert(err.response?.data?.message || 'XP reduction failed.');
    }
  }, [fetchDashboard, refreshUser]);

  const handleMarkUnavoidable = useCallback(async (taskId, reason) => {
    try {
      await api.post(`/tasks/${taskId}/unavoidable`, { reason });
      await fetchDashboard();
      await refreshUser();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to mark unavoidable.');
    }
  }, [fetchDashboard, refreshUser]);

  const handlePunishmentComplete = useCallback(async (taskId) => {
    try {
      await api.post(`/tasks/${taskId}/punishment`, { status: 'Completed' });
      await fetchDashboard();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update punishment.');
    }
  }, [fetchDashboard]);

  // Sort daily tasks chronologically
  const sortedTasks = useMemo(() => {
    if (!data?.todayTasks) return [];
    return [...data.todayTasks].sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [data?.todayTasks]);

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-vagabond-gold">
        <RefreshCw className="animate-spin" size={32} />
        <span className="font-serif italic text-sm">Quietly sharpening your path...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-3 text-vagabond-red">
        <ShieldAlert size={48} />
        <h3 className="text-xl font-serif">{error}</h3>
        <button onClick={fetchDashboard} className="mt-2 px-4 py-2 border border-vagabond-red rounded text-xs uppercase tracking-widest hover:bg-vagabond-red hover:text-white font-serif">
          Retry Connection
        </button>
      </div>
    );
  }

  const { stats, dailyQuote, currentTask, nextTask, activeGoals } = data;

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto">
      {/* 1. Header Quote Banner (Zen Scroll design) */}
      {dailyQuote && (
        <section className="relative overflow-hidden p-6 border border-vagabond-brown border-opacity-15 rounded bg-vagabond-charcoal shadow-zen animate-scroll-unfurl">
          <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-vagabond-brown"></div>
          <div className="absolute top-0 bottom-0 right-0 w-1.5 bg-vagabond-brown"></div>
          <p className="font-serif italic text-base md:text-lg text-center leading-relaxed text-vagabond-parchment">
            "{dailyQuote.quote}"
          </p>
          <p className="text-right text-xs uppercase font-serif tracking-widest text-vagabond-gold mt-3">
            — {dailyQuote.author}
          </p>
        </section>
      )}

      {/* 2. Hero segment: Current task / countdown block */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Countdown Clock */}
        <div className="lg:col-span-2 p-6 border border-vagabond-slate rounded-lg bg-vagabond-charcoal flex flex-col justify-between min-h-[220px]">
          <div>
            <span className="text-[10px] uppercase font-serif tracking-widest text-vagabond-gold font-bold flex items-center gap-1.5 mb-2">
              <Sparkles size={12} />
              Current Concentration Focus
            </span>
            {currentTask ? (
              <div>
                <h3 className="text-2xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-vagabond-parchment">
                  {currentTask.name}
                </h3>
                <p className="text-xs text-vagabond-brown font-mono mt-1">
                  Active interval: {currentTask.startTime} - {currentTask.endTime} ({currentTask.reducedDuration}m)
                </p>
              </div>
            ) : (
              <div>
                <h3 className="text-2xl font-serif font-bold text-vagabond-brown">
                  No Active Task
                </h3>
                <p className="text-xs text-vagabond-brown italic font-serif mt-1">
                  Empty your mind. Focus on your breath and wait for the next hour.
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mt-6">
            {countdown ? (
              <div>
                <span className="text-[9px] uppercase tracking-wider text-vagabond-brown font-mono block mb-1">
                  Remaining Session Duration
                </span>
                <div className="font-mono text-4xl sm:text-5xl font-bold tracking-widest text-vagabond-gold select-none">
                  {countdown}
                </div>
              </div>
            ) : (
              <div className="font-mono text-xl text-vagabond-brown font-bold italic">
                Chamber is Silent
              </div>
            )}

            {currentTask && (
              <button
                onClick={onEnterFocusMode}
                className="px-5 py-2.5 border border-vagabond-gold bg-vagabond-gold bg-opacity-5 hover:bg-opacity-100 hover:text-black text-vagabond-gold text-xs uppercase tracking-widest font-bold rounded transition-all duration-300 font-serif flex items-center gap-2 shadow-gold-glow"
              >
                <Eye size={14} />
                <span>Enter Focus Mode</span>
              </button>
            )}
          </div>
        </div>

        {/* Level Stats Quick summary */}
        <div className="p-6 border border-vagabond-slate rounded-lg bg-vagabond-charcoal flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4 border-b border-vagabond-slate pb-3">
            <span className="font-serif text-sm uppercase tracking-wider text-vagabond-gold">Warrior Metrics</span>
            <Flame size={16} className="text-vagabond-red animate-pulse" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase font-mono text-vagabond-brown">Streak</span>
              <span className="text-2xl font-serif font-bold text-vagabond-gold">{stats.currentStreak} Days</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase font-mono text-vagabond-brown">Focus Hours</span>
              <span className="text-2xl font-serif font-bold text-vagabond-parchment">{stats.focusHours}h</span>
            </div>
            <div className="flex flex-col gap-0.5 col-span-2">
              <span className="text-[10px] uppercase font-mono text-vagabond-brown">Productivity Index</span>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-serif font-bold text-vagabond-green">{stats.productivityScore}%</span>
                <span className="text-[10px] text-vagabond-brown italic font-serif">
                  ({stats.completed} of {stats.totalTasks - stats.unavoidable} done)
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-vagabond-slate text-[11px] text-vagabond-brown font-mono flex items-center justify-between">
            <span>Next Task:</span>
            <span className="text-vagabond-parchment">
              {nextTask ? `${nextTask.name} (${nextTask.startTime})` : 'None'}
            </span>
          </div>
        </div>
      </section>

      {/* 3. Daily task listing */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Today's timeline tasks list */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-serif tracking-wide border-b border-vagabond-gold pb-1.5">
              Daily Schedule
            </h3>
            <span className="text-xs text-vagabond-brown font-mono">
              {sortedTasks.length} task instances
            </span>
          </div>

          <div className="flex flex-col gap-4">
            {sortedTasks.length > 0 ? (
              sortedTasks.map((task) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  onComplete={handleCompleteTask}
                  onReduce={handleReduceDuration}
                  onUnavoidable={handleMarkUnavoidable}
                  onPunishmentComplete={handlePunishmentComplete}
                  userXp={user?.xp || 0}
                />
              ))
            ) : (
              <div className="p-8 text-center border border-dashed border-vagabond-slate rounded-lg text-vagabond-brown">
                <p className="font-serif italic text-sm">No tasks scheduled for today.</p>
                <NavLink to="/timetables" className="text-xs text-vagabond-gold underline font-mono block mt-2">
                  Create/Activate a timetable schedule
                </NavLink>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar panels: Active Goals & Diary reminder */}
        <div className="flex flex-col gap-6">
          {/* Active Goals list */}
          <div className="p-6 border border-vagabond-slate rounded-lg bg-vagabond-charcoal">
            <h3 className="font-serif text-sm uppercase tracking-wider text-vagabond-gold border-b border-vagabond-slate pb-3 mb-4 flex items-center gap-2">
              <Award size={16} />
              Active Goals
            </h3>

            <div className="flex flex-col gap-4">
              {activeGoals.length > 0 ? (
                activeGoals.map((goal) => {
                  const percent = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
                  return (
                    <div key={goal._id} className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-serif text-vagabond-parchment font-medium truncate max-w-[150px]">{goal.name}</span>
                        <span className="font-mono text-vagabond-gold">{goal.currentValue}/{goal.targetValue}</span>
                      </div>
                      <div className="w-full bg-vagabond-slate h-1 rounded-full overflow-hidden">
                        <div className="bg-vagabond-gold h-full rounded-full" style={{ width: `${percent}%` }}></div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-xs text-vagabond-brown italic font-serif text-center py-4">
                  No active goals set.
                  <NavLink to="/goals" className="underline block mt-1">Set a discipline goal</NavLink>
                </div>
              )}
            </div>
          </div>

          {/* Quick links to reflection / diary writing */}
          <div className="p-5 border border-vagabond-slate rounded-lg bg-vagabond-charcoal flex flex-col justify-between gap-4">
            <div>
              <h4 className="font-serif text-sm font-bold text-vagabond-parchment mb-1">
                Reflections of the Day
              </h4>
              <p className="text-xs text-vagabond-brown font-serif italic">
                At the end of the day, record your actions, assess your failures, and adjust your spirit.
              </p>
            </div>
            <NavLink
              to="/diary"
              className="flex items-center justify-center gap-2 py-2 border border-vagabond-brown hover:border-vagabond-gold hover:text-vagabond-gold text-xs uppercase tracking-widest font-bold rounded transition-all duration-300 font-serif text-vagabond-parchment"
            >
              <span>Write reflection</span>
              <ChevronRight size={14} />
            </NavLink>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;

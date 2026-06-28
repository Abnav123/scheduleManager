import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { AuthContext } from '../context/AuthContextValue.jsx';
import api from '../utils/api.js';
import { 
  Flame, Award, ShieldAlert, Sparkles, ChevronRight, Eye, RefreshCw, X 
} from 'lucide-react';
import { NavLink } from 'react-router-dom';

// Memoized Task Card to optimize rendering
const TaskCard = React.memo(({ task, onComplete, onReduce, onUnavoidable, onPunishmentComplete }) => {
  const [showReduceInput, setShowReduceInput] = useState(false);
  const [reduceMinutes, setReduceMinutes] = useState('');
  const [showUnavoidableInput, setShowUnavoidableInput] = useState(false);
  const [unavoidableReason, setUnavoidableReason] = useState('');
  const [error, setError] = useState('');

  const statusColors = {
    Upcoming: 'border-2 border-neutral-600 bg-[#0e1017] text-neutral-400',
    'In Progress': 'border-2 border-white bg-[#0e1017] text-white font-semibold shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]',
    'Ready To Complete': 'border-2 border-white bg-[#0e1017] text-white font-bold animate-pulse shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]',
    Completed: 'border-2 border-neutral-700 bg-[#0e1017] text-neutral-500 opacity-60',
    Missed: 'border-2 border-white bg-[#ff0000] bg-opacity-10 text-white shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]',
    Unavoidable: 'border-2 border-dashed border-neutral-600 bg-[#0e1017] text-neutral-500',
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
    <div className={`p-5 rounded-none transition-all duration-200 ${statusColors[task.status]}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Header Metadata */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] uppercase font-bold text-white border border-white bg-[#0e1017] px-1.5 py-0.5 font-mono">
              {categoryLabels[task.category] || task.category}
            </span>
            <span className="text-[10px] font-mono text-neutral-400 font-bold">
              {task.startTime} - {task.endTime} ({task.reducedDuration}m)
            </span>
            {task.xpSpent > 0 && (
              <span className="text-[9px] font-mono px-1.5 py-0.5 border border-white bg-[#ffff00] text-black font-bold">
                Reduced (-{task.xpSpent}m)
              </span>
            )}
          </div>
          <h4 className="text-lg font-bold text-white">
            {task.name}
          </h4>
          {task.notes && (
            <p className="text-xs text-neutral-400 italic font-mono mt-1">
              "{task.notes}"
            </p>
          )}
          {task.unavoidableReason && (
            <p className="text-xs text-neutral-400 mt-1 font-mono">
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
              className="btn-green"
            >
              Complete Task
            </button>
          )}

          {/* 2. Spend XP (Visible in Upcoming) */}
          {isUpcoming && (
            <button
              onClick={() => {
                setShowReduceInput(!showReduceInput);
                setShowUnavoidableInput(false);
              }}
              className="btn-yellow"
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
              className="btn-blue"
            >
              Unavoidable
            </button>
          )}

          {/* 4. Missed tasks punishment controls */}
          {isExpired && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-300 font-mono">
                Punishment: <strong className="underline">{task.punishment}</strong>
              </span>
              {task.punishmentStatus === 'Pending' ? (
                <button
                  onClick={() => onPunishmentComplete(task._id)}
                  className="btn-red text-xs px-2 py-1"
                >
                  Mark Done
                </button>
              ) : (
                <span className="text-xs font-bold text-green-400 border border-white px-2 py-0.5 bg-[#0e1017] font-mono">
                  ✓ Done
                </span>
              )}
            </div>
          )}

          {/* XP details */}
          {isCompleted && (
            <span className="text-xs font-bold text-green-400 border border-white px-2 py-0.5 bg-[#0e1017] font-mono">
              +{task.xpEarned} XP
            </span>
          )}
        </div>
      </div>

      {/* Error Callouts in forms */}
      {error && <p className="text-[10px] text-red-500 font-mono font-bold mt-2">{error}</p>}

      {/* Inline Forms for Spend XP */}
      {showReduceInput && (
        <form onSubmit={handleReduceSubmit} className="mt-4 pt-4 border-t-2 border-white flex items-center gap-2 animate-fade-in">
          <input
            type="number"
            value={reduceMinutes}
            onChange={(e) => setReduceMinutes(e.target.value)}
            placeholder={`Mins (Max ${Math.floor(task.originalDuration * 0.25)}m)`}
            className="px-3 py-1.5 rounded-none border-2 border-white text-xs w-40 bg-[#0e1017] text-white focus:outline-none"
          />
          <button
            type="submit"
            className="btn-yellow text-xs px-3 py-1.5"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={() => setShowReduceInput(false)}
            className="p-1.5 text-white hover:bg-neutral-900 border-2 border-transparent hover:border-white"
          >
            <X size={16} />
          </button>
        </form>
      )}

      {/* Inline Forms for Unavoidable Reason */}
      {showUnavoidableInput && (
        <form onSubmit={handleUnavoidableSubmit} className="mt-4 pt-4 border-t-2 border-white flex items-center gap-2 animate-fade-in">
          <input
            type="text"
            value={unavoidableReason}
            onChange={(e) => setUnavoidableReason(e.target.value)}
            placeholder="e.g. Travel, Exam, Interview"
            className="px-3 py-1.5 rounded-none border-2 border-white text-xs w-full max-w-sm bg-[#0e1017] text-white focus:outline-none"
          />
          <button
            type="submit"
            className="btn-blue text-xs px-3 py-1.5"
          >
            Submit
          </button>
          <button
            type="button"
            onClick={() => setShowUnavoidableInput(false)}
            className="p-1.5 text-white hover:bg-neutral-900 border-2 border-transparent hover:border-white"
          >
            <X size={16} />
          </button>
        </form>
      )}
    </div>
  );
});

const Dashboard = ({ onEnterFocusMode }) => {
  const { refreshUser } = useContext(AuthContext);
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
      setError('Could not establish connection to shuttle logs.');
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

  // 3. Memoize task action callbacks
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
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-white">
        <RefreshCw className="animate-spin" size={32} />
        <span className="font-mono text-sm font-bold">Scanning shuttle tasks...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-3 text-red-500 font-mono">
        <ShieldAlert size={48} />
        <h3 className="text-xl font-bold">{error}</h3>
        <button onClick={fetchDashboard} className="mt-2 btn-red">
          Retry Sync
        </button>
      </div>
    );
  }

  const { stats, dailyQuote, currentTask, nextTask, activeGoals } = data;

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto text-white">
      {/* 1. Header Quote Banner (Minimal Brutalist Box) */}
      {dailyQuote && (
        <section className="relative overflow-hidden p-6 border-2 border-white bg-[#0e1017] brutalist-card">
          <p className="font-mono italic text-base md:text-lg text-center leading-relaxed text-white">
            "{dailyQuote.quote}"
          </p>
          <p className="text-right text-xs uppercase font-bold tracking-widest text-white mt-3 font-mono">
            — {dailyQuote.author}
          </p>
        </section>
      )}

      {/* 2. Hero segment: Current task / countdown block */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Countdown Clock */}
        <div className="lg:col-span-2 p-6 border-2 border-white bg-[#0e1017] brutalist-card flex flex-col justify-between min-h-[220px]">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-white flex items-center gap-1.5 mb-2 font-mono">
              <Sparkles size={12} className="text-white" />
              Active Objective
            </span>
            {currentTask ? (
              <div>
                <h3 className="text-2xl font-bold text-white font-mono">
                  {currentTask.name}
                </h3>
                <p className="text-xs text-neutral-400 font-mono mt-1">
                  Active interval: {currentTask.startTime} - {currentTask.endTime} ({currentTask.reducedDuration}m)
                </p>
              </div>
            ) : (
              <div>
                <h3 className="text-2xl font-bold text-neutral-500 font-mono">
                  No Active Objective
                </h3>
                <p className="text-xs text-neutral-400 italic mt-1 font-mono">
                  All systems nominal. Awaiting next command.
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mt-6">
            {countdown ? (
              <div>
                <span className="text-[9px] uppercase tracking-wider text-neutral-400 font-mono block mb-1">
                  {currentTask ? 'Task Time Remaining' : 'Next Venture In'}
                </span>
                <div className="font-mono text-4xl sm:text-5xl font-bold tracking-widest text-white select-none">
                  {countdown}
                </div>
              </div>
            ) : (
              <div className="font-mono text-xl text-neutral-500 font-bold italic">
                Awaiting Venture
              </div>
            )}

            {currentTask && (
              <button
                onClick={onEnterFocusMode}
                className="btn-blue flex items-center gap-2"
              >
                <Eye size={14} />
                <span>Fix Wiring (Focus Mode)</span>
              </button>
            )}
          </div>
        </div>

        {/* Level Stats Quick summary */}
        <div className="p-6 border-2 border-white bg-[#0e1017] brutalist-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4 border-b-2 border-white pb-3">
            <span className="text-sm uppercase tracking-wider text-white font-bold font-mono">Crewmate Metrics</span>
            <Flame size={16} className="text-white animate-pulse" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase font-mono text-neutral-400 font-bold">Streak</span>
              <span className="text-2xl font-bold text-white font-mono">{stats.currentStreak} Days</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase font-mono text-neutral-400 font-bold">Focus Hours</span>
              <span className="text-2xl font-bold text-white font-mono">{stats.focusHours}h</span>
            </div>
            <div className="flex flex-col gap-0.5 col-span-2">
              <span className="text-[10px] uppercase font-mono text-neutral-400 font-bold">Task Efficiency</span>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-green-400 font-mono">{stats.productivityScore}%</span>
                <span className="text-[10px] text-neutral-400 font-mono">
                  ({stats.completed} / {stats.totalTasks - stats.unavoidable} done)
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t-2 border-white text-[11px] font-mono flex items-center justify-between">
            <span className="text-neutral-400 font-bold">Next Task:</span>
            <span className="text-white font-bold">
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
            <h3 className="text-xl font-bold tracking-wide border-b-2 border-white pb-1.5 font-mono">
              Active Task List
            </h3>
            <span className="text-xs text-neutral-400 font-mono font-bold">
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
                />
              ))
            ) : (
              <div className="p-8 text-center border-2 border-dashed border-white bg-[#0e1017] text-neutral-400">
                <p className="font-mono text-sm">No tasks scheduled for today's flight.</p>
                <NavLink to="/timetables" className="text-xs text-white font-bold font-mono block mt-2 underline">
                  Activate a timetable blueprint
                </NavLink>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar panels: Active Goals & Diary reminder */}
        <div className="flex flex-col gap-6">
          {/* Active Goals list */}
          <div className="p-6 border-2 border-white bg-[#0e1017] brutalist-card">
            <h3 className="text-sm uppercase tracking-wider text-white font-bold border-b-2 border-white pb-3 mb-4 flex items-center gap-2 font-mono">
              <Award size={16} />
              Mission Goals
            </h3>

            <div className="flex flex-col gap-4">
              {activeGoals.length > 0 ? (
                activeGoals.map((goal) => {
                  const percent = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
                  return (
                    <div key={goal._id} className="flex flex-col gap-1 font-mono">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-white truncate max-w-[150px]">{goal.name}</span>
                        <span className="text-white">{goal.currentValue}/{goal.targetValue}</span>
                      </div>
                      <div className="w-full bg-neutral-800 border border-white h-3 overflow-hidden">
                        <div className="bg-[#ffff00] h-full" style={{ width: `${percent}%` }}></div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-xs text-neutral-400 italic text-center py-4 font-mono">
                  No active shuttle goals.
                  <NavLink to="/goals" className="underline block mt-1 font-bold text-white">Formulate Goal</NavLink>
                </div>
              )}
            </div>
          </div>

          {/* Quick links to reflection / diary writing */}
          <div className="p-5 border-2 border-white bg-[#0e1017] brutalist-card flex flex-col justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-white mb-1 font-mono">
                Log reflection
              </h4>
              <p className="text-xs text-neutral-400 font-mono">
                Log EOD reflections to report sabotages and success events to shuttle command.
              </p>
            </div>
            <NavLink
              to="/diary"
              className="btn-blue flex items-center justify-center gap-2 py-2"
            >
              <span>Submit Report</span>
              <ChevronRight size={14} />
            </NavLink>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;

import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Check, X, Shield } from 'lucide-react';
import moment from 'moment';

const FocusMode = ({ task, onExit, onComplete }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [percentElapsed, setPercentElapsed] = useState(0);
  const [canComplete, setCanComplete] = useState(false);
  const [currentTimeIST, setCurrentTimeIST] = useState('');

  // 1. Live IST Clock (Date + Time without seconds)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const dateFormatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      const timeFormatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      setCurrentTimeIST(`${dateFormatter.format(now)} | ${timeFormatter.format(now)}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  // 2. Countdown Timer & Progress Bar Calculations
  useEffect(() => {
    if (!task) return;

    const interval = setInterval(() => {
      const now = moment();
      const start = moment(task.scheduledStart);
      const end = moment(task.scheduledEnd);

      if (now.isAfter(end)) {
        setTimeLeft('00:00:00');
        setPercentElapsed(100);
        setCanComplete(false);
        clearInterval(interval);
        return;
      }

      // Calculate time remaining
      const duration = moment.duration(end.diff(now));
      const hours = String(Math.floor(duration.asHours())).padStart(2, '0');
      const minutes = String(duration.minutes()).padStart(2, '0');
      const seconds = String(duration.seconds()).padStart(2, '0');
      
      setTimeLeft(`${hours}:${minutes}:${seconds}`);

      // Calculate percent elapsed
      const totalDuration = end.diff(start);
      const elapsed = now.diff(start);
      const percent = Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)));
      setPercentElapsed(percent);

      // Enforce completion window
      const durationMinutes = end.diff(start, 'minutes');
      const windowMinutes = Math.max(5, durationMinutes * 0.03);
      const startWindow = moment(end).subtract(windowMinutes, 'minutes');
      const isWithinWindow = now.isSameOrAfter(startWindow) && now.isSameOrBefore(end);
      setCanComplete(isWithinWindow);
    }, 1000);

    return () => clearInterval(interval);
  }, [task]);

  // Static fallback quotes just in case
  const defaultQuote = useMemo(() => ({
    quote: "Do nothing that is of no use. Think only of what is necessary.",
    author: "Miyamoto Musashi"
  }), []);

  return (
    <div className="fixed inset-0 z-50 bg-[#030408] text-white flex flex-col items-center justify-between p-4 sm:py-6 sm:px-12 overflow-hidden select-none border-4 border-white font-mono">
      
      {/* Top Bar: IST Clock and Shield */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between z-10 gap-2 text-center shrink-0">
        <div className="flex items-center gap-2 text-xs tracking-widest text-white font-mono uppercase font-bold">
          <Shield size={14} className="text-white" />
          <span>Mind Shield Active</span>
        </div>
        <div className="font-mono text-sm sm:text-base text-white flex items-center gap-2 font-bold">
          <Clock size={16} />
          <span>{currentTimeIST}</span>
        </div>
      </div>

      {/* Main Focus Dashboard */}
      <div className="w-full max-w-3xl text-center flex flex-col items-center justify-center gap-3 sm:gap-4 z-10 flex-1 my-2 shrink-0">
        {task ? (
          <>
            {/* Category Tag */}
            <span className="px-4 py-1 border-2 border-white bg-[#ffff00] text-black text-xs font-mono font-bold uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
              {task.category}
            </span>

            {/* Task Name */}
            <h2 className="text-xl sm:text-3xl md:text-4xl font-bold tracking-wider text-white px-2">
              {task.name}
            </h2>

            {/* Large Countdown Clock */}
            <div className="text-4xl sm:text-5xl md:text-7xl font-mono tracking-widest text-white font-bold select-none my-1">
              {timeLeft || '00:00:00'}
            </div>

            {/* Minimalist Progress Bar */}
            <div className="w-full max-w-xl flex flex-col gap-1.5 px-2">
              <div className="w-full bg-neutral-850 border-2 border-white h-4 overflow-hidden">
                <div 
                  className="bg-[#0000ff] border-r border-white h-full transition-all duration-1000 ease-out"
                  style={{ width: `${percentElapsed}%` }}
                ></div>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-between text-[10px] sm:text-xs text-neutral-400 font-mono font-bold gap-1">
                <span>Started: {task.startTime}</span>
                <span>{percentElapsed}% Completed</span>
                <span>End: {task.endTime}</span>
              </div>
            </div>

            {/* Completion Button */}
            <div className="mt-2 sm:mt-4 flex flex-col items-center gap-2">
              {canComplete ? (
                <button
                  onClick={() => onComplete(task._id)}
                  className="btn-green flex items-center gap-3 px-8 py-3"
                >
                  <Check size={20} />
                  <span>Reach Completion</span>
                </button>
              ) : (
                <div className="text-xs sm:text-sm text-neutral-400 font-mono flex flex-col items-center gap-1 font-bold max-w-md px-4">
                  <span>The task is in progress.</span>
                  <span className="text-[10px] uppercase tracking-wider text-opacity-70 font-bold">
                    Complete button activates in the final window (3% or 5 mins)
                  </span>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <h2 className="text-2xl sm:text-3xl font-bold text-neutral-500">Empty Mind</h2>
            <p className="text-xs sm:text-sm italic font-mono text-neutral-400 max-w-md">
              "When you have no task before you, focus on your breathing. Remain still, clear your thoughts, and prepare your spirit."
            </p>
          </div>
        )}
      </div>

      {/* Bottom Segment: Zen Quote and Exit Button */}
      <div className="w-full flex flex-col items-center gap-3 sm:gap-4 z-10 shrink-0">
        {/* Quote Card */}
        <div className="w-full max-w-2xl px-4 py-3 sm:px-6 sm:py-4 border-2 border-white bg-[#0e1017] brutalist-card relative overflow-hidden text-xs sm:text-sm">
          <p className="italic text-center text-white leading-relaxed">
            "{task?.notes || defaultQuote.quote}"
          </p>
          <p className="text-right text-[9px] uppercase font-mono tracking-widest text-white font-bold mt-1.5">
            — {task ? 'Task Focus Note' : defaultQuote.author}
          </p>
        </div>

        {/* Exit Button */}
        <button
          onClick={onExit}
          className="btn-red flex items-center gap-2 px-6 py-2"
        >
          <X size={14} />
          <span>Exit Focus Chamber</span>
        </button>
      </div>
    </div>
  );
};

export default FocusMode;

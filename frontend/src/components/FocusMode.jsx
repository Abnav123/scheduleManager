import React, { useState, useEffect, useMemo } from 'react';
import { Eye, Clock, Check, X, Shield } from 'lucide-react';
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

      // Enforce the completion window: max of 5 mins or 3% of task duration
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
    <div className="fixed inset-0 z-50 bg-[#060606] text-vagabond-parchment flex flex-col items-center justify-between p-12 overflow-hidden select-none select-none">
      {/* Background Ink Gradient and Rice-paper texture */}
      <div className="absolute inset-0 bg-rice-paper opacity-[0.02] pointer-events-none"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-80 pointer-events-none"></div>

      {/* Top Bar: IST Clock and Shield */}
      <div className="w-full flex items-center justify-between z-10">
        <div className="flex items-center gap-2 text-xs tracking-widest text-vagabond-brown font-serif uppercase">
          <Shield size={14} className="text-vagabond-gold" />
          <span>Mind Shield Active</span>
        </div>
        <div className="font-mono text-lg text-vagabond-gold flex items-center gap-2">
          <Clock size={18} />
          <span>{currentTimeIST}</span>
        </div>
      </div>

      {/* Main Focus Dashboard */}
      <div className="w-full max-w-3xl text-center flex flex-col items-center justify-center gap-8 z-10 flex-1">
        {task ? (
          <>
            {/* Category Tag */}
            <span className="px-4 py-1 border border-vagabond-brown border-opacity-30 rounded-full text-xs font-serif uppercase tracking-widest text-vagabond-brown">
              {task.category}
            </span>

            {/* Task Name */}
            <h2 className="text-4xl sm:text-5xl font-bold font-serif tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-vagabond-parchment via-white to-vagabond-parchment animate-ink-grow">
              {task.name}
            </h2>

            {/* Large Countdown Clock */}
            <div className="text-6xl sm:text-8xl font-mono tracking-widest text-vagabond-gold font-bold text-shadow-gold select-none my-4">
              {timeLeft || '00:00:00'}
            </div>

            {/* Minimalist Progress Bar */}
            <div className="w-full max-w-xl flex flex-col gap-2">
              <div className="w-full bg-vagabond-slate bg-opacity-30 h-1 rounded-full overflow-hidden">
                <div 
                  className="bg-vagabond-gold h-full rounded-full transition-all duration-1000 ease-out shadow-gold-glow"
                  style={{ width: `${percentElapsed}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between text-xs text-vagabond-brown font-mono">
                <span>Started: {task.startTime}</span>
                <span>{percentElapsed}% Elapsed</span>
                <span>End: {task.endTime}</span>
              </div>
            </div>

            {/* Completion Button */}
            <div className="mt-8 flex flex-col items-center gap-3">
              {canComplete ? (
                <button
                  onClick={() => onComplete(task._id)}
                  className="flex items-center gap-3 px-8 py-4 border border-vagabond-gold bg-vagabond-gold text-black rounded font-serif uppercase tracking-widest font-bold hover:bg-opacity-90 hover:scale-105 transition-all duration-300 shadow-gold-glow"
                >
                  <Check size={20} />
                  <span>Reach Completion</span>
                </button>
              ) : (
                <div className="text-sm text-vagabond-brown italic font-serif flex flex-col items-center gap-2">
                  <span>The sword cannot be sheathed yet.</span>
                  <span className="text-xs uppercase tracking-wider text-opacity-70 font-mono">
                    Complete button activates in the final window (3% or 5 mins)
                  </span>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <h2 className="text-3xl font-serif text-vagabond-brown">Empty Mind</h2>
            <p className="text-sm italic font-serif text-opacity-80 max-w-md">
              "When you have no task before you, focus on your breathing. Remain still, clear your thoughts, and prepare your spirit."
            </p>
          </div>
        )}
      </div>

      {/* Bottom Segment: Zen Quote and Exit Button */}
      <div className="w-full flex flex-col items-center gap-8 z-10">
        {/* Zen Scroll Styled Quote Card */}
        <div className="w-full max-w-2xl px-8 py-6 rounded border border-vagabond-brown border-opacity-15 bg-opacity-20 bg-vagabond-charcoal shadow-zen relative overflow-hidden animate-scroll-unfurl">
          <div className="absolute top-0 bottom-0 left-0 w-1 bg-vagabond-brown"></div>
          <div className="absolute top-0 bottom-0 right-0 w-1 bg-vagabond-brown"></div>
          <p className="font-serif italic text-sm text-center text-vagabond-parchment leading-relaxed">
            "{task?.notes || defaultQuote.quote}"
          </p>
          <p className="text-right text-[10px] uppercase font-serif tracking-widest text-vagabond-gold mt-3">
            — {task ? 'Task Focus Note' : defaultQuote.author}
          </p>
        </div>

        {/* Exit Button */}
        <button
          onClick={onExit}
          className="flex items-center gap-2 text-xs uppercase tracking-widest text-vagabond-brown hover:text-vagabond-gold transition-all duration-200"
        >
          <X size={14} />
          <span>Exit Focus Chamber</span>
        </button>
      </div>
    </div>
  );
};

export default FocusMode;

import React, { useContext, useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import { 
  Flame, BookOpen, Calendar, BarChart2, Trophy, 
  FileText, Clock, LogOut, LayoutDashboard, Compass, EyeOff 
} from 'lucide-react';

const DigitalClock = () => {
  const [timeStr, setTimeStr] = useState('');

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
      setTimeStr(`${dateFormatter.format(now)} | ${timeFormatter.format(now)}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 border border-vagabond-slate rounded bg-vagabond-charcoal font-mono text-sm text-vagabond-gold">
      <Clock size={16} />
      <span>{timeStr}</span>
    </div>
  );
};

const Layout = ({ children, onEnterFocusMode }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  // Navigation items mapping
  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/timetables', label: 'Timetables', icon: Compass },
    { path: '/history', label: 'Timeline', icon: Clock },
    { path: '/diary', label: 'Daily Diary', icon: BookOpen },
    { path: '/stats', label: 'Calendar & Stats', icon: BarChart2 },
    { path: '/goals', label: 'Goals & Medals', icon: Trophy },
    { path: '/notes', label: 'Notes', icon: FileText },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Level computation logic
  const totalXp = user?.xp || 0;
  const level = Math.floor(totalXp / 1000) + 1;
  const xpInCurrentLevel = totalXp % 1000;
  const xpProgressPercent = Math.min(100, Math.round((xpInCurrentLevel / 1000) * 100));

  return (
    <div className="min-h-screen flex text-vagabond-parchment bg-vagabond-dark bg-opacity-95 font-sans relative">
      {/* Background Subtle Ink Wash Layer */}
      <div className="absolute inset-0 bg-rice-paper opacity-[0.03] pointer-events-none z-0"></div>

      {/* 1. Left Sidebar Navigation */}
      <aside className="w-64 bg-vagabond-charcoal border-r border-vagabond-slate flex flex-col justify-between py-6 z-10 select-none">
        <div>
          {/* Logo Heading */}
          <div className="px-6 mb-8">
            <h1 className="text-xl font-serif font-bold tracking-wider text-white uppercase">
              WAY TO SUCCESS
            </h1>
            <p className="text-[9px] uppercase tracking-widest text-neutral-400 font-mono mt-1">
              Personal Discipline Scheduler
            </p>
          </div>

          {/* User Progress Profile Card */}
          {user && (
            <div className="px-6 mb-8">
              <div className="p-4 border border-vagabond-slate rounded-lg bg-vagabond-dark relative group overflow-hidden">
                <div className="absolute -top-10 -right-10 w-24 h-24 bg-vagabond-gold bg-opacity-5 rounded-full group-hover:scale-150 transition-all duration-700"></div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs uppercase tracking-wider text-vagabond-brown">Discipline Level</span>
                  <span className="text-sm font-serif font-bold text-vagabond-gold">LVL {level}</span>
                </div>
                <div className="w-full bg-vagabond-slate h-1.5 rounded-full overflow-hidden mb-3">
                  <div 
                    className="bg-vagabond-gold h-full rounded-full transition-all duration-500 ease-out shadow-gold-glow"
                    style={{ width: `${xpProgressPercent}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-vagabond-brown font-mono">
                  <span>{xpInCurrentLevel}/1000 XP</span>
                  <span>Total: {totalXp} XP</span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1 px-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded text-sm transition-all duration-200 ${
                    isActive 
                      ? 'bg-vagabond-gold bg-opacity-10 text-vagabond-gold border-l-2 border-vagabond-gold font-medium' 
                      : 'text-vagabond-parchment text-opacity-70 hover:text-opacity-100 hover:bg-vagabond-slate'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-vagabond-gold' : 'text-opacity-75'} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Controls */}
        <div className="px-4 flex flex-col gap-2">
          {user && (
            <div className="flex items-center justify-between px-4 py-2 rounded bg-vagabond-dark border border-vagabond-slate text-xs text-vagabond-parchment text-opacity-80">
              <span className="flex items-center gap-1.5">
                <Flame size={14} className="text-vagabond-red animate-pulse" />
                Streak:
              </span>
              <span className="font-bold text-vagabond-gold font-mono">{user.currentStreak} Days</span>
            </div>
          )}
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 rounded text-sm text-vagabond-red hover:bg-vagabond-red hover:bg-opacity-10 transition-all duration-200 mt-2"
          >
            <LogOut size={18} />
            <span>Leave Path</span>
          </button>
        </div>
      </aside>

      {/* 2. Main Page Shell */}
      <div className="flex-1 flex flex-col min-h-screen overflow-y-auto relative z-10">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-vagabond-slate bg-vagabond-dark bg-opacity-60 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-serif tracking-wide capitalize">
              {location.pathname === '/' ? 'Today\'s Path' : location.pathname.substring(1).replace('-', ' ')}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            {/* Live Clock Component */}
            <DigitalClock />

            {/* Focus Mode Activation Switch */}
            <button
              onClick={onEnterFocusMode}
              className="flex items-center gap-2 px-3 py-1.5 border border-vagabond-gold rounded hover:bg-vagabond-gold hover:text-black transition-all duration-300 text-sm text-vagabond-gold"
            >
              <EyeOff size={16} />
              <span>Focus Mode</span>
            </button>
          </div>
        </header>

        {/* Content Section viewport */}
        <main className="flex-1 p-8 overflow-x-hidden animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;

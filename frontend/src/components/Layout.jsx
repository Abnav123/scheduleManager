import React, { useContext, useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContextValue.jsx';
import { 
  Flame, BookOpen, BarChart2, Trophy, 
  FileText, Clock, LogOut, LayoutDashboard, Compass, EyeOff, Menu, X, ShieldAlert
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
    <div className="flex items-center gap-2 px-3 py-1.5 border-2 border-white bg-[#0e1017] font-mono text-xs sm:text-sm text-white">
      <Clock size={14} />
      <span>{timeStr}</span>
    </div>
  );
};

const Layout = ({ children, onEnterFocusMode }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Navigation items mapping
  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/timetables', label: 'Timetables', icon: Compass },
    { path: '/history', label: 'Timeline', icon: Clock },
    { path: '/punishments', label: 'Punishments', icon: ShieldAlert },
    { path: '/diary', label: 'Daily Diary', icon: BookOpen },
    { path: '/stats', label: 'Calendar & Stats', icon: BarChart2 },
    { path: '/goals', label: 'Goals & Medals', icon: Trophy },
    { path: '/notes', label: 'Notes', icon: FileText },
  ];


  const handleLogout = async () => {
    setSidebarOpen(false);
    await logout();
    navigate('/login');
  };

  // Level computation logic
  const currentXp = user?.xp || 0;
  const spentXp = user?.xpSpent || 0;
  const lifetimeXp = currentXp + spentXp;
  const level = Math.floor(lifetimeXp / 1000) + 1;
  const xpInCurrentLevel = lifetimeXp % 1000;
  const xpProgressPercent = Math.min(100, Math.round((xpInCurrentLevel / 1000) * 100));

  return (
    <div className="min-h-screen flex text-white bg-[#030408] font-sans relative">
      {/* Mobile Drawer Overlay Backdrop */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)} 
          className="fixed inset-0 bg-black/75 z-30 lg:hidden"
        ></div>
      )}

      {/* 1. Left Sidebar Navigation (Responsive Sliding Drawer) */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-[#0e1017] border-r-2 border-white flex flex-col justify-between py-6 z-40 select-none transition-transform duration-300 lg:static lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div>
          {/* Logo Heading */}
          <div className="px-6 mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-wider text-white uppercase font-mono">
                MISSION CONTROL
              </h1>
              <p className="text-[9px] uppercase tracking-widest text-neutral-400 font-mono mt-1">
                Personal Discipline Scheduler
              </p>
            </div>
            {/* Close Button (Visible on mobile/tablet only) */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 border-2 border-white bg-[#0e1017] text-white hover:bg-neutral-900 rounded-none"
            >
              <X size={16} />
            </button>
          </div>

          {/* User Progress Profile Card */}
          {user && (
            <div className="px-6 mb-8">
              <div className="p-4 border-2 border-white bg-[#0e1017] relative group overflow-hidden brutalist-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs uppercase tracking-wider text-neutral-400 font-bold font-mono">Discipline Level</span>
                  <span className="text-sm font-bold text-white font-mono">LVL {level}</span>
                </div>
                <div className="w-full bg-neutral-800 border border-white h-3 overflow-hidden mb-3">
                  <div 
                    className="bg-[#0000ff] h-full transition-all duration-500 ease-out"
                    style={{ width: `${xpProgressPercent}%` }}
                  ></div>
                </div>
                <div className="flex flex-col gap-1 text-[11px] text-neutral-400 font-mono font-bold">
                  <div className="flex items-center justify-between">
                    <span>{xpInCurrentLevel}/1000 XP</span>
                    <span>Total: {lifetimeXp} XP</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-neutral-800 pt-1.5 mt-1">
                    <span>Available XP:</span>
                    <span className="text-[#ffff00]">{currentXp} XP</span>
                  </div>
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
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-200 rounded-none ${
                    isActive 
                      ? 'bg-white text-black font-bold border-l-4 border-white' 
                      : 'text-white hover:bg-neutral-900'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-black' : 'text-neutral-400'} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Controls */}
        <div className="px-4 flex flex-col gap-2">
          {user && (
            <div className="flex items-center justify-between px-4 py-2 border-2 border-white bg-[#ffff00] text-black font-bold shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
              <span className="flex items-center gap-1.5">
                <Flame size={14} className="text-black" />
                Streak:
              </span>
              <span className="font-bold text-black font-mono">{user.currentStreak} Days</span>
            </div>
          )}
          
          <button
            onClick={handleLogout}
            className="btn-red w-full flex items-center justify-center gap-3 mt-2"
          >
            <LogOut size={18} />
            <span>Leave Path</span>
          </button>
        </div>
      </aside>

      {/* 2. Main Page Shell */}
      <div className="flex-1 flex flex-col min-h-screen overflow-y-auto relative z-10">
        {/* Top Header Bar (Responsive Padding and Stacking) */}
        <header className="min-h-16 border-b-2 border-white bg-[#0e1017] px-4 sm:px-8 py-3 flex flex-col sm:flex-row items-center justify-between sticky top-0 z-20 gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Hamburger Button (Visible on mobile/tablet only) */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 border-2 border-white bg-[#0e1017] text-white hover:bg-neutral-900 rounded-none"
              title="Open Navigation"
            >
              <Menu size={20} />
            </button>
            <h2 className="text-lg font-bold tracking-wide capitalize font-mono truncate">
              {location.pathname === '/' ? 'Active Task List' : location.pathname.substring(1).replace('-', ' ')}
            </h2>
          </div>
          <div className="flex flex-row items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
            {/* Live Clock Component */}
            <DigitalClock />

            {/* Focus Mode Activation Switch */}
            <button
              onClick={onEnterFocusMode}
              className="btn-blue flex items-center gap-2 text-xs py-2 px-3"
            >
              <EyeOff size={14} />
              <span>Emergency Tasks</span>
            </button>
          </div>
        </header>

        {/* Content Section viewport */}
        <main className="flex-1 p-4 sm:p-8 bg-[#030408] overflow-x-hidden animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;

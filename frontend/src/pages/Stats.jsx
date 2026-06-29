import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../utils/api.js';
import { Calendar as CalendarIcon, BarChart2, RefreshCw } from 'lucide-react';
import moment from 'moment';

const Stats = () => {
  const [activeTab, setActiveTab] = useState('calendar'); // 'calendar' or 'insights'
  const [currentDate, setCurrentDate] = useState(moment());
  const [calendarData, setCalendarData] = useState({});
  const [heatmapData, setHeatmapData] = useState({});
  const [statsSummary, setStatsSummary] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 1. Fetch statistics
  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch summary stats
      const summaryRes = await api.get('/stats/dashboard?full=true');
      setStatsSummary(summaryRes.data.stats);

      // Fetch calendar data for selected month/year
      const year = currentDate.format('YYYY');
      const month = currentDate.format('MM');
      const calendarRes = await api.get(`/stats/calendar?year=${year}&month=${month}`);
      setCalendarData(calendarRes.data);

      // Fetch heatmap
      const heatmapRes = await api.get('/stats/heatmap');
      setHeatmapData(heatmapRes.data);

      // Fetch weekly reports
      const reportRes = await api.get('/stats/report?type=weekly');
      setReport(reportRes.data);

    } catch (err) {
      console.error(err);
      setError('Could not download statistical records.');
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Calendar navigations
  const handlePrevMonth = () => {
    setCurrentDate(currentDate.clone().subtract(1, 'month'));
  };

  const handleNextMonth = () => {
    setCurrentDate(currentDate.clone().add(1, 'month'));
  };

  // Render Calendar Grid
  const calendarGrid = useMemo(() => {
    const start = currentDate.clone().startOf('month');
    const daysInMonth = currentDate.daysInMonth();
    
    // Find weekday offset of first day of month (0 = Sun, 6 = Sat)
    const offset = start.day();
    const grid = [];

    // Empty spaces for offset
    for (let i = 0; i < offset; i++) {
      grid.push(null);
    }

    // Days in the month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = currentDate.clone().date(d).format('YYYY-MM-DD');
      grid.push({
        dayNum: d,
        dateStr,
        status: calendarData[dateStr] || 'None',
      });
    }

    return grid;
  }, [currentDate, calendarData]);

  // Color mapping definitions
  const calendarColors = {
    Green: 'bg-[#008000] border-2 border-white text-white hover:scale-105 shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]',
    Red: 'bg-[#ff0000] border-2 border-white text-white hover:scale-105 shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]',
    Grey: 'bg-[#0000ff] border-2 border-white text-white hover:scale-105 shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]',
    None: 'bg-[#0e1017] border-2 border-white text-white hover:border-blue-500',
  };

  // Heatmap rendering helpers (last 365 days grouped by weeks)
  const heatmapGrid = useMemo(() => {
    const end = moment().endOf('week');
    const start = moment().subtract(1, 'year').startOf('week');
    const weeks = [];
    let current = start.clone();

    while (current.isBefore(end)) {
      const week = [];
      for (let d = 0; d < 7; d++) {
        const dateStr = current.format('YYYY-MM-DD');
        const count = heatmapData[dateStr] || 0;
        week.push({ dateStr, count });
        current.add(1, 'day');
      }
      weeks.push(week);
    }

    return weeks;
  }, [heatmapData]);

  const getHeatmapColor = (count) => {
    if (count === 0) return 'bg-[#030408] border-neutral-700';
    if (count <= 2) return 'bg-[#ffff00] bg-opacity-30 border-white';
    if (count <= 4) return 'bg-[#ffff00] bg-opacity-60 border-white';
    return 'bg-[#ffff00] border-white';
  };

  if (loading && !statsSummary) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-white bg-[#030408] font-mono">
        <RefreshCw className="animate-spin" size={32} />
        <span className="font-mono text-sm font-bold">Scanning logs...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-500 font-mono font-bold">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto text-white">
      {/* Description Segment */}
      <section className="flex flex-col sm:flex-row items-center justify-between border-b-2 border-white pb-4 gap-4">
        <div>
          <p className="text-xs text-neutral-400 tracking-wider uppercase font-mono font-bold">Discipline Metrics</p>
          <h2 className="text-2xl font-bold font-mono">Mission Stats</h2>
        </div>
      </section>

      {/* Tabs Menu */}
      <div className="flex border-b-2 border-white text-sm mb-4 font-bold">
        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex items-center gap-2 px-6 py-2.5 border-b-4 transition-all ${
            activeTab === 'calendar' 
              ? 'border-white text-white font-bold font-mono' 
              : 'border-transparent text-neutral-400 hover:text-white font-mono'
          }`}
        >
          <CalendarIcon size={16} />
          <span>Monthly Calendar</span>
        </button>
        <button
          onClick={() => setActiveTab('insights')}
          className={`flex items-center gap-2 px-6 py-2.5 border-b-4 transition-all ${
            activeTab === 'insights' 
              ? 'border-white text-white font-bold font-mono' 
              : 'border-transparent text-neutral-400 hover:text-white font-mono'
          }`}
        >
          <BarChart2 size={16} />
          <span>Productivity Heatmap</span>
        </button>
      </div>

      {/* TAB 1: CALENDAR VIEW */}
      {activeTab === 'calendar' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
          {/* Calendar Grid Container */}
          <div className="lg:col-span-2 p-6 border-2 border-white bg-[#0e1017] brutalist-card font-mono">
            {/* Header controls */}
            <div className="flex items-center justify-between mb-6">
              <button 
                onClick={handlePrevMonth} 
                className="px-3 py-1 border-2 border-white hover:bg-neutral-900 text-white text-xs font-bold font-mono transition-all rounded-none bg-[#0e1017] shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]"
              >
                &lt; Previous
              </button>
              <h3 className="text-lg font-bold uppercase tracking-widest text-white font-mono">
                {currentDate.format('MMMM YYYY')}
              </h3>
              <button 
                onClick={handleNextMonth} 
                className="px-3 py-1 border-2 border-white hover:bg-neutral-900 text-white text-xs font-bold font-mono transition-all rounded-none bg-[#0e1017] shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]"
              >
                Next &gt;
              </button>
            </div>

            {/* Weekdays Labels */}
            <div className="grid grid-cols-7 text-center text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3 font-mono">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} className="py-1">{d}</div>
              ))}
            </div>

            {/* Days boxes Grid */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {calendarGrid.map((day, idx) => {
                if (!day) return <div key={idx} className="aspect-square bg-transparent"></div>;
                const isToday = day.dateStr === moment().format('YYYY-MM-DD');
                return (
                  <div
                    key={day.dateStr}
                    title={`${day.dateStr}: Status = ${day.status}`}
                    className={`aspect-square rounded-none flex flex-col items-center justify-center text-[10px] sm:text-xs font-bold transition-all ${
                      calendarColors[day.status]
                    } ${isToday ? 'ring-2 sm:ring-4 ring-white font-bold scale-[1.01]' : ''}`}
                  >
                    <span>{day.dayNum}</span>
                    {isToday && <span className="hidden sm:inline-block text-[7px] uppercase font-mono bg-white text-black px-1 mt-0.5">Today</span>}
                  </div>
                );
              })}
            </div>

            {/* Color keys legend */}
            <div className="mt-8 pt-4 border-t-2 border-white flex flex-wrap gap-4 justify-center text-[10px] uppercase font-mono tracking-widest font-bold text-neutral-400">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-[#008000] border border-white"></span>Completed</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-[#ff0000] border border-white"></span>Missed</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-[#0000ff] border border-white"></span>Unavoidable</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-[#0e1017] border border-white"></span>Neutral/Rest</span>
            </div>
          </div>

          {/* Quick Metrics sidebar panel */}
          {statsSummary && (
            <div className="p-6 border-2 border-white bg-[#0e1017] brutalist-card flex flex-col gap-6 font-mono text-white">
              <h3 className="text-sm uppercase tracking-wider text-white font-bold border-b-2 border-white pb-2">Way Summary</h3>
              
              <div className="flex flex-col gap-4 text-xs font-mono font-bold text-white">
                <div className="flex justify-between border-b border-neutral-750 pb-2">
                  <span>Productivity Score</span>
                  <span className="text-green-400">{statsSummary.productivityScore}%</span>
                </div>
                <div className="flex justify-between border-b border-neutral-750 pb-2">
                  <span>Discipline Score</span>
                  <span className="text-blue-400">{statsSummary.disciplineScore}%</span>
                </div>
                <div className="flex justify-between border-b border-neutral-750 pb-2">
                  <span>Total Completed</span>
                  <span>{statsSummary.completed} tasks</span>
                </div>
                <div className="flex justify-between border-b border-neutral-750 pb-2">
                  <span>Unavoidable Skips</span>
                  <span>{statsSummary.unavoidable} days</span>
                </div>
                <div className="flex justify-between border-b border-neutral-750 pb-2">
                  <span>Active Streak</span>
                  <span className="bg-[#ffff00] text-black border border-white px-1.5 py-0.5">{statsSummary.currentStreak} Days</span>
                </div>
                <div className="flex justify-between">
                  <span>Longest Streak</span>
                  <span className="bg-[#ffff00] text-black border border-white px-1.5 py-0.5">{statsSummary.longestStreak} Days</span>
                </div>
              </div>

              {/* Quotes block */}
              <div className="mt-2 p-4 border-2 border-white bg-[#030408] text-[11px] font-mono italic text-neutral-400 leading-relaxed font-bold shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
                "In all things, do not depend on others. Everything exists within yourself."
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: HEATMAP & REPORTS VIEW */}
      {activeTab === 'insights' && (
        <div className="flex flex-col gap-8 animate-fade-in font-mono">
          
          {/* GitHub style heatmap */}
          <section className="p-6 border-2 border-white bg-[#0e1017] brutalist-card text-white">
            <h3 className="text-sm uppercase tracking-wider text-white font-bold mb-4 font-mono">Focus Activity (365 Days)</h3>
            
            {/* Heatmap scroll wrapper */}
            <div className="overflow-x-auto pb-4">
              <div className="flex gap-[3px] min-w-[700px] select-none">
                {heatmapGrid.map((week, wIdx) => (
                  <div key={wIdx} className="flex flex-col gap-[3px]">
                    {week.map((day) => (
                      <div
                        key={day.dateStr}
                        title={`${day.dateStr}: ${day.count} tasks completed`}
                        className={`w-3.5 h-3.5 border transition-all duration-100 ${
                          getHeatmapColor(day.count)
                        } hover:scale-125 hover:z-10`}
                      ></div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Legend */}
            <div className="flex items-center gap-1.5 justify-end text-[10px] font-mono text-neutral-400 mt-2 font-bold">
              <span>Less</span>
              <span className="w-3 h-3 bg-[#030408] border border-neutral-700"></span>
              <span className="w-3 h-3 bg-[#ffff00] bg-opacity-30 border border-white"></span>
              <span className="w-3 h-3 bg-[#ffff00] bg-opacity-60 border border-white"></span>
              <span className="w-3 h-3 bg-[#ffff00] border border-white"></span>
              <span>More</span>
            </div>
          </section>

          {/* Category Distributions & Productivity Reports */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Category Hours horizontal bars */}
            <section className="p-6 border-2 border-white bg-[#0e1017] brutalist-card text-white">
              <h3 className="text-sm uppercase tracking-wider text-white font-bold border-b-2 border-white pb-2 mb-4 font-mono">Concentration by Category</h3>
              
              {statsSummary && Object.keys(statsSummary.categoryHours).length > 0 ? (
                <div className="flex flex-col gap-4 font-mono">
                  {Object.entries(statsSummary.categoryHours).map(([cat, hrs]) => {
                    const maxHours = Math.max(...Object.values(statsSummary.categoryHours), 1);
                    const widthPercent = Math.min(100, Math.round((hrs / maxHours) * 100));
                    return (
                      <div key={cat} className="flex flex-col gap-1.5 text-xs">
                        <div className="flex items-center justify-between font-mono font-bold text-white">
                          <span>{cat}</span>
                          <span>{hrs} hrs</span>
                        </div>
                        <div className="w-full bg-neutral-800 border border-white h-3 overflow-hidden">
                          <div 
                            className="bg-[#0000ff] h-full transition-all duration-500 ease-out" 
                            style={{ width: `${widthPercent}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-neutral-500 italic font-mono text-center py-8">No task completion data recorded.</p>
              )}
            </section>

            {/* Weekly Report insights */}
            {report && (
              <section className="p-6 border-2 border-white bg-[#0e1017] brutalist-card flex flex-col justify-between text-white">
                <div>
                  <h3 className="text-sm uppercase tracking-wider text-white font-bold border-b-2 border-white pb-2 mb-4 font-mono">Productivity Intelligence</h3>
                  <div className="grid grid-cols-2 gap-4 mb-4 font-mono">
                    <div className="p-3 border-2 border-white bg-[#0e1017] text-center shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
                      <span className="text-[10px] uppercase font-mono text-neutral-400 block mb-1 font-bold">This Week Index</span>
                      <span className="text-xl font-bold text-green-400">{report.current.completionRate}%</span>
                    </div>
                    <div className="p-3 border-2 border-white bg-[#0e1017] text-center shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
                      <span className="text-[10px] uppercase font-mono text-neutral-400 block mb-1 font-bold">Previous Week</span>
                      <span className="text-xl font-bold text-neutral-450">{report.previous.completionRate}%</span>
                    </div>
                  </div>
                  <p className="text-xs text-white font-mono leading-relaxed italic border-l-4 border-white pl-3 mt-4 font-bold">
                    "{report.insights}"
                  </p>
                </div>

                <div className="mt-6 text-[10px] text-neutral-500 font-mono border-t border-neutral-700 pt-3 uppercase tracking-wider text-right font-bold">
                  System analysis based on focus timings
                </div>
              </section>
            )}
          </div>

        </div>
      )}
    </div>
  );
};

export default Stats;

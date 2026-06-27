import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../utils/api.js';
import { Calendar as CalendarIcon, BarChart2, Flame, Award, RefreshCw } from 'lucide-react';
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
      const summaryRes = await api.get('/stats/dashboard');
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
    const end = currentDate.clone().endOf('month');
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
    Green: 'bg-vagabond-green border-vagabond-green text-white hover:scale-105 shadow-zen',
    Red: 'bg-vagabond-red border-vagabond-red text-white hover:scale-105 shadow-zen',
    Grey: 'bg-gray-800 border-gray-700 text-gray-400 hover:scale-105',
    None: 'bg-vagabond-charcoal border-vagabond-slate text-vagabond-parchment text-opacity-40 hover:border-vagabond-gold',
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
    if (count === 0) return 'bg-[#151515] border-[#222]';
    if (count <= 2) return 'bg-opacity-40 bg-vagabond-gold border-vagabond-gold border-opacity-30';
    if (count <= 4) return 'bg-opacity-70 bg-vagabond-gold border-vagabond-gold border-opacity-60';
    return 'bg-vagabond-gold border-vagabond-gold shadow-gold-glow';
  };

  if (loading && !statsSummary) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-vagabond-gold">
        <RefreshCw className="animate-spin" size={32} />
        <span className="font-serif italic text-sm">Translating numbers into insights...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-vagabond-red font-serif">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      {/* Description Segment */}
      <section className="flex flex-col sm:flex-row items-center justify-between border-b border-vagabond-slate pb-4 gap-4">
        <div>
          <p className="text-xs text-vagabond-brown uppercase tracking-wider font-mono">Discipline Metrics</p>
          <h2 className="text-2xl font-serif font-bold text-vagabond-gold">Productivity Scroll & Heatmap</h2>
        </div>
      </section>

      {/* Tabs Menu */}
      <div className="flex border-b border-vagabond-slate text-sm mb-4">
        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex items-center gap-2 px-6 py-2.5 font-serif font-medium border-b-2 transition-colors ${
            activeTab === 'calendar' 
              ? 'border-vagabond-gold text-vagabond-gold' 
              : 'border-transparent text-vagabond-parchment text-opacity-60 hover:text-opacity-100'
          }`}
        >
          <CalendarIcon size={16} />
          <span>Monthly Calendar</span>
        </button>
        <button
          onClick={() => setActiveTab('insights')}
          className={`flex items-center gap-2 px-6 py-2.5 font-serif font-medium border-b-2 transition-colors ${
            activeTab === 'insights' 
              ? 'border-vagabond-gold text-vagabond-gold' 
              : 'border-transparent text-vagabond-parchment text-opacity-60 hover:text-opacity-100'
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
          <div className="lg:col-span-2 p-6 border border-vagabond-slate rounded-lg bg-vagabond-charcoal shadow-zen">
            {/* Header controls */}
            <div className="flex items-center justify-between mb-6">
              <button onClick={handlePrevMonth} className="px-3 py-1 border border-vagabond-slate rounded text-xs hover:text-vagabond-gold transition-colors font-serif">
                &lt; Previous
              </button>
              <h3 className="font-serif text-lg text-vagabond-parchment font-bold uppercase tracking-widest">
                {currentDate.format('MMMM YYYY')}
              </h3>
              <button onClick={handleNextMonth} className="px-3 py-1 border border-vagabond-slate rounded text-xs hover:text-vagabond-gold transition-colors font-serif">
                Next &gt;
              </button>
            </div>

            {/* Weekdays Labels */}
            <div className="grid grid-cols-7 text-center text-xs font-serif text-vagabond-brown uppercase tracking-widest mb-3">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} className="py-1">{d}</div>
              ))}
            </div>

            {/* Days boxes Grid */}
            <div className="grid grid-cols-7 gap-2">
              {calendarGrid.map((day, idx) => {
                if (!day) return <div key={idx} className="aspect-square bg-transparent"></div>;
                const isToday = day.dateStr === moment().format('YYYY-MM-DD');
                return (
                  <div
                    key={day.dateStr}
                    title={`${day.dateStr}: Status = ${day.status}`}
                    className={`aspect-square rounded border flex flex-col items-center justify-center text-xs transition-all duration-300 ${
                      calendarColors[day.status]
                    } ${isToday ? 'ring-2 ring-vagabond-gold font-bold scale-102' : ''}`}
                  >
                    <span>{day.dayNum}</span>
                    {isToday && <span className="text-[7px] uppercase font-mono text-vagabond-gold">Today</span>}
                  </div>
                );
              })}
            </div>

            {/* Color keys legend */}
            <div className="mt-8 pt-4 border-t border-vagabond-slate flex flex-wrap gap-4 justify-center text-[10px] uppercase font-serif tracking-widest text-vagabond-brown">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-vagabond-green rounded"></span>Completed</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-vagabond-red rounded"></span>Missed Tasks</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-gray-800 rounded"></span>Unavoidable</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-transparent border border-vagabond-slate rounded"></span>Neutral/Rest</span>
            </div>
          </div>

          {/* Quick Metrics sidebar panel */}
          {statsSummary && (
            <div className="p-6 border border-vagabond-slate rounded-lg bg-vagabond-charcoal flex flex-col gap-6">
              <h3 className="font-serif text-sm uppercase tracking-wider text-vagabond-gold border-b border-vagabond-slate pb-2">Way Summary</h3>
              
              <div className="flex flex-col gap-4 text-xs font-serif text-vagabond-parchment text-opacity-80">
                <div className="flex justify-between border-b border-vagabond-slate border-opacity-35 pb-2">
                  <span>Productivity Score</span>
                  <span className="font-mono text-vagabond-green font-bold">{statsSummary.productivityScore}%</span>
                </div>
                <div className="flex justify-between border-b border-vagabond-slate border-opacity-35 pb-2">
                  <span>Discipline Score</span>
                  <span className="font-mono text-vagabond-gold font-bold">{statsSummary.disciplineScore}%</span>
                </div>
                <div className="flex justify-between border-b border-vagabond-slate border-opacity-35 pb-2">
                  <span>Total Completed</span>
                  <span className="font-mono">{statsSummary.completed} tasks</span>
                </div>
                <div className="flex justify-between border-b border-vagabond-slate border-opacity-35 pb-2">
                  <span>Unavoidable Skips</span>
                  <span className="font-mono">{statsSummary.unavoidable} days</span>
                </div>
                <div className="flex justify-between border-b border-vagabond-slate border-opacity-35 pb-2">
                  <span>Active Streak</span>
                  <span className="font-mono text-vagabond-gold font-bold">{statsSummary.currentStreak} Days</span>
                </div>
                <div className="flex justify-between">
                  <span>Longest Streak</span>
                  <span className="font-mono text-vagabond-gold font-bold">{statsSummary.longestStreak} Days</span>
                </div>
              </div>

              {/* Quotes scrolling */}
              <div className="mt-2 p-4 rounded bg-vagabond-dark border border-vagabond-slate border-opacity-50 text-[11px] font-serif italic text-vagabond-brown leading-relaxed">
                "In all things, do not depend on others. Everything exists within yourself."
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: HEATMAP & REPORTS VIEW */}
      {activeTab === 'insights' && (
        <div className="flex flex-col gap-8 animate-fade-in">
          
          {/* GitHub style heatmap */}
          <section className="p-6 border border-vagabond-slate rounded-lg bg-vagabond-charcoal shadow-zen">
            <h3 className="font-serif text-sm uppercase tracking-wider text-vagabond-gold mb-4">Focus Activity (365 Days)</h3>
            
            {/* Heatmap scroll wrapper */}
            <div className="overflow-x-auto pb-4">
              <div className="flex gap-[3px] min-w-[700px] select-none">
                {heatmapGrid.map((week, wIdx) => (
                  <div key={wIdx} className="flex flex-col gap-[3px]">
                    {week.map((day) => (
                      <div
                        key={day.dateStr}
                        title={`${day.dateStr}: ${day.count} tasks completed`}
                        className={`w-3.5 h-3.5 rounded-sm border transition-all duration-300 ${
                          getHeatmapColor(day.count)
                        } hover:scale-125 hover:z-10`}
                      ></div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Legend */}
            <div className="flex items-center gap-1.5 justify-end text-[10px] font-mono text-vagabond-brown mt-2">
              <span>Less</span>
              <span className="w-3 h-3 bg-[#151515] border border-[#222] rounded-sm"></span>
              <span className="w-3 h-3 bg-vagabond-gold bg-opacity-40 border border-vagabond-gold border-opacity-30 rounded-sm"></span>
              <span className="w-3 h-3 bg-vagabond-gold bg-opacity-70 border border-vagabond-gold border-opacity-60 rounded-sm"></span>
              <span className="w-3 h-3 bg-vagabond-gold border border-vagabond-gold rounded-sm"></span>
              <span>More</span>
            </div>
          </section>

          {/* Category Distributions & Productivity Reports */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Category Hours horizontal bars (Minimalist custom layout) */}
            <section className="p-6 border border-vagabond-slate rounded-lg bg-vagabond-charcoal">
              <h3 className="font-serif text-sm uppercase tracking-wider text-vagabond-gold border-b border-vagabond-slate pb-2 mb-4">Concentration by Category</h3>
              
              {statsSummary && Object.keys(statsSummary.categoryHours).length > 0 ? (
                <div className="flex flex-col gap-4">
                  {Object.entries(statsSummary.categoryHours).map(([cat, hrs]) => {
                    // Normalize width against max hours
                    const maxHours = Math.max(...Object.values(statsSummary.categoryHours), 1);
                    const widthPercent = Math.min(100, Math.round((hrs / maxHours) * 100));
                    return (
                      <div key={cat} className="flex flex-col gap-1.5 text-xs">
                        <div className="flex items-center justify-between font-serif text-vagabond-parchment">
                          <span>{cat}</span>
                          <span className="font-mono text-vagabond-gold">{hrs} hrs</span>
                        </div>
                        <div className="w-full bg-vagabond-slate h-2 rounded overflow-hidden">
                          <div 
                            className="bg-vagabond-gold h-full rounded transition-all duration-1000 ease-out" 
                            style={{ width: `${widthPercent}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-vagabond-brown italic font-serif text-center py-8">No task completion data recorded.</p>
              )}
            </section>

            {/* Weekly Report insights */}
            {report && (
              <section className="p-6 border border-vagabond-slate rounded-lg bg-vagabond-charcoal flex flex-col justify-between">
                <div>
                  <h3 className="font-serif text-sm uppercase tracking-wider text-vagabond-gold border-b border-vagabond-slate pb-2 mb-4">Productivity Intelligence</h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-3 border border-vagabond-slate rounded bg-vagabond-dark text-center">
                      <span className="text-[10px] uppercase font-mono text-vagabond-brown block mb-1">This Week Index</span>
                      <span className="text-xl font-serif font-bold text-vagabond-green">{report.current.completionRate}%</span>
                    </div>
                    <div className="p-3 border border-vagabond-slate rounded bg-vagabond-dark text-center">
                      <span className="text-[10px] uppercase font-mono text-vagabond-brown block mb-1">Previous Week</span>
                      <span className="text-xl font-serif font-bold text-vagabond-brown">{report.previous.completionRate}%</span>
                    </div>
                  </div>
                  <p className="text-xs text-vagabond-parchment text-opacity-80 font-serif leading-relaxed italic border-l-2 border-vagabond-gold pl-3 mt-4">
                    "{report.insights}"
                  </p>
                </div>

                <div className="mt-6 text-[10px] text-vagabond-brown font-mono border-t border-vagabond-slate pt-3 uppercase tracking-wider text-right">
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

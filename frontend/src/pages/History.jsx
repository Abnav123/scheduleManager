import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api.js';
import { 
  BookOpen, MessageSquare, Award
} from 'lucide-react';
import { getTodayIST } from '../utils/dateHelper.js';
import moment from 'moment';

const BlueprintCalendar = ({ selectedDate, onSelectDate }) => {
  const [currentMonth, setCurrentMonth] = useState(() => moment().startOf('month'));
  const today = moment().startOf('day');

  const prevMonth = () => {
    setCurrentMonth(currentMonth.clone().subtract(1, 'month'));
  };

  const nextMonth = () => {
    setCurrentMonth(currentMonth.clone().add(1, 'month'));
  };

  // Generate calendar days
  const startDay = currentMonth.clone().startOf('month').startOf('week');
  const endDay = currentMonth.clone().endOf('month').endOf('week');

  const days = [];
  let day = startDay.clone();
  while (day.isBefore(endDay, 'day')) {
    days.push(day.clone());
    day.add(1, 'day');
  }

  return (
    <div className="p-4 border-2 border-white bg-[#0e1017] max-w-sm w-full select-none brutalist-card font-mono text-white">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={prevMonth}
          className="p-1 hover:bg-neutral-900 border border-white rounded-none text-white text-xs font-bold font-mono"
        >
          &larr;
        </button>
        <span className="text-xs font-bold uppercase tracking-wider text-white font-mono">
          {currentMonth.format('MMMM YYYY')}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className="p-1 hover:bg-neutral-900 border border-white rounded-none text-white text-xs font-bold font-mono"
        >
          &rarr;
        </button>
      </div>

      {/* Weekdays */}
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase font-mono text-neutral-400 mb-1.5 font-bold">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
          <div key={d}>{d}</div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map(d => {
          const dateStr = d.format('YYYY-MM-DD');
          const isCurrentMonth = d.month() === currentMonth.month();
          const isSelected = selectedDate === dateStr;
          const isToday = d.isSame(today, 'day');

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => onSelectDate(dateStr)}
              className={`h-8 rounded-none text-[10px] flex flex-col items-center justify-center relative font-mono transition-all duration-100 ${
                !isCurrentMonth ? 'text-neutral-500 opacity-40' : ''
              } ${
                isSelected 
                  ? 'bg-white text-black font-bold border border-white' 
                  : isToday
                    ? 'border-2 border-yellow-400 bg-yellow-400 bg-opacity-10 text-white font-bold'
                    : 'hover:bg-neutral-900 text-white border border-neutral-800'
              }`}
            >
              <span>{d.date()}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex items-center justify-between text-[8px] text-neutral-400 font-mono border-t-2 border-white pt-2 font-bold">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 border border-yellow-400 bg-yellow-400 bg-opacity-10"></span> Today
        </span>
        <span>Selected: {moment(selectedDate).format('DD MMM YYYY')}</span>
      </div>
    </div>
  );
};

const History = () => {
  const [viewMode, setViewMode] = useState('timeline'); // 'timeline' or 'blueprint'
  const date = getTodayIST();
  const [timeline, setTimeline] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Blueprint states
  const [timetables, setTimetables] = useState([]);
  const [selectedTimetableId, setSelectedTimetableId] = useState('');
  const [selectedTimetable, setSelectedTimetable] = useState(null);
  const [blueprintDate, setBlueprintDate] = useState(getTodayIST());

  // Fetch timetables list for blueprint view when viewMode is 'blueprint'
  useEffect(() => {
    if (viewMode === 'blueprint') {
      const fetchTimetables = async () => {
        try {
          const res = await api.get('/timetables');
          setTimetables(res.data);
          
          // Find timetable active for today
          const today = moment().startOf('day');
          const activeForToday = res.data.find(t => {
            const start = moment(t.startDate).startOf('day');
            const end = moment(t.endDate).endOf('day');
            return today.isSameOrAfter(start) && today.isSameOrBefore(end);
          });

          const defaultSelect = activeForToday || res.data[0] || null;
          if (defaultSelect) {
            setSelectedTimetableId(defaultSelect._id);
            setSelectedTimetable(defaultSelect);
          } else {
            setSelectedTimetableId('');
            setSelectedTimetable(null);
          }
        } catch (err) {
          console.error('Failed to fetch timetables', err);
        }
      };
      fetchTimetables();
    }
  }, [viewMode]);

  const handleSelectBlueprintDate = (dateStr) => {
    setBlueprintDate(dateStr);
    
    // Find active timetable for this specific calendar date
    const target = moment(dateStr, 'YYYY-MM-DD');
    const activeForDate = timetables.find(t => {
      const start = moment(t.startDate).startOf('day');
      const end = moment(t.endDate).endOf('day');
      return target.isSameOrAfter(start) && target.isSameOrBefore(end);
    });

    if (activeForDate) {
      setSelectedTimetableId(activeForDate._id);
      setSelectedTimetable(activeForDate);
    } else {
      setSelectedTimetableId('');
      setSelectedTimetable(null);
    }
  };

  // Update selected timetable object when ID changes
  useEffect(() => {
    if (selectedTimetableId) {
      const found = timetables.find(t => t._id === selectedTimetableId);
      setSelectedTimetable(found || null);
    } else {
      setSelectedTimetable(null);
    }
  }, [selectedTimetableId, timetables]);

  const getTasksToDisplay = () => {
    if (!selectedTimetable) return [];
    const dateStr = moment(blueprintDate).format('YYYY-MM-DD');
    const override = selectedTimetable.overrides?.find(ov => ov.date === dateStr);
    return override ? override.tasks : selectedTimetable.defaultSchedule;
  };
  
  const isOverrideActive = () => {
    if (!selectedTimetable) return false;
    const dateStr = moment(blueprintDate).format('YYYY-MM-DD');
    return selectedTimetable.overrides?.some(ov => ov.date === dateStr);
  };

  // Fetch timeline details for a date
  const fetchTimeline = useCallback(async (targetDate) => {
    try {
      setLoading(true);
      const res = await api.get(`/stats/timeline?date=${targetDate}`);
      setTimeline(res.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Could not retrieve historical logs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTimeline(date);
  }, [date, fetchTimeline]);



  const statusIconsColors = {
    Completed: 'bg-[#008000] text-white border-2 border-white shadow-[1px_1px_0px_0px_rgba(255,255,255,1)]',
    Missed: 'bg-[#ff0000] text-white border-2 border-white shadow-[1px_1px_0px_0px_rgba(255,255,255,1)]',
    Unavoidable: 'bg-[#0000ff] text-white border-2 border-white shadow-[1px_1px_0px_0px_rgba(255,255,255,1)]',
    Upcoming: 'bg-neutral-800 text-white border-2 border-white shadow-[1px_1px_0px_0px_rgba(255,255,255,1)]',
    'In Progress': 'bg-[#ffff00] text-black border-2 border-white shadow-[1px_1px_0px_0px_rgba(255,255,255,1)]',
    'Ready To Complete': 'bg-[#008000] text-white border-2 border-white animate-pulse shadow-[1px_1px_0px_0px_rgba(255,255,255,1)]',
  };

  const getStatusIndicator = (task) => {
    if (task.status === 'Completed') return '✔';
    if (task.status === 'Missed') return '❌';
    if (task.status === 'Unavoidable') return '🛡';
    return '⏱';
  };

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto text-white font-mono">
      {/* View Mode Toggle */}
      <div className="flex border-b-2 border-white gap-4 justify-center font-bold">
        <button
          onClick={() => setViewMode('timeline')}
          className={`pb-2.5 px-4 text-sm uppercase tracking-widest transition-all border-b-4 ${
            viewMode === 'timeline'
              ? 'border-white text-white font-bold'
              : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          Daily Timeline
        </button>
        <button
          onClick={() => setViewMode('blueprint')}
          className={`pb-2.5 px-4 text-sm uppercase tracking-widest transition-all border-b-4 ${
            viewMode === 'blueprint'
              ? 'border-white text-white font-bold'
              : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          Blueprints
        </button>
      </div>

      {viewMode === 'timeline' ? (
        <>


          {loading ? (
            <div className="text-center py-12 text-sm italic text-neutral-400 font-mono">
              Syncing logs for {date}...
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500 font-mono font-bold">
              <p>{error}</p>
            </div>
          ) : timeline ? (
            <div className="flex flex-col gap-6 animate-fade-in">
              {/* Date Title */}
              <div className="text-center">
                <h2 className="text-3xl font-bold uppercase tracking-widest text-white">
                  {timeline.formattedDateLabel}
                </h2>
                <div className="w-16 h-1 bg-white mx-auto mt-2"></div>
              </div>

              {/* Quote of the Day */}
              {timeline.dailyQuote && (
                <div className="p-5 border-2 border-white bg-[#0e1017] brutalist-card text-center italic text-sm">
                  <p>"{timeline.dailyQuote.quote}"</p>
                  <p className="text-right text-[10px] text-white font-bold not-italic mt-2 font-mono uppercase tracking-widest">— {timeline.dailyQuote.author}</p>
                </div>
              )}

              {/* Main timeline listing */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                
                {/* Timeline Task Log */}
                <div className="md:col-span-2 flex flex-col gap-4">
                  <h3 className="text-sm uppercase tracking-wider text-white font-bold border-b-2 border-white pb-2">Active Task List</h3>
                  
                  <div className="flex flex-col gap-4 border-l-2 border-white pl-6 ml-4">
                    {timeline.tasks.length > 0 ? (
                      timeline.tasks.map((task) => (
                        <div key={task._id} className="relative">
                          {/* Timeline Dot Indicator */}
                          <span className={`absolute -left-[35px] top-1.5 w-6 h-6 rounded-none flex items-center justify-center text-[10px] font-bold ${statusIconsColors[task.status]}`}>
                            {getStatusIndicator(task)}
                          </span>

                          <div className="p-4 border-2 border-white bg-[#0e1017] brutalist-card">
                            <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 font-bold mb-1">
                              <span>{task.startTime} - {task.endTime} ({task.reducedDuration}m)</span>
                              <span className="uppercase tracking-widest text-white font-bold border border-white px-1.5 py-0.5 bg-[#0e1017] font-mono shadow-[1px_1px_0px_0px_rgba(255,255,255,1)]">{task.category}</span>
                            </div>
                            <h4 className="text-sm font-bold text-white font-mono">{task.name}</h4>
                            
                            <div className="mt-2 flex flex-wrap items-center justify-between text-[11px] border-t border-neutral-700 pt-2 font-mono font-bold text-white">
                              <span className="uppercase tracking-wider">
                                {task.status}
                              </span>
                              
                              {task.status === 'Completed' && (
                                <span className="text-green-400">
                                  Done at {moment(task.completionTime).format('HH:mm')} | +{task.xpEarned} XP
                                </span>
                              )}

                              {task.status === 'Missed' && (
                                <span className="text-red-500">
                                  Sabotage: {task.punishment} ({task.punishmentStatus})
                                </span>
                              )}

                              {task.status === 'Unavoidable' && (
                                <span className="text-neutral-400 italic">
                                  Reason: {task.unavoidableReason}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-neutral-500 italic font-mono pl-2 py-4">No tasks were active on this date.</p>
                    )}
                  </div>
                </div>

                {/* Reflections, diary and stats block */}
                <div className="flex flex-col gap-6">
                  
                  {/* Daily Diary segment */}
                  <div className="p-5 border-2 border-white bg-[#0e1017] brutalist-card">
                    <h3 className="text-sm uppercase tracking-wider text-white font-bold border-b-2 border-white pb-2 mb-3 flex items-center gap-1.5 font-mono">
                      <BookOpen size={14} />
                      Journal Entry
                    </h3>
                    {timeline.diary ? (
                      <div>
                        <h4 className="text-sm font-bold text-white font-mono">{timeline.diary.title || 'Untitled Journal'}</h4>
                        {timeline.diary.mood && (
                          <span className="text-[10px] uppercase font-mono text-white font-bold mt-1 block">Mood: {timeline.diary.mood}</span>
                        )}
                        <p className="text-xs text-neutral-300 leading-relaxed mt-2 italic font-mono">
                          "{timeline.diary.content}"
                        </p>
                        {timeline.diary.tags?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {timeline.diary.tags.map((tg) => (
                              <span key={tg} className="text-[9px] font-mono px-1.5 py-0.5 bg-[#ffff00] text-black border border-white font-bold shadow-[1px_1px_0px_0px_rgba(255,255,255,1)]">#{tg}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-neutral-500 italic">No journal entry recorded.</p>
                    )}
                  </div>

                  {/* Reflection Card */}
                  <div className="p-5 border-2 border-white bg-[#0e1017] brutalist-card">
                    <h3 className="text-sm uppercase tracking-wider text-white font-bold border-b-2 border-white pb-2 mb-3 flex items-center gap-1.5 font-mono">
                      <MessageSquare size={14} />
                      Reflections
                    </h3>
                    {timeline.reflection ? (
                      <div>
                        <span className="text-[10px] uppercase font-mono text-white font-bold block mb-1">
                          Assessment: <strong>{timeline.reflection.mood}</strong>
                        </span>
                        <p className="text-xs text-neutral-300 leading-relaxed italic font-mono">
                          "{timeline.reflection.reflectionNotes}"
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-neutral-500 italic">No reflection recorded.</p>
                    )}
                  </div>

                  {/* Achievements Unlocked */}
                  <div className="p-5 border-2 border-white bg-[#0e1017] brutalist-card">
                    <h3 className="text-sm uppercase tracking-wider text-white font-bold border-b-2 border-white pb-2 mb-3 flex items-center gap-1.5 font-mono">
                      <Award size={14} />
                      Unlocked achievements
                    </h3>
                    {timeline.achievementsUnlocked?.length > 0 ? (
                      <div className="flex flex-col gap-2">
                        {timeline.achievementsUnlocked.map((ach) => (
                          <div key={ach._id} className="p-2 border-2 border-white bg-[#ffff00] bg-opacity-10 text-xs flex flex-col font-bold font-mono">
                            <span className="text-white">{ach.name}</span>
                            <span className="text-[10px] text-neutral-400 mt-0.5">{ach.description}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-neutral-500 italic">No achievements unlocked today.</p>
                    )}
                  </div>

                </div>
              </div>

              {/* Stats summary footer block */}
              <section className="mt-8 p-6 border-2 border-white bg-[#0e1017] brutalist-card grid grid-cols-2 sm:grid-cols-4 gap-6 font-bold">
                <div className="flex flex-col gap-0.5 text-center sm:text-left">
                  <span className="text-[10px] uppercase font-mono text-neutral-400 font-bold">Success / Sabotage</span>
                  <span className="text-lg text-white font-mono">
                    {timeline.summary.completedTasksCount} / {timeline.summary.missedTasksCount}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5 text-center sm:text-left">
                  <span className="text-[10px] uppercase font-mono text-neutral-400 font-bold">XP Earned</span>
                  <span className="text-lg font-mono text-white">+{timeline.summary.xpEarned} XP</span>
                </div>
                <div className="flex flex-col gap-0.5 text-center sm:text-left">
                  <span className="text-[10px] uppercase font-mono text-neutral-400 font-bold">Focus Hours</span>
                  <span className="text-lg text-white font-mono">{timeline.summary.focusHoursStr}</span>
                </div>
                <div className="flex flex-col gap-0.5 text-center sm:text-left">
                  <span className="text-[10px] uppercase font-mono text-neutral-400 font-bold">Task Efficiency</span>
                  <span className="text-lg text-green-400 font-mono">{timeline.summary.productivityScore}%</span>
                </div>
              </section>
            </div>
          ) : null}
        </>
      ) : (
        /* Blueprint View Mode */
        <div className="flex flex-col gap-6 animate-fade-in font-mono">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Left Column: Dropdown and Calendar */}
            <div className="flex flex-col gap-6 w-full md:w-auto md:min-w-[320px] shrink-0">
              <section className="flex flex-col gap-4 border-2 border-white p-6 bg-[#0e1017] brutalist-card">
                <div className="flex flex-col gap-1.5 w-full">
                  <label className="text-xs uppercase tracking-widest text-white font-bold font-mono">Select Timetable blueprint</label>
                  <select
                    value={selectedTimetableId}
                    onChange={(e) => setSelectedTimetableId(e.target.value)}
                    className="w-full text-sm font-bold bg-[#0e1017] text-white border-2 border-white py-1.5"
                  >
                    <option value="">-- Choose Timetable --</option>
                    {timetables.map(t => (
                      <option key={t._id} value={t._id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </section>

              {/* Blueprint Calendar Component */}
              <BlueprintCalendar 
                selectedDate={blueprintDate}
                onSelectDate={handleSelectBlueprintDate}
              />
            </div>

            {/* Right Column: Blueprint Details */}
            <div className="flex-1 w-full">
              {selectedTimetable ? (
                <div className="flex flex-col gap-6 border-2 border-white p-6 bg-[#0e1017] brutalist-card">
                  <div className="border-b-2 border-white pb-4">
                    <h3 className="text-2xl font-bold uppercase tracking-wider font-mono">
                      {selectedTimetable.name}
                    </h3>
                    <div className="flex flex-wrap justify-between items-center mt-1.5 gap-2">
                      <p className="text-xs text-neutral-400 font-mono font-bold">
                        Range: {moment(selectedTimetable.startDate).format('DD MMM YYYY')} — {moment(selectedTimetable.endDate).format('DD MMM YYYY')}
                      </p>
                      <div className="flex items-center gap-2">
                        {isOverrideActive() ? (
                          <span className="text-[9px] px-1.5 py-0.5 bg-[#ffff00] text-black border border-white font-mono uppercase font-bold shadow-[1px_1px_0px_0px_rgba(255,255,255,1)]">
                            Override Day
                          </span>
                        ) : (
                          <span className="text-[9px] px-1.5 py-0.5 bg-neutral-700 text-white border border-white font-mono uppercase font-bold shadow-[1px_1px_0px_0px_rgba(255,255,255,1)]">
                            Default Blueprint
                          </span>
                        )}
                        <span className="text-[10px] text-neutral-400 font-mono font-bold">
                          Selected Date: {moment(blueprintDate).format('DD MMM YYYY')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold uppercase tracking-wider mb-4 border-b border-neutral-700 pb-1 font-mono text-neutral-300">
                      Tasks Schedule ({getTasksToDisplay().length} tasks)
                    </h4>
                    <div className="flex flex-col gap-4">
                      {getTasksToDisplay().length > 0 ? (
                        getTasksToDisplay().map((task, idx) => (
                          <div key={idx} className="p-4 border-2 border-white bg-[#0e1017] flex items-center justify-between gap-4 brutalist-card">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[9px] uppercase tracking-widest text-white font-bold border border-white px-1.5 py-0.5 bg-[#0e1017] font-mono shadow-[1px_1px_0px_0px_rgba(255,255,255,1)]">
                                  {task.category}
                                </span>
                                <span className="text-[10px] font-mono text-neutral-400 font-bold">
                                  {task.startTime} - {task.endTime}
                                </span>
                              </div>
                              <h5 className="text-sm font-bold text-white font-mono">{task.name}</h5>
                              {task.notes && (
                                <p className="text-[11px] text-neutral-400 italic mt-1 font-mono">
                                  "{task.notes}"
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] uppercase font-mono text-red-500 font-bold block">Sabotage Penalty</span>
                              <span className="text-xs text-white font-bold">{task.punishment}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-neutral-500 italic font-mono">No tasks active on this day.</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-sm italic text-neutral-500 font-mono border-2 border-white bg-[#0e1017] p-6 brutalist-card animate-fade-in">
                  Select a timetable blueprint or click a calendar date to inspect task templates.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default History;

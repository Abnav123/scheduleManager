import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../utils/api.js';
import { 
  Calendar, ChevronLeft, ChevronRight, BookOpen, 
  MessageSquare, Award, AlertTriangle, ShieldCheck, Clock 
} from 'lucide-react';
import { getTodayIST } from '../utils/dateHelper.js';
import moment from 'moment';

const History = () => {
  const [viewMode, setViewMode] = useState('timeline'); // 'timeline' or 'blueprint'
  const [date, setDate] = useState(getTodayIST());
  const [timeline, setTimeline] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Blueprint states
  const [timetables, setTimetables] = useState([]);
  const [selectedTimetableId, setSelectedTimetableId] = useState('');
  const [selectedTimetable, setSelectedTimetable] = useState(null);

  // Fetch timetables list for blueprint view
  useEffect(() => {
    const fetchTimetables = async () => {
      try {
        const res = await api.get('/timetables');
        setTimetables(res.data);
        if (res.data.length > 0) {
          setSelectedTimetableId(res.data[0]._id);
          setSelectedTimetable(res.data[0]);
        }
      } catch (err) {
        console.error('Failed to fetch timetables', err);
      }
    };
    fetchTimetables();
  }, []);

  // Update selected timetable object when ID changes
  useEffect(() => {
    if (selectedTimetableId) {
      const found = timetables.find(t => t._id === selectedTimetableId);
      setSelectedTimetable(found || null);
    } else {
      setSelectedTimetable(null);
    }
  }, [selectedTimetableId, timetables]);

  // Fetch timeline details for a date
  const fetchTimeline = useCallback(async (targetDate) => {
    try {
      setLoading(true);
      const res = await api.get(`/stats/timeline?date=${targetDate}`);
      setTimeline(res.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Could not retrieve historical scroll for this date.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTimeline(date);
  }, [date, fetchTimeline]);

  // Navigate dates
  const handlePrevDay = () => {
    const prev = moment(date, 'YYYY-MM-DD').subtract(1, 'day').format('YYYY-MM-DD');
    setDate(prev);
  };

  const handleNextDay = () => {
    const next = moment(date, 'YYYY-MM-DD').add(1, 'day').format('YYYY-MM-DD');
    setDate(next);
  };

  const statusIcons = {
    Completed: 'text-vagabond-green',
    Missed: 'text-vagabond-red',
    Unavoidable: 'text-gray-500',
    Upcoming: 'text-gray-600',
    'In Progress': 'text-vagabond-gold',
    'Ready To Complete': 'text-vagabond-gold animate-pulse',
  };

  const getStatusIndicator = (task) => {
    if (task.status === 'Completed') return '✔';
    if (task.status === 'Missed') return '❌';
    if (task.status === 'Unavoidable') return '🛡';
    return '⏱';
  };

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto">
      {/* View Mode Toggle */}
      <div className="flex border-b border-vagabond-slate gap-4 justify-center">
        <button
          onClick={() => setViewMode('timeline')}
          className={`pb-2.5 px-4 font-serif text-sm uppercase tracking-widest transition-all duration-200 border-b-2 ${
            viewMode === 'timeline'
              ? 'border-vagabond-gold text-vagabond-gold font-bold'
              : 'border-transparent text-vagabond-parchment text-opacity-60 hover:text-opacity-100'
          }`}
        >
          Daily Timeline
        </button>
        <button
          onClick={() => setViewMode('blueprint')}
          className={`pb-2.5 px-4 font-serif text-sm uppercase tracking-widest transition-all duration-200 border-b-2 ${
            viewMode === 'blueprint'
              ? 'border-vagabond-gold text-vagabond-gold font-bold'
              : 'border-transparent text-vagabond-parchment text-opacity-60 hover:text-opacity-100'
          }`}
        >
          Timetable Blueprints
        </button>
      </div>

      {viewMode === 'timeline' ? (
        <>
          {/* 1. Date Navigation Header */}
          <section className="flex items-center justify-between border-b border-vagabond-slate pb-4 gap-4">
            <button
              onClick={handlePrevDay}
              className="p-2 border border-vagabond-slate rounded bg-vagabond-charcoal hover:text-vagabond-gold transition-colors"
            >
              <ChevronLeft size={18} />
            </button>

            <div className="flex items-center gap-3">
              <Calendar size={18} className="text-vagabond-gold" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="px-3 py-1.5 border border-vagabond-slate rounded bg-vagabond-dark font-mono text-sm text-vagabond-parchment focus:outline-none focus:border-vagabond-gold w-40 text-center"
              />
            </div>

            <button
              onClick={handleNextDay}
              className="p-2 border border-vagabond-slate rounded bg-vagabond-charcoal hover:text-vagabond-gold transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </section>

          {loading ? (
            <div className="text-center py-12 text-sm italic text-vagabond-brown font-serif">
              Unrolling the parchment for {date}...
            </div>
          ) : error ? (
            <div className="text-center py-12 text-vagabond-red font-serif">
              <p>{error}</p>
            </div>
          ) : timeline ? (
            <div className="flex flex-col gap-6 animate-fade-in">
              {/* Formatted Date Title */}
              <div className="text-center">
                <h2 className="text-3xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-vagabond-parchment to-white uppercase tracking-widest">
                  {timeline.formattedDateLabel}
                </h2>
                <div className="w-16 h-0.5 bg-vagabond-gold mx-auto mt-2"></div>
              </div>

              {/* Stable Quote of the Day */}
              {timeline.dailyQuote && (
                <div className="p-5 border border-vagabond-brown border-opacity-10 rounded bg-vagabond-charcoal text-center shadow-zen italic font-serif text-sm">
                  <p>"{timeline.dailyQuote.quote}"</p>
                  <p className="text-right text-[10px] text-vagabond-gold font-serif not-italic mt-2 uppercase tracking-widest">— {timeline.dailyQuote.author}</p>
                </div>
              )}

              {/* Main timeline listing */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                
                {/* Timeline Task Log */}
                <div className="md:col-span-2 flex flex-col gap-4">
                  <h3 className="font-serif text-sm uppercase tracking-wider text-vagabond-gold border-b border-vagabond-slate pb-2">Chronological Tasks</h3>
                  
                  <div className="flex flex-col gap-4 border-l border-vagabond-slate pl-4 ml-2">
                    {timeline.tasks.length > 0 ? (
                      timeline.tasks.map((task) => (
                        <div key={task._id} className="relative group">
                          {/* Timeline Dot Indicator */}
                          <span className={`absolute -left-[23px] top-1 bg-vagabond-dark w-4.5 h-4.5 rounded-full border-2 border-vagabond-slate flex items-center justify-center text-[9px] font-bold ${statusIcons[task.status]}`}>
                            {getStatusIndicator(task)}
                          </span>

                          <div className="p-4 border border-vagabond-slate rounded bg-vagabond-charcoal bg-opacity-40">
                            <div className="flex items-center justify-between text-[10px] font-mono text-vagabond-brown mb-1">
                              <span>{task.startTime} - {task.endTime} ({task.reducedDuration}m)</span>
                              <span className="uppercase tracking-widest font-serif font-bold text-vagabond-gold">{task.category}</span>
                            </div>
                            <h4 className="font-serif text-sm font-semibold">{task.name}</h4>
                            
                            <div className="mt-2 flex flex-wrap items-center justify-between text-[11px] font-serif border-t border-vagabond-slate border-opacity-30 pt-2">
                              <span className={`${statusIcons[task.status]} font-medium`}>
                                {task.status}
                              </span>
                              
                              {task.status === 'Completed' && (
                                <span className="text-vagabond-green font-mono">
                                  Completed at {moment(task.completionTime).format('HH:mm')} | +{task.xpEarned} XP
                                </span>
                              )}

                              {task.status === 'Missed' && (
                                <span className="text-vagabond-red">
                                  Punishment: {task.punishment} ({task.punishmentStatus})
                                </span>
                              )}

                              {task.status === 'Unavoidable' && (
                                <span className="text-gray-400 italic">
                                  Unavoidable: {task.unavoidableReason}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-vagabond-brown italic font-serif pl-2 py-4">No tasks were active on this date.</p>
                    )}
                  </div>
                </div>

                {/* Reflections, diary and stats block */}
                <div className="flex flex-col gap-6">
                  
                  {/* Daily Diary segment */}
                  <div className="p-5 border border-vagabond-slate rounded-lg bg-vagabond-charcoal">
                    <h3 className="font-serif text-sm uppercase tracking-wider text-vagabond-gold border-b border-vagabond-slate pb-2 mb-3 flex items-center gap-1.5">
                      <BookOpen size={14} />
                      Journal Entry
                    </h3>
                    {timeline.diary ? (
                      <div className="font-serif">
                        <h4 className="text-sm font-bold text-vagabond-parchment">{timeline.diary.title || 'Untitled Journal'}</h4>
                        {timeline.diary.mood && (
                          <span className="text-[10px] uppercase font-mono text-vagabond-gold mt-1 block">Mood: {timeline.diary.mood}</span>
                        )}
                        <p className="text-xs text-vagabond-parchment text-opacity-80 leading-relaxed mt-2 italic">
                          "{timeline.diary.content}"
                        </p>
                        {timeline.diary.tags?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {timeline.diary.tags.map((tg) => (
                              <span key={tg} className="text-[9px] font-mono px-1.5 py-0.5 bg-vagabond-slate rounded text-vagabond-brown">#{tg}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-vagabond-brown italic font-serif">No journal entry recorded.</p>
                    )}
                  </div>

                  {/* Reflection Card */}
                  <div className="p-5 border border-vagabond-slate rounded-lg bg-vagabond-charcoal">
                    <h3 className="font-serif text-sm uppercase tracking-wider text-vagabond-gold border-b border-vagabond-slate pb-2 mb-3 flex items-center gap-1.5">
                      <MessageSquare size={14} />
                      Reflections
                    </h3>
                    {timeline.reflection ? (
                      <div className="font-serif">
                        <span className="text-[10px] uppercase font-mono text-vagabond-gold block mb-1">
                          Day Assessment: <strong>{timeline.reflection.mood}</strong>
                        </span>
                        <p className="text-xs text-vagabond-parchment text-opacity-80 leading-relaxed italic">
                          "{timeline.reflection.reflectionNotes}"
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-vagabond-brown italic font-serif">No reflection recorded for the day.</p>
                    )}
                  </div>

                  {/* Achievements Unlocked */}
                  <div className="p-5 border border-vagabond-slate rounded-lg bg-vagabond-charcoal">
                    <h3 className="font-serif text-sm uppercase tracking-wider text-vagabond-gold border-b border-vagabond-slate pb-2 mb-3 flex items-center gap-1.5">
                      <Award size={14} />
                      Achievements Unlocked
                    </h3>
                    {timeline.achievementsUnlocked?.length > 0 ? (
                      <div className="flex flex-col gap-2">
                        {timeline.achievementsUnlocked.map((ach) => (
                          <div key={ach._id} className="p-2 border border-vagabond-gold border-opacity-20 rounded bg-vagabond-dark text-xs flex flex-col">
                            <span className="font-serif text-vagabond-gold font-bold">{ach.name}</span>
                            <span className="text-[10px] text-vagabond-brown">{ach.description}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-vagabond-brown italic font-serif">No achievements unlocked today.</p>
                    )}
                  </div>

                </div>
              </div>

              {/* Stats summary footer block */}
              <section className="mt-8 p-6 border border-vagabond-slate rounded-lg bg-vagabond-charcoal bg-opacity-70 shadow-zen grid grid-cols-2 sm:grid-cols-4 gap-6">
                <div className="flex flex-col gap-0.5 text-center sm:text-left">
                  <span className="text-[10px] uppercase font-mono text-vagabond-brown">Success / Missed</span>
                  <span className="text-lg font-serif font-bold text-vagabond-parchment">
                    {timeline.summary.completedTasksCount} / {timeline.summary.missedTasksCount}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5 text-center sm:text-left">
                  <span className="text-[10px] uppercase font-mono text-vagabond-brown">XP Earned</span>
                  <span className="text-lg font-mono font-bold text-vagabond-gold">+{timeline.summary.xpEarned} XP</span>
                </div>
                <div className="flex flex-col gap-0.5 text-center sm:text-left">
                  <span className="text-[10px] uppercase font-mono text-vagabond-brown">Focus Hours</span>
                  <span className="text-lg font-serif font-bold text-vagabond-parchment">{timeline.summary.focusHoursStr}</span>
                </div>
                <div className="flex flex-col gap-0.5 text-center sm:text-left">
                  <span className="text-[10px] uppercase font-mono text-vagabond-brown">Productivity Score</span>
                  <span className="text-lg font-serif font-bold text-vagabond-green">{timeline.summary.productivityScore}%</span>
                </div>
              </section>
            </div>
          ) : null}
        </>
      ) : (
        /* Blueprint View Mode */
        <div className="flex flex-col gap-6 animate-fade-in">
          <section className="flex flex-col gap-4 border border-vagabond-slate p-6 rounded-lg bg-vagabond-charcoal">
            <div className="flex flex-col gap-1.5 max-w-md">
              <label className="text-xs font-serif uppercase tracking-widest text-vagabond-brown">Select Timetable</label>
              <select
                value={selectedTimetableId}
                onChange={(e) => setSelectedTimetableId(e.target.value)}
                className="px-3 py-2 rounded border border-vagabond-slate bg-vagabond-dark text-sm text-vagabond-parchment focus:outline-none focus:border-vagabond-gold"
              >
                <option value="">-- Choose Timetable --</option>
                {timetables.map(t => (
                  <option key={t._id} value={t._id}>{t.name}</option>
                ))}
              </select>
            </div>
          </section>

          {selectedTimetable ? (
            <div className="flex flex-col gap-6 border border-vagabond-slate rounded-lg p-6 bg-vagabond-charcoal bg-opacity-40">
              <div className="border-b border-vagabond-slate pb-4">
                <h3 className="text-2xl font-serif text-vagabond-gold font-bold uppercase tracking-wider">
                  {selectedTimetable.name}
                </h3>
                <p className="text-xs text-vagabond-brown font-mono mt-1">
                  Active Timeline: {moment(selectedTimetable.startDate).format('DD MMM YYYY')} &mdash; {moment(selectedTimetable.endDate).format('DD MMM YYYY')}
                </p>
              </div>

              <div>
                <h4 className="font-serif text-sm text-vagabond-parchment uppercase tracking-wider mb-4 border-b border-vagabond-slate border-opacity-35 pb-1">
                  Default Daily Tasks blueprint ({selectedTimetable.defaultSchedule.length} tasks)
                </h4>
                <div className="flex flex-col gap-4">
                  {selectedTimetable.defaultSchedule.length > 0 ? (
                    selectedTimetable.defaultSchedule.map((task, idx) => (
                      <div key={idx} className="p-4 border border-vagabond-slate rounded bg-vagabond-dark bg-opacity-30 flex items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[9px] font-serif uppercase tracking-widest text-vagabond-gold font-bold">
                              {task.category}
                            </span>
                            <span className="text-[10px] font-mono text-vagabond-brown">
                              {task.startTime} - {task.endTime}
                            </span>
                          </div>
                          <h5 className="font-serif text-sm font-semibold text-vagabond-parchment">{task.name}</h5>
                          {task.notes && (
                            <p className="text-[11px] text-vagabond-brown italic font-serif mt-1">
                              "{task.notes}"
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-mono text-vagabond-red block">Failure Penalty</span>
                          <span className="text-xs text-vagabond-parchment font-serif">{task.punishment}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-vagabond-brown italic font-serif">No task templates defined in this timetable.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-sm italic text-vagabond-brown font-serif">
              Select a timetable blueprint to inspect task templates.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default History;

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import api from '../utils/api.js';
import { 
  Plus, Trash2, Calendar, Clock, Edit3, Save, 
  X, ChevronDown, ChevronUp, AlertCircle, Compass 
} from 'lucide-react';
import moment from 'moment';

const TimetableCalendar = ({ timetable, selectedDate, onSelectDate }) => {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const start = moment(timetable.startDate);
    const today = moment();
    return today.isBetween(start, moment(timetable.endDate)) ? today.startOf('month') : start.startOf('month');
  });

  const startLimit = moment(timetable.startDate).startOf('day');
  const endLimit = moment(timetable.endDate).endOf('day');
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

  // Find if date has override configured
  const hasOverride = (dateStr) => {
    return timetable.overrides?.some(ov => ov.date === dateStr);
  };

  return (
    <div className="p-4 border border-vagabond-slate rounded-lg bg-vagabond-dark max-w-sm w-full select-none">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={prevMonth}
          disabled={currentMonth.clone().subtract(1, 'month').endOf('month').isBefore(startLimit)}
          className="p-1 hover:bg-vagabond-slate rounded disabled:opacity-30 disabled:hover:bg-transparent text-vagabond-gold text-xs font-bold"
        >
          &larr;
        </button>
        <span className="font-serif text-xs font-bold uppercase tracking-wider text-vagabond-parchment">
          {currentMonth.format('MMMM YYYY')}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          disabled={currentMonth.clone().add(1, 'month').startOf('month').isAfter(endLimit)}
          className="p-1 hover:bg-vagabond-slate rounded disabled:opacity-30 disabled:hover:bg-transparent text-vagabond-gold text-xs font-bold"
        >
          &rarr;
        </button>
      </div>

      {/* Weekdays */}
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase font-mono text-vagabond-brown mb-1.5">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
          <div key={d}>{d}</div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map(d => {
          const dateStr = d.format('YYYY-MM-DD');
          const isCurrentMonth = d.month() === currentMonth.month();
          const isWithinRange = d.isSameOrAfter(startLimit, 'day') && d.isSameOrBefore(endLimit, 'day');
          const isPast = d.isBefore(today, 'day');
          const isSelectable = isWithinRange && !isPast;
          const isSelected = selectedDate === dateStr;
          const overrideExists = hasOverride(dateStr);

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => isSelectable && onSelectDate(dateStr)}
              disabled={!isSelectable}
              className={`h-8 rounded text-[10px] flex flex-col items-center justify-center relative font-mono transition-all duration-200 ${
                !isCurrentMonth ? 'text-gray-600 opacity-40' : ''
              } ${
                isSelected 
                  ? 'bg-vagabond-gold text-black font-bold' 
                  : isSelectable 
                    ? 'hover:bg-vagabond-slate text-vagabond-parchment' 
                    : 'text-gray-500 cursor-not-allowed opacity-20'
              }`}
            >
              <span>{d.date()}</span>
              {overrideExists && (
                <span className={`absolute bottom-0.5 w-1 h-1 rounded-full ${isSelected ? 'bg-black' : 'bg-vagabond-gold'}`}></span>
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex items-center justify-between text-[8px] text-vagabond-brown font-mono border-t border-vagabond-slate pt-2">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-vagabond-gold"></span> Override Set
        </span>
        <span>Today: {today.format('DD MMM')}</span>
      </div>
    </div>
  );
};

const TimetableManager = () => {
  const [timetables, setTimetables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Timetable Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState(() => moment().format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(() => moment().format('YYYY-MM-DD'));
  const [defaultSchedule, setDefaultSchedule] = useState([]);
  
  // Single task template form state
  const [taskName, setTaskName] = useState('');
  const [category, setCategory] = useState('Custom');
  const [punishment, setPunishment] = useState('');
  const [notes, setNotes] = useState('');
  const [taskError, setTaskError] = useState('');
  const [tempTaskApply, setTempTaskApply] = useState('all');

  // Refs for uncontrolled time inputs to prevent resetting incomplete typing states
  const startTimeRef = useRef(null);
  const endTimeRef = useRef(null);
  const overrideStartTimeRef = useRef(null);
  const overrideEndTimeRef = useRef(null);

  // Overrides editor state
  const [selectedTimetable, setSelectedTimetable] = useState(null);
  const [overrideDate, setOverrideDate] = useState('');
  const [overrideTasks, setOverrideTasks] = useState([]);
  const [showOverrideForm, setShowOverrideForm] = useState(false);
  const [overrideError, setOverrideError] = useState('');
  const [applyScope, setApplyScope] = useState('single');

  // Fetch timetables
  const fetchTimetables = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/timetables');
      setTimetables(res.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to fetch timetables.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTimetables();
  }, [fetchTimetables]);

  // Handle adding task to temp schedule builder
  const handleAddTempTask = (e) => {
    e.preventDefault();
    const sTime = startTimeRef.current?.value || '';
    const eTime = endTimeRef.current?.value || '';

    if (!taskName || !sTime || !eTime || !punishment) {
      setTaskError('Fill in all task fields (Name, Times, Punishment)');
      return;
    }
    if (sTime >= eTime) {
      setTaskError('End time must be after start time');
      return;
    }

    // Check if start date is today and start time is in the past / too close (at least 3 min offset)
    const todayStr = moment().format('YYYY-MM-DD');
    if (startDate === todayStr) {
      const now = moment();
      const taskStart = moment(`${todayStr} ${sTime}`, 'YYYY-MM-DD HH:mm');
      const minStart = now.clone().add(3, 'minutes');
      if (taskStart.isBefore(minStart)) {
        setTaskError('Start time must be at least 3 minutes after the current time for today\'s schedule');
        return;
      }
    }

    const newTask = {
      name: taskName,
      category,
      startTime: sTime,
      endTime: eTime,
      punishment,
      notes,
      applyTo: tempTaskApply,
    };

    setDefaultSchedule([...defaultSchedule, newTask]);
    // Clear task inputs
    setTaskName('');
    setPunishment('');
    setNotes('');
    if (startTimeRef.current) startTimeRef.current.value = '';
    if (endTimeRef.current) endTimeRef.current.value = '';
    setTaskError('');
  };

  // Remove task from temp schedule builder
  const handleRemoveTempTask = (index) => {
    const updated = defaultSchedule.filter((_, i) => i !== index);
    setDefaultSchedule(updated);
  };

  // Handle Submit Timetable
  const handleCreateTimetable = async (e) => {
    e.preventDefault();
    if (!name || !startDate || !endDate) {
      setError('Please specify timetable name and date range');
      return;
    }
    if (defaultSchedule.length === 0) {
      setError('You must add at least one task template to the schedule builder below before saving.');
      return;
    }

    try {
      setError('');
      const blueprintTasks = defaultSchedule.filter(t => t.applyTo !== 'today').map(({ applyTo, ...rest }) => rest);
      const todayTasks = defaultSchedule.filter(t => t.applyTo === 'today').map(({ applyTo, ...rest }) => rest);

      const todayOverrideList = [...blueprintTasks, ...todayTasks];
      const overridesObj = todayTasks.length > 0 ? [{
        date: moment().format('YYYY-MM-DD'),
        tasks: todayOverrideList
      }] : [];

      await api.post('/timetables', {
        name,
        startDate,
        endDate,
        defaultSchedule: blueprintTasks,
        overrides: overridesObj,
      });
      // Reset form
      setName('');
      setStartDate('');
      setEndDate('');
      setDefaultSchedule([]);
      setShowAddForm(false);
      fetchTimetables();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create timetable.');
    }
  };

  // Delete Timetable
  const handleDeleteTimetable = async (id) => {
    if (!window.confirm('Are you sure you want to remove this timetable? It will delete the schedule definition.')) {
      return;
    }
    try {
      await api.delete(`/timetables/${id}`);
      fetchTimetables();
      if (selectedTimetable?._id === id) {
        setSelectedTimetable(null);
        setShowOverrideForm(false);
      }
    } catch (err) {
      alert('Delete failed');
    }
  };

  // --- OVERRIDE CONFIGURATION ---
  const handleSelectOverrideTimetable = (timetable) => {
    setSelectedTimetable(timetable);
    setOverrideDate('');
    setOverrideTasks([]);
    setShowOverrideForm(true);
    setOverrideError('');
    setApplyScope('single');
  };

  // Load current tasks for override date selected from the interactive calendar
  const handleSelectCalendarDate = (dateStr) => {
    setOverrideDate(dateStr);
    setOverrideError('');
    
    // Check if override already exists in timetable local object
    const existingOverride = selectedTimetable.overrides.find((ov) => ov.date === dateStr);
    if (existingOverride) {
      setOverrideTasks([...existingOverride.tasks]);
    } else {
      // Pre-fill with default daily schedule templates
      setOverrideTasks([...selectedTimetable.defaultSchedule]);
    }
  };

  // Handle adding task to override list
  const handleAddOverrideTask = (e) => {
    e.preventDefault();
    const sTime = overrideStartTimeRef.current?.value || '';
    const eTime = overrideEndTimeRef.current?.value || '';

    if (!taskName || !sTime || !eTime || !punishment) {
      setOverrideError('Fill all fields to add task override');
      return;
    }
    if (sTime >= eTime) {
      setOverrideError('End time must be after start time');
      return;
    }

    // Check if override date is today and start time is in the past / too close (at least 3 min offset)
    const todayStr = moment().format('YYYY-MM-DD');
    if (overrideDate === todayStr) {
      const now = moment();
      const taskStart = moment(`${todayStr} ${sTime}`, 'YYYY-MM-DD HH:mm');
      const minStart = now.clone().add(3, 'minutes');
      if (taskStart.isBefore(minStart)) {
        setOverrideError('Start time must be at least 3 minutes after the current time for today\'s schedule');
        return;
      }
    }

    const newTask = {
      name: taskName,
      category,
      startTime: sTime,
      endTime: eTime,
      punishment,
      notes,
    };

    setOverrideTasks([...overrideTasks, newTask]);
    // Clear inputs
    setTaskName('');
    setPunishment('');
    setNotes('');
    if (overrideStartTimeRef.current) overrideStartTimeRef.current.value = '';
    if (overrideEndTimeRef.current) overrideEndTimeRef.current.value = '';
    setOverrideError('');
  };

  const handleRemoveOverrideTask = (index) => {
    const task = overrideTasks[index];
    // If override date is today, check if task has already started
    const todayStr = moment().format('YYYY-MM-DD');
    if (overrideDate === todayStr) {
      const now = moment();
      const taskStart = moment(`${overrideDate} ${task.startTime}`, 'YYYY-MM-DD HH:mm');
      if (taskStart.isBefore(now)) {
        setOverrideError('Cannot delete a task whose scheduled start time has already passed');
        return;
      }
    }
    setOverrideTasks(overrideTasks.filter((_, i) => i !== index));
  };

  // Save Override back to database (with single vs all days scope toggle)
  const handleSaveOverride = async () => {
    if (!overrideDate) {
      setOverrideError('Select date first');
      return;
    }

    try {
      if (applyScope === 'all') {
        // Update the master blueprint for all days of the schedule
        await api.put(`/timetables/${selectedTimetable._id}`, {
          defaultSchedule: overrideTasks,
        });
        alert('Schedule blueprint updated for all days successfully.');
      } else {
        // Update only this specific date override
        await api.post(`/timetables/${selectedTimetable._id}/overrides`, {
          date: overrideDate,
          tasks: overrideTasks,
        });
        alert('Override saved successfully for ' + overrideDate);
      }
      setShowOverrideForm(false);
      setSelectedTimetable(null);
      fetchTimetables();
    } catch (err) {
      setOverrideError(err.response?.data?.message || 'Failed to save settings.');
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto">
      {/* Description Segment */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-vagabond-slate pb-4">
        <div>
          <p className="text-xs text-vagabond-brown uppercase tracking-wider font-mono">Discipline Architecture</p>
          <h2 className="text-2xl font-serif font-bold text-vagabond-gold">Timetable & Overrides Manager</h2>
        </div>
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            setShowOverrideForm(false);
          }}
          className="flex items-center gap-2 px-4 py-2 border border-vagabond-gold rounded text-xs uppercase tracking-widest font-bold hover:bg-vagabond-gold hover:text-black font-serif transition-all duration-300"
        >
          {showAddForm ? <X size={14} /> : <Plus size={14} />}
          <span>{showAddForm ? 'Cancel Creation' : 'New Schedule'}</span>
        </button>
      </section>

      {/* ERROR CALLOUTS */}
      {error && (
        <div className="p-4 border border-vagabond-red bg-vagabond-red bg-opacity-10 rounded text-xs text-vagabond-red font-serif flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* 1. ADD TIMETABLE FORM */}
      {showAddForm && (
        <form onSubmit={handleCreateTimetable} className="p-6 border border-vagabond-slate rounded-lg bg-vagabond-charcoal flex flex-col gap-6 animate-fade-in">
          <h3 className="font-serif text-lg text-vagabond-gold border-b border-vagabond-slate pb-2">Create New Path Schedule</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-serif uppercase tracking-widest text-vagabond-brown">Schedule Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Master the Sword v1"
                className="px-3 py-2 rounded border border-vagabond-slate bg-vagabond-dark text-sm text-vagabond-parchment focus:outline-none focus:border-vagabond-gold"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-serif uppercase tracking-widest text-vagabond-brown">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 rounded border border-vagabond-slate bg-vagabond-dark text-sm text-vagabond-parchment focus:outline-none focus:border-vagabond-gold"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-serif uppercase tracking-widest text-vagabond-brown">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 rounded border border-vagabond-slate bg-vagabond-dark text-sm text-vagabond-parchment focus:outline-none focus:border-vagabond-gold"
              />
            </div>
          </div>

          {startDate && endDate && (
            <div className="p-4 border border-vagabond-gold border-opacity-20 bg-vagabond-gold bg-opacity-5 rounded text-xs text-vagabond-parchment font-serif mb-2 flex flex-col gap-1.5 border-dashed">
              <span className="font-bold text-vagabond-gold uppercase tracking-wider text-[10px]">Define Your Daily Schedule Blueprint</span>
              <p className="text-opacity-80">
                Please define the tasks for this timetable. For each task, you must provide:
              </p>
              <ul className="list-disc pl-4 flex flex-col gap-0.5 text-opacity-80">
                <li><strong className="text-vagabond-gold">Task Name</strong> to describe the discipline focus.</li>
                <li><strong className="text-vagabond-gold">Mandatory Start & End Times</strong> (time slots).</li>
                <li><strong className="text-vagabond-gold">Mandatory Punishment</strong> (penalty cost if failed/missed).</li>
              </ul>
            </div>
          )}

          {/* Subtask Template Builder */}
          <div className="border border-vagabond-slate rounded-lg p-5 bg-vagabond-dark flex flex-col gap-4">
            <h4 className="font-serif text-sm text-vagabond-gold border-b border-vagabond-slate pb-2">Add Schedule Task Templates</h4>
            {taskError && <p className="text-xs text-vagabond-red font-serif">{taskError}</p>}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Task Name (e.g. Meditations)"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                className="px-3 py-1.5 rounded border border-vagabond-slate bg-vagabond-charcoal text-xs text-vagabond-parchment focus:outline-none focus:border-vagabond-gold"
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="px-3 py-1.5 rounded border border-vagabond-slate bg-vagabond-charcoal text-xs text-vagabond-parchment focus:outline-none focus:border-vagabond-gold"
              >
                {['DSA', 'Development', 'College', 'Health', 'Reading', 'Personal', 'Custom'].map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Mandatory Punishment (e.g. 50 Burpees)"
                value={punishment}
                onChange={(e) => setPunishment(e.target.value)}
                className="px-3 py-1.5 rounded border border-vagabond-slate bg-vagabond-charcoal text-xs text-vagabond-parchment focus:outline-none focus:border-vagabond-gold"
              />
              <div className="flex flex-col gap-1 w-full">
                <label className="text-[10px] uppercase font-serif tracking-wider text-vagabond-brown">Start Time</label>
                <input
                  ref={startTimeRef}
                  type="time"
                  defaultValue={moment().add(3, 'minutes').format('HH:mm')}
                  className="px-3 py-1.5 rounded border border-vagabond-slate bg-vagabond-charcoal text-xs text-vagabond-parchment focus:outline-none focus:border-vagabond-gold w-full"
                />
              </div>
              <div className="flex flex-col gap-1 w-full">
                <label className="text-[10px] uppercase font-serif tracking-wider text-vagabond-brown">End Time</label>
                <input
                  ref={endTimeRef}
                  type="time"
                  defaultValue={moment().add(63, 'minutes').format('HH:mm')}
                  className="px-3 py-1.5 rounded border border-vagabond-slate bg-vagabond-charcoal text-xs text-vagabond-parchment focus:outline-none focus:border-vagabond-gold w-full"
                />
              </div>
              <input
                type="text"
                placeholder="Notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="px-3 py-1.5 rounded border border-vagabond-slate bg-vagabond-charcoal text-xs text-vagabond-parchment focus:outline-none focus:border-vagabond-gold"
              />
              <div className="flex flex-col gap-1 w-full md:col-span-3 mt-1.5">
                <label className="flex items-center gap-2 text-xs cursor-pointer select-none text-vagabond-parchment">
                  <input
                    type="checkbox"
                    checked={tempTaskApply === 'all'}
                    onChange={(e) => setTempTaskApply(e.target.checked ? 'all' : 'today')}
                    className="w-4 h-4 accent-white cursor-pointer border border-vagabond-slate rounded"
                  />
                  <span className="font-serif">Apply task to all days of schedule (Default Blueprint)</span>
                </label>
                <p className="text-[10px] text-vagabond-brown italic mt-0.5 ml-6">
                  Uncheck to apply this task to today only ({moment().format('DD MMM')}).
                </p>
              </div>
            </div>
            
            <button
              type="button"
              onClick={handleAddTempTask}
              className="flex items-center justify-center gap-1.5 self-end px-4 py-1.5 bg-vagabond-gold text-black rounded text-xs uppercase font-bold font-serif shadow-gold-glow"
            >
              <Plus size={12} />
              <span>Add Task Template</span>
            </button>

            {/* List of currently added task templates in build list */}
            <div className="mt-4 border-t border-vagabond-slate pt-4">
              <span className="text-[10px] uppercase font-mono text-vagabond-brown block mb-2">Build List ({defaultSchedule.length} tasks)</span>
              {defaultSchedule.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {defaultSchedule.map((t, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border border-vagabond-slate rounded bg-vagabond-charcoal text-xs">
                      <div>
                        <strong>{t.name}</strong> <span className="text-vagabond-gold font-serif">({t.category})</span>
                        {t.applyTo === 'today' ? (
                          <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded border border-vagabond-red text-vagabond-red font-mono uppercase font-bold">Today Only</span>
                        ) : (
                          <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded border border-vagabond-slate text-vagabond-brown font-mono uppercase font-bold">All Days</span>
                        )}
                        <div className="text-[10px] text-vagabond-brown mt-0.5">{t.startTime} - {t.endTime} | Punishment: {t.punishment}</div>
                      </div>
                      <button type="button" onClick={() => handleRemoveTempTask(idx)} className="text-vagabond-red hover:text-red-400 p-1">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-vagabond-brown italic font-serif py-4 text-center border border-dashed border-vagabond-slate border-opacity-35 rounded">
                  No task templates added yet. Fill out the fields above and click "+ Add Task Template".
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="self-end px-6 py-2.5 bg-[#1a1a1a] hover:bg-vagabond-gold hover:text-black text-white font-serif uppercase tracking-widest text-xs rounded font-bold transition-all duration-300 shadow-zen border border-vagabond-gold"
          >
            Save Timetable
          </button>
        </form>
      )}

      {/* 2. OVERRIDE EDITOR FORM */}
      {showOverrideForm && selectedTimetable && (
        <div className="p-6 border border-vagabond-gold rounded-lg bg-vagabond-charcoal flex flex-col gap-6 animate-fade-in">
          <div className="flex items-center justify-between border-b border-vagabond-slate pb-2">
            <h3 className="font-serif text-lg text-vagabond-gold">Date-Specific Overrides for: {selectedTimetable.name}</h3>
            <button onClick={() => { setShowOverrideForm(false); setSelectedTimetable(null); }} className="text-gray-400 hover:text-white">
              <X size={18} />
            </button>
          </div>

          {overrideError && (
            <p className="text-xs text-vagabond-red font-serif">{overrideError}</p>
          )}

          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="flex flex-col gap-2 w-full md:w-auto">
              <label className="text-xs font-serif uppercase tracking-widest text-vagabond-brown">Select Date via Calendar</label>
              <TimetableCalendar 
                timetable={selectedTimetable}
                selectedDate={overrideDate}
                onSelectDate={handleSelectCalendarDate}
              />
            </div>

            <div className="flex-1 w-full">
              {overrideDate ? (
                <div className="border border-vagabond-slate rounded-lg p-5 bg-vagabond-dark flex flex-col gap-4">
                  <h4 className="font-serif text-xs text-vagabond-gold border-b border-vagabond-slate pb-1.5">
                    Tasks for {overrideDate} ({overrideTasks.length} tasks)
                  </h4>
                  
                  {/* Add task builder just for overrides */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="Override Task Name"
                      value={taskName}
                      onChange={(e) => setTaskName(e.target.value)}
                      className="px-3 py-1.5 rounded border border-vagabond-slate bg-vagabond-charcoal text-xs text-vagabond-parchment focus:outline-none"
                    />
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="px-3 py-1.5 rounded border border-vagabond-slate bg-vagabond-charcoal text-xs text-vagabond-parchment focus:outline-none"
                    >
                      {['DSA', 'Development', 'College', 'Health', 'Reading', 'Personal', 'Custom'].map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Override Punishment"
                      value={punishment}
                      onChange={(e) => setPunishment(e.target.value)}
                      className="px-3 py-1.5 rounded border border-vagabond-slate bg-vagabond-charcoal text-xs text-vagabond-parchment focus:outline-none"
                    />
                    <div className="flex flex-col gap-1 w-full">
                      <label className="text-[9px] uppercase tracking-wider text-vagabond-brown">Start Time</label>
                      <input
                        ref={overrideStartTimeRef}
                        type="time"
                        defaultValue={moment().add(3, 'minutes').format('HH:mm')}
                        className="px-3 py-1.5 rounded border border-vagabond-slate bg-vagabond-charcoal text-xs text-vagabond-parchment focus:outline-none w-full"
                      />
                    </div>
                    <div className="flex flex-col gap-1 w-full">
                      <label className="text-[9px] uppercase tracking-wider text-vagabond-brown">End Time</label>
                      <input
                        ref={overrideEndTimeRef}
                        type="time"
                        defaultValue={moment().add(63, 'minutes').format('HH:mm')}
                        className="px-3 py-1.5 rounded border border-vagabond-slate bg-vagabond-charcoal text-xs text-vagabond-parchment focus:outline-none w-full"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Notes (optional)"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="px-3 py-1.5 rounded border border-vagabond-slate bg-vagabond-charcoal text-xs text-vagabond-parchment focus:outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAddOverrideTask}
                    className="self-end px-3 py-1.5 bg-vagabond-gold text-black rounded text-xs uppercase font-bold font-serif shadow-gold-glow"
                  >
                    Add / Replace Task Override
                  </button>

                  {/* Tasks List */}
                  <div className="flex flex-col gap-2 mt-2">
                    {overrideTasks.length > 0 ? (
                      overrideTasks.map((t, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 border border-vagabond-slate rounded bg-vagabond-charcoal text-xs">
                          <div>
                            <strong>{t.name}</strong> <span className="text-vagabond-gold">({t.category})</span>
                            <div className="text-[10px] text-vagabond-brown mt-0.5">{t.startTime} - {t.endTime} | Punishment: {t.punishment}</div>
                          </div>
                          <button type="button" onClick={() => handleRemoveOverrideTask(idx)} className="text-vagabond-red hover:text-red-400 p-1">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-vagabond-brown italic text-center py-4">No tasks scheduled. Today is neutral rest.</p>
                    )}
                  </div>

                  {/* Scope Selection */}
                  <div className="flex flex-col gap-2 mt-4 p-4 border border-vagabond-slate rounded bg-vagabond-charcoal">
                    <label className="flex items-center gap-2 text-xs cursor-pointer select-none text-vagabond-parchment">
                      <input
                        type="checkbox"
                        checked={applyScope === 'all'}
                        onChange={(e) => setApplyScope(e.target.checked ? 'all' : 'single')}
                        className="w-4 h-4 accent-white cursor-pointer border border-vagabond-slate rounded"
                      />
                      <span className="font-serif">Apply these changes to all days of this schedule (Update Blueprint)</span>
                    </label>
                    <p className="text-[10px] text-vagabond-brown italic mt-0.5 ml-6">
                      Uncheck to apply changes only to {overrideDate} (Date Override).
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveOverride}
                    className="self-end px-5 py-2 bg-vagabond-gold text-black rounded text-xs uppercase tracking-widest font-bold font-serif mt-4"
                  >
                    Save Override Settings
                  </button>
                </div>
              ) : (
                <div className="p-8 text-center border border-dashed border-vagabond-slate rounded-lg text-vagabond-brown font-serif italic text-sm">
                  Click on an active date in the calendar to load and override its schedule.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. LIST OF ALL TIMETABLES */}
      <section className="flex flex-col gap-4">
        <h3 className="font-serif text-sm uppercase tracking-wider text-vagabond-gold">Active and Saved Paths</h3>
        {loading ? (
          <div className="text-center py-8 text-sm italic text-vagabond-brown font-serif">Loading timetable structures...</div>
        ) : timetables.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {timetables.map((t) => {
              const startFormatted = moment(t.startDate).format('DD MMM YYYY');
              const endFormatted = moment(t.endDate).format('DD MMM YYYY');
              return (
                <div key={t._id} className="p-5 border border-vagabond-slate rounded-lg bg-vagabond-charcoal flex flex-col justify-between gap-4 shadow-zen">
                  <div>
                    <h4 className="font-serif text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-vagabond-parchment">{t.name}</h4>
                    <span className="text-[10px] font-mono text-vagabond-brown flex items-center gap-1.5 mt-1.5">
                      <Calendar size={12} />
                      {startFormatted} — {endFormatted}
                    </span>
                    <p className="text-xs text-vagabond-brown mt-3">
                      This schedule runs <strong>{t.defaultSchedule.length} default tasks</strong> daily, with <strong>{t.overrides.length} date-specific overrides</strong> configured.
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-vagabond-slate pt-4">
                    <button
                      onClick={() => handleSelectOverrideTimetable(t)}
                      className="px-3 py-1.5 border border-vagabond-gold text-vagabond-gold rounded text-xs hover:bg-vagabond-gold hover:text-black font-serif transition-all duration-300"
                    >
                      Configure Overrides
                    </button>
                    <button
                      onClick={() => handleDeleteTimetable(t._id)}
                      className="text-vagabond-red hover:text-red-400 p-1.5 transition-colors"
                      title="Delete Timetable"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center border border-dashed border-vagabond-slate rounded-lg text-vagabond-brown font-serif italic text-sm">
            No timetables scheduled yet. Click "New Schedule" above to build your daily path!
          </div>
        )}
      </section>
    </div>
  );
};

export default TimetableManager;

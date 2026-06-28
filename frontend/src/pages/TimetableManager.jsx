import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../utils/api.js';
import { 
  Plus, Trash2, Calendar, Save, 
  X, AlertCircle 
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
    <div className="p-4 border-2 border-white bg-[#0e1017] max-w-sm w-full select-none brutalist-card">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={prevMonth}
          disabled={currentMonth.clone().subtract(1, 'month').endOf('month').isBefore(startLimit)}
          className="p-1 hover:bg-neutral-900 border border-white rounded-none disabled:opacity-30 disabled:hover:bg-transparent text-white text-xs font-bold font-mono"
        >
          &larr;
        </button>
        <span className="text-xs font-bold uppercase tracking-wider text-white font-mono">
          {currentMonth.format('MMMM YYYY')}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          disabled={currentMonth.clone().add(1, 'month').startOf('month').isAfter(endLimit)}
          className="p-1 hover:bg-neutral-900 border border-white rounded-none disabled:opacity-30 disabled:hover:bg-transparent text-white text-xs font-bold font-mono"
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
              className={`h-8 rounded-none text-[10px] flex flex-col items-center justify-center relative font-mono transition-all duration-100 ${
                !isCurrentMonth ? 'text-neutral-500 opacity-40' : ''
              } ${
                isSelected 
                  ? 'bg-white text-black font-bold' 
                  : isSelectable 
                    ? 'hover:bg-neutral-900 text-white border border-white' 
                    : 'text-neutral-600 cursor-not-allowed opacity-20'
              }`}
            >
              <span>{d.date()}</span>
              {overrideExists && (
                <span className={`absolute bottom-0.5 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-black' : 'bg-white'}`}></span>
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex items-center justify-between text-[8px] text-neutral-400 font-mono border-t-2 border-white pt-2 font-bold">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-white"></span> Override Set
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

  // Task editing state
  const [editingTempIndex, setEditingTempIndex] = useState(null);
  const [editingOverrideIndex, setEditingOverrideIndex] = useState(null);

  // Fetch timetables
  const fetchTimetables = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/timetables');
      setTimetables(res.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to fetch blueprints.');
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

    // Check if a task with the same name already exists in defaultSchedule
    let targetIndex = editingTempIndex;
    if (targetIndex === null) {
      const foundIdx = defaultSchedule.findIndex(t => t.name.trim().toLowerCase() === taskName.trim().toLowerCase());
      if (foundIdx > -1) {
        targetIndex = foundIdx;
      }
    }

    // Check if new task overlaps with any existing tasks in defaultSchedule (excluding targetIndex if editing/overriding)
    const overlaps = defaultSchedule.some((task, idx) => {
      if (targetIndex !== null && idx === targetIndex) return false;
      return sTime < task.endTime && task.startTime < eTime;
    });
    if (overlaps) {
      setTaskError('Task times overlap with an existing task in this blueprint');
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

    if (targetIndex !== null) {
      const updated = [...defaultSchedule];
      updated[targetIndex] = newTask;
      setDefaultSchedule(updated);
      setEditingTempIndex(null);
    } else {
      setDefaultSchedule([...defaultSchedule, newTask]);
    }

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
    if (editingTempIndex === index) {
      setEditingTempIndex(null);
      setTaskName('');
      setPunishment('');
      setNotes('');
      if (startTimeRef.current) startTimeRef.current.value = '';
      if (endTimeRef.current) endTimeRef.current.value = '';
    } else if (editingTempIndex !== null && editingTempIndex > index) {
      setEditingTempIndex(editingTempIndex - 1);
    }
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
      const blueprintTasks = defaultSchedule.filter(t => t.applyTo !== 'today').map(({ applyTo: _applyTo, ...rest }) => rest);
      const todayTasks = defaultSchedule.filter(t => t.applyTo === 'today').map(({ applyTo: _applyTo, ...rest }) => rest);

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
      setEditingTempIndex(null);
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
        setEditingOverrideIndex(null);
      }
    } catch {
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
    setEditingOverrideIndex(null);
  };

  // Load current tasks for override date selected from the interactive calendar
  const handleSelectCalendarDate = (dateStr) => {
    setOverrideDate(dateStr);
    setOverrideError('');
    setEditingOverrideIndex(null);
    
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

    // Check if a task with the same name already exists in overrideTasks
    let targetIndex = editingOverrideIndex;
    if (targetIndex === null) {
      const foundIdx = overrideTasks.findIndex(t => t.name.trim().toLowerCase() === taskName.trim().toLowerCase());
      if (foundIdx > -1) {
        targetIndex = foundIdx;
      }
    }

    // Check if new task overlaps with any existing tasks in overrideTasks (excluding targetIndex if editing/overriding)
    const overlaps = overrideTasks.some((task, idx) => {
      if (targetIndex !== null && idx === targetIndex) return false;
      return sTime < task.endTime && task.startTime < eTime;
    });
    if (overlaps) {
      setOverrideError('Task times overlap with an existing task in this override schedule');
      return;
    }

    // Check if override date is today and start time is in the past / too close (at least 3 min offset)
    const todayStr = moment().format('YYYY-MM-DD');
    if (overrideDate === todayStr) {
      const now = moment();
      const taskStart = moment(`${overrideDate} ${sTime}`, 'YYYY-MM-DD HH:mm');
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

    if (targetIndex !== null) {
      const updatedTasks = [...overrideTasks];
      updatedTasks[targetIndex] = newTask;
      setOverrideTasks(updatedTasks);
      setEditingOverrideIndex(null);
    } else {
      setOverrideTasks([...overrideTasks, newTask]);
    }

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
    if (editingOverrideIndex === index) {
      setEditingOverrideIndex(null);
      setTaskName('');
      setPunishment('');
      setNotes('');
      if (overrideStartTimeRef.current) overrideStartTimeRef.current.value = '';
      if (overrideEndTimeRef.current) overrideEndTimeRef.current.value = '';
    } else if (editingOverrideIndex !== null && editingOverrideIndex > index) {
      setEditingOverrideIndex(editingOverrideIndex - 1);
    }
  };

  // Save Override back to database
  const handleSaveOverride = async () => {
    if (!overrideDate) {
      setOverrideError('Select date first');
      return;
    }

    try {
      if (applyScope === 'all') {
        // Master blueprint daily master update
        await api.put(`/timetables/${selectedTimetable._id}`, {
          defaultSchedule: overrideTasks,
        });
        alert('Schedule blueprint updated for all days successfully.');
      } else {
        // Date-specific override
        await api.post(`/timetables/${selectedTimetable._id}/overrides`, {
          date: overrideDate,
          tasks: overrideTasks,
        });
        alert('Override saved successfully for ' + overrideDate);
      }
      setShowOverrideForm(false);
      setSelectedTimetable(null);
      setEditingOverrideIndex(null);
      fetchTimetables();
    } catch (err) {
      setOverrideError(err.response?.data?.message || 'Failed to save settings.');
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto text-white">
      {/* Description Segment */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-white pb-4">
        <div>
          <p className="text-xs text-neutral-400 uppercase tracking-wider font-mono font-bold">Discipline Blueprints</p>
          <h2 className="text-2xl font-bold font-mono">Timetable blueprints</h2>
        </div>
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            setShowOverrideForm(false);
          }}
          className={showAddForm ? 'btn-red' : 'btn-blue'}
        >
          {showAddForm ? 'Cancel Creation' : 'New blueprint'}
        </button>
      </section>

      {error && (
        <div className="p-4 border-2 border-white bg-[#ff0000] text-white text-xs flex items-center gap-2 font-mono font-bold animate-fade-in shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* 1. ADD TIMETABLE FORM */}
      {showAddForm && (
        <form onSubmit={handleCreateTimetable} className="p-6 border-2 border-white bg-[#0e1017] brutalist-card flex flex-col gap-6 animate-fade-in">
          <h3 className="text-lg font-bold border-b-2 border-white pb-2 font-mono">Formulate blueprint</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5 font-mono">
              <label className="text-xs uppercase tracking-widest text-white font-bold">Blueprint name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Navigation Tasks v1"
                className="w-full bg-[#0e1017] text-white border-2 border-white"
              />
            </div>
            <div className="flex flex-col gap-1.5 font-mono">
              <label className="text-xs uppercase tracking-widest text-white font-bold">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-[#0e1017] text-white border-2 border-white"
              />
            </div>
            <div className="flex flex-col gap-1.5 font-mono">
              <label className="text-xs uppercase tracking-widest text-white font-bold">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-[#0e1017] text-white border-2 border-white"
              />
            </div>
          </div>

          {startDate && endDate && (
            <div className="p-4 border-2 border-white bg-[#ffff00] bg-opacity-10 text-xs text-white mb-2 flex flex-col gap-1.5 border-dashed font-mono shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
              <span className="font-bold uppercase tracking-wider text-[10px]">Blueprint Tasks Details</span>
              <p>
                Define the crewmate subtasks below. For each subtask, you must provide:
              </p>
              <ul className="list-disc pl-4 flex flex-col gap-0.5 font-bold">
                <li>Subtask Name (task descriptor).</li>
                <li>Mandatory Start & End Times (time slots).</li>
                <li>Sabotage Penalty (punishment parameter).</li>
              </ul>
            </div>
          )}

          {/* Subtask Template Builder */}
          <div className="border-2 border-white p-5 bg-[#0e1017] brutalist-card flex flex-col gap-4">
            <h4 className="text-sm font-bold border-b-2 border-white pb-2 font-mono">Add tasks template</h4>
            {taskError && <p className="text-xs text-red-500 font-mono font-bold">{taskError}</p>}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Subtask Name (e.g. Swiping Card)"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                className="w-full bg-[#0e1017] border-2 border-white"
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="border-2 border-white focus:ring-0 text-xs bg-[#0e1017] text-white py-1.5 rounded-none font-bold font-mono"
              >
                {['DSA', 'Development', 'College', 'Health', 'Reading', 'Personal', 'Custom'].map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Sabotage Penalty (e.g. Empty Garbage)"
                value={punishment}
                onChange={(e) => setPunishment(e.target.value)}
                className="w-full bg-[#0e1017] border-2 border-white"
              />
              <div className="flex flex-col gap-1 w-full font-mono">
                <label className="text-[10px] uppercase font-bold text-neutral-400">Start Time</label>
                <input
                  ref={startTimeRef}
                  type="time"
                  defaultValue={moment().add(5, 'minutes').format('HH:mm')}
                  className="w-full bg-[#0e1017] border-2 border-white text-white"
                />
              </div>
              <div className="flex flex-col gap-1 w-full font-mono">
                <label className="text-[10px] uppercase font-bold text-neutral-400">End Time</label>
                <input
                  ref={endTimeRef}
                  type="time"
                  defaultValue={moment().add(65, 'minutes').format('HH:mm')}
                  className="w-full bg-[#0e1017] border-2 border-white text-white"
                />
              </div>
              <input
                type="text"
                placeholder="Notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-[#0e1017] border-2 border-white"
              />
              <div className="flex flex-col gap-1 w-full md:col-span-3 mt-1.5">
                <label className="flex items-center gap-2 text-xs cursor-pointer select-none text-white font-bold font-mono">
                  <input
                    type="checkbox"
                    checked={tempTaskApply === 'all'}
                    onChange={(e) => setTempTaskApply(e.target.checked ? 'all' : 'today')}
                    className="w-4 h-4 cursor-pointer accent-white"
                  />
                  <span>Apply task to all days (Default blueprint)</span>
                </label>
                <p className="text-[10px] text-neutral-400 italic mt-0.5 ml-6 font-mono font-bold">
                  Uncheck to apply this task to today only ({moment().format('DD MMM')}).
                </p>
              </div>
            </div>
            
            <div className="flex gap-2 self-end">
              {editingTempIndex !== null && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingTempIndex(null);
                    setTaskName('');
                    setPunishment('');
                    setNotes('');
                    if (startTimeRef.current) startTimeRef.current.value = '';
                    if (endTimeRef.current) endTimeRef.current.value = '';
                    setTaskError('');
                  }}
                  className="btn-red"
                >
                  Cancel Edit
                </button>
              )}
              <button
                type="button"
                onClick={handleAddTempTask}
                className="btn-blue flex items-center justify-center gap-1.5"
              >
                {editingTempIndex !== null ? <Save size={12} /> : <Plus size={12} />}
                <span>{editingTempIndex !== null ? 'Update tasks blueprint' : 'Add tasks blueprint'}</span>
              </button>
            </div>

            {/* List of currently added task templates in build list */}
            <div className="mt-4 border-t-2 border-white pt-4">
              <span className="text-[10px] uppercase font-mono text-neutral-400 block mb-2 font-bold">Tasks List ({defaultSchedule.length} tasks)</span>
              {defaultSchedule.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {defaultSchedule.map((t, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => {
                        setEditingTempIndex(idx);
                        setTaskName(t.name);
                        setCategory(t.category);
                        setPunishment(t.punishment);
                        setNotes(t.notes || '');
                        setTempTaskApply(t.applyTo || 'all');
                        if (startTimeRef.current) startTimeRef.current.value = t.startTime;
                        if (endTimeRef.current) endTimeRef.current.value = t.endTime;
                      }}
                      className={`flex items-center justify-between p-3 border-2 cursor-pointer transition-all duration-100 font-mono text-xs ${
                        editingTempIndex === idx 
                          ? 'border-yellow-400 bg-yellow-400 bg-opacity-10' 
                          : 'border-white bg-[#0e1017] hover:border-yellow-400 hover:bg-neutral-900'
                      }`}
                    >
                      <div className="flex-1">
                        <strong>{t.name}</strong> <span className="text-neutral-400">({t.category})</span>
                        {t.applyTo === 'today' ? (
                          <span className="ml-2 text-[9px] px-1.5 py-0.5 bg-[#ff0000] text-white border border-white font-mono uppercase font-bold shadow-[1px_1px_0px_0px_rgba(255,255,255,1)]">Today Only</span>
                        ) : (
                          <span className="ml-2 text-[9px] px-1.5 py-0.5 bg-neutral-700 text-white border border-white font-mono uppercase font-bold shadow-[1px_1px_0px_0px_rgba(255,255,255,1)]">All Days</span>
                        )}
                        <div className="text-[10px] text-neutral-400 mt-0.5">
                          {t.startTime} - {t.endTime} | Penalty: {t.punishment}
                        </div>
                        {t.notes && <div className="text-[9px] text-neutral-500 italic mt-0.5">Notes: {t.notes}</div>}
                      </div>
                      <button 
                        type="button" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveTempTask(idx);
                        }} 
                        className="text-red-500 hover:bg-neutral-900 p-1 border-2 border-transparent hover:border-white"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-neutral-500 italic py-4 text-center border-2 border-dashed border-neutral-600 font-mono font-bold">
                  No tasks blueprint formulated yet. Fill out the fields above.
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="btn-green self-end"
          >
            Save Blueprint
          </button>
        </form>
      )}

      {/* 2. OVERRIDE EDITOR FORM */}
      {showOverrideForm && selectedTimetable && (
        <div className="p-6 border-2 border-white bg-[#0e1017] brutalist-card flex flex-col gap-6 animate-fade-in">
          <div className="flex items-center justify-between border-b-2 border-white pb-2 font-mono">
            <h3 className="text-lg font-bold">Date Overrides: {selectedTimetable.name}</h3>
            <button onClick={() => { setShowOverrideForm(false); setSelectedTimetable(null); }} className="text-white hover:bg-neutral-900 p-1">
              <X size={18} />
            </button>
          </div>

          {overrideError && (
            <p className="text-xs text-red-500 font-mono font-bold">{overrideError}</p>
          )}

          <div className="flex flex-col lg:flex-row gap-6 items-center lg:items-start">
            <div className="flex flex-col gap-2 w-full lg:w-auto font-mono items-center lg:items-start">
              <label className="text-xs uppercase tracking-widest text-white font-bold">Select Date via Calendar</label>
              <TimetableCalendar 
                timetable={selectedTimetable}
                selectedDate={overrideDate}
                onSelectDate={handleSelectCalendarDate}
              />
            </div>

            <div className="flex-1 w-full">
              {overrideDate ? (
                <div className="border-2 border-white p-5 bg-[#0e1017] brutalist-card flex flex-col gap-4">
                  <h4 className="text-sm font-bold border-b-2 border-white pb-1.5 font-mono">
                    Tasks for {overrideDate} ({overrideTasks.length} tasks)
                  </h4>
                  
                  {/* Add task builder just for overrides */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="Override Task Name"
                      value={taskName}
                      onChange={(e) => setTaskName(e.target.value)}
                      className="w-full bg-[#0e1017] border-2 border-white text-white"
                    />
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="border-2 border-white text-xs bg-[#0e1017] text-white py-1 rounded-none font-bold font-mono"
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
                      className="w-full bg-[#0e1017] border-2 border-white text-white"
                    />
                    <div className="flex flex-col gap-1 w-full font-mono">
                      <label className="text-[9px] uppercase font-bold text-neutral-400">Start Time</label>
                      <input
                        ref={overrideStartTimeRef}
                        type="time"
                        defaultValue={moment().add(5, 'minutes').format('HH:mm')}
                        className="w-full bg-[#0e1017] border-2 border-white text-white"
                      />
                    </div>
                    <div className="flex flex-col gap-1 w-full font-mono">
                      <label className="text-[9px] uppercase font-bold text-neutral-400">End Time</label>
                      <input
                        ref={overrideEndTimeRef}
                        type="time"
                        defaultValue={moment().add(65, 'minutes').format('HH:mm')}
                        className="w-full bg-[#0e1017] border-2 border-white text-white"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Notes (optional)"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-[#0e1017] border-2 border-white text-white"
                    />
                  </div>

                  <div className="flex gap-2 self-end">
                    {editingOverrideIndex !== null && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingOverrideIndex(null);
                          setTaskName('');
                          setPunishment('');
                          setNotes('');
                          if (overrideStartTimeRef.current) overrideStartTimeRef.current.value = '';
                          if (overrideEndTimeRef.current) overrideEndTimeRef.current.value = '';
                          setOverrideError('');
                        }}
                        className="btn-red"
                      >
                        Cancel Edit
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleAddOverrideTask}
                      className="btn-blue flex items-center justify-center gap-1.5"
                    >
                      {editingOverrideIndex !== null ? <Save size={12} /> : <Plus size={12} />}
                      <span>{editingOverrideIndex !== null ? 'Update Task Override' : 'Add / Replace Task Override'}</span>
                    </button>
                  </div>

                  {/* Tasks List */}
                  <div className="flex flex-col gap-2 mt-2">
                    {overrideTasks.length > 0 ? (
                      overrideTasks.map((t, idx) => (
                        <div 
                          key={idx} 
                          onClick={() => {
                            setEditingOverrideIndex(idx);
                            setTaskName(t.name);
                            setCategory(t.category);
                            setPunishment(t.punishment);
                            setNotes(t.notes || '');
                            if (overrideStartTimeRef.current) overrideStartTimeRef.current.value = t.startTime;
                            if (overrideEndTimeRef.current) overrideEndTimeRef.current.value = t.endTime;
                          }}
                          className={`flex items-center justify-between p-3 border-2 cursor-pointer transition-all duration-100 font-mono text-xs ${
                            editingOverrideIndex === idx 
                              ? 'border-yellow-400 bg-yellow-400 bg-opacity-10' 
                              : 'border-white bg-[#0e1017] hover:border-yellow-400 hover:bg-neutral-900'
                          }`}
                        >
                          <div className="flex-1">
                            <strong>{t.name}</strong> <span className="text-neutral-400">({t.category})</span>
                            <div className="text-[10px] text-neutral-400 mt-0.5">{t.startTime} - {t.endTime} | Penalty: {t.punishment}</div>
                            {t.notes && <div className="text-[9px] text-neutral-500 italic mt-0.5">Notes: {t.notes}</div>}
                          </div>
                          <button 
                            type="button" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveOverrideTask(idx);
                            }} 
                            className="text-red-500 hover:bg-neutral-900 p-1 border-2 border-transparent hover:border-white"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-neutral-500 italic text-center py-4 font-mono font-bold">No tasks active. Today is neutral rest.</p>
                    )}
                  </div>

                  {/* Scope Selection */}
                  <div className="flex flex-col gap-2 mt-4 p-4 border-2 border-white bg-[#0e1017] font-mono">
                    <label className="flex items-center gap-2 text-xs cursor-pointer select-none text-white font-bold">
                      <input
                        type="checkbox"
                        checked={applyScope === 'all'}
                        onChange={(e) => setApplyScope(e.target.checked ? 'all' : 'single')}
                        className="w-4 h-4 cursor-pointer accent-white"
                      />
                      <span>Apply changes to all days of schedule (Update Blueprint)</span>
                    </label>
                    <p className="text-[10px] text-neutral-400 italic mt-0.5 ml-6">
                      Uncheck to apply changes only to {overrideDate} (Date Override).
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveOverride}
                    className="btn-green self-end mt-4"
                  >
                    Save Override Settings
                  </button>
                </div>
              ) : (
                <div className="p-8 text-center border-2 border-dashed border-neutral-600 bg-[#0e1017] text-neutral-400 italic text-sm font-mono font-bold">
                  Click on an active date in the calendar to override its schedule.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. LIST OF ALL TIMETABLES */}
      <section className="flex flex-col gap-4">
        <h3 className="text-sm uppercase tracking-wider text-white font-bold font-mono">Active Blueprints</h3>
        {loading ? (
          <div className="text-center py-8 text-sm italic text-neutral-400 font-mono">Loading blueprints...</div>
        ) : timetables.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {timetables.map((t) => {
              const startFormatted = moment(t.startDate).format('DD MMM YYYY');
              const endFormatted = moment(t.endDate).format('DD MMM YYYY');
              return (
                <div key={t._id} className="p-5 border-2 border-white bg-[#0e1017] brutalist-card flex flex-col justify-between gap-4">
                  <div>
                    <h4 className="text-lg font-bold text-white font-mono">{t.name}</h4>
                    <span className="text-[10px] font-mono text-neutral-400 flex items-center gap-1.5 mt-1.5 font-bold">
                      <Calendar size={12} />
                      {startFormatted} — {endFormatted}
                    </span>
                    <p className="text-xs text-neutral-400 mt-3 font-mono">
                      Runs <strong>{t.defaultSchedule.length} default tasks</strong> daily, with <strong>{t.overrides.length} date overrides</strong>.
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t-2 border-white pt-4">
                    <button
                      onClick={() => handleSelectOverrideTimetable(t)}
                      className="btn-blue"
                    >
                      Configure Overrides
                    </button>
                    <button
                      onClick={() => handleDeleteTimetable(t._id)}
                      className="text-red-500 hover:bg-neutral-900 p-1.5 border-2 border-transparent hover:border-white"
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
          <div className="p-8 text-center border-2 border-dashed border-neutral-600 bg-[#0e1017] text-neutral-400 italic text-sm font-mono font-bold">
            No timetables scheduled yet. Click "New blueprint" above to create one.
          </div>
        )}
      </section>
    </div>
  );
};

export default TimetableManager;

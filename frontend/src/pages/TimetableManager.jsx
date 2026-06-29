import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../utils/api.js';
import { 
  Plus, Trash2, Save, AlertCircle 
} from 'lucide-react';
import moment from 'moment';
import { useToast } from '../context/ToastContext.jsx';

const TimetableManager = () => {
  const { showToast } = useToast();
  const [timetables, setTimetables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Timetable Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [isActiveBlueprint, setIsActiveBlueprint] = useState(true);
  const [defaultSchedule, setDefaultSchedule] = useState([]);
  
  // Single task template form state
  const [taskName, setTaskName] = useState('');
  const [category, setCategory] = useState('Custom');
  const [punishment, setPunishment] = useState('');
  const [notes, setNotes] = useState('');
  const [taskError, setTaskError] = useState('');

  // Refs for uncontrolled time inputs
  const startTimeRef = useRef(null);
  const endTimeRef = useRef(null);

  // Task editing state
  const [editingTempIndex, setEditingTempIndex] = useState(null);

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

    // Check if new task overlaps with any existing tasks in defaultSchedule (excluding targetIndex if editing)
    const overlaps = defaultSchedule.some((task, idx) => {
      if (targetIndex !== null && idx === targetIndex) return false;
      return sTime < task.endTime && task.startTime < eTime;
    });
    if (overlaps) {
      setTaskError('Task times overlap with an existing task in this blueprint');
      return;
    }

    // Check if blueprint is active and start time is in the past / too close (at least 3 min offset)
    if (isActiveBlueprint) {
      const todayStr = moment().format('YYYY-MM-DD');
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
    if (!name) {
      setError('Please specify timetable name');
      return;
    }
    if (defaultSchedule.length === 0) {
      setError('You must add at least one task template to the schedule builder.');
      return;
    }

    try {
      setError('');
      await api.post('/timetables', {
        name,
        defaultSchedule,
        isActive: isActiveBlueprint,
      });
      // Reset form
      setName('');
      setDefaultSchedule([]);
      setIsActiveBlueprint(true);
      setShowAddForm(false);
      setEditingTempIndex(null);
      fetchTimetables();
      showToast('Timetable blueprint created successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create timetable.');
    }
  };

  // Activate Timetable
  const handleActivateTimetable = async (id) => {
    try {
      await api.put(`/timetables/${id}`, { isActive: true });
      showToast('Timetable blueprint activated successfully!');
      fetchTimetables();
    } catch (err) {
      showToast(err.response?.data?.message || 'Activation failed', 'error');
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
      showToast('Timetable blueprint deleted successfully.');
    } catch (err) {
      showToast(err.response?.data?.message || 'Delete failed', 'error');
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div className="flex items-center gap-2 font-mono mt-6">
              <label className="flex items-center gap-2 text-xs cursor-pointer select-none text-white font-bold">
                <input
                  type="checkbox"
                  checked={isActiveBlueprint}
                  onChange={(e) => setIsActiveBlueprint(e.target.checked)}
                  className="w-4 h-4 cursor-pointer accent-white"
                />
                <span>Set as current active schedule</span>
              </label>
            </div>
          </div>

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

      {/* 2. LIST OF ALL TIMETABLES */}
      <section className="flex flex-col gap-4">
        <h3 className="text-sm uppercase tracking-wider text-white font-bold font-mono">Active Blueprints</h3>
        {loading ? (
          <div className="text-center py-8 text-sm italic text-neutral-400 font-mono">Loading blueprints...</div>
        ) : timetables.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {timetables.map((t) => {
              return (
                <div key={t._id} className={`p-5 border-2 bg-[#0e1017] brutalist-card flex flex-col justify-between gap-4 ${t.isActive ? 'border-green-400' : 'border-white'}`}>
                  <div>
                    <div className="flex justify-between items-start">
                      <h4 className="text-lg font-bold text-white font-mono">{t.name}</h4>
                      <span className={`text-[10px] uppercase font-mono px-2 py-0.5 border font-bold shadow-[1px_1px_0px_0px_rgba(255,255,255,1)] ${t.isActive ? 'bg-green-400 text-black border-black' : 'bg-neutral-700 text-white border-white'}`}>
                        {t.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 mt-4 font-mono">
                      Runs <strong>{t.defaultSchedule.length} default tasks</strong> daily.
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t-2 border-white pt-4">
                    {!t.isActive ? (
                      <button
                        onClick={() => handleActivateTimetable(t._id)}
                        className="btn-blue"
                      >
                        Activate Blueprint
                      </button>
                    ) : (
                      <span className="text-xs uppercase font-bold text-green-400 font-mono">
                        Active Schedule
                      </span>
                    )}
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

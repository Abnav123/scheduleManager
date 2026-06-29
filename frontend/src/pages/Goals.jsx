import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../utils/api.js';
import { 
  Trophy, Target, Award, 
  Lock, CheckCircle2, AlertTriangle 
} from 'lucide-react';
import moment from 'moment';
import { useToast } from '../context/ToastContext.jsx';

const Goals = () => {
  const { showToast } = useToast();
  const [goals, setGoals] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Goals Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [type, setType] = useState('FocusHours');
  const [category, setCategory] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [formError, setFormError] = useState('');

  // Fetch Goals & Achievements
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const goalsRes = await api.get('/goals');
      setGoals(goalsRes.data);

      const achRes = await api.get('/stats/achievements');
      setAchievements(achRes.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch goals and achievements.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Create Goal
  const handleCreateGoal = async (e) => {
    e.preventDefault();
    if (!name || !targetValue || !startDate || !endDate) {
      setFormError('Please fill in name, target value, start date and end date.');
      return;
    }

    try {
      setFormError('');
      await api.post('/goals', {
        name,
        targetValue: Number(targetValue),
        type,
        category: category || null,
        startDate,
        endDate,
      });

      // Reset
      setName('');
      setTargetValue('');
      setType('FocusHours');
      setCategory('');
      setStartDate('');
      setEndDate('');
      setShowAddForm(false);
      showToast('Goal formulated successfully');
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create goal.');
    }
  };

  // Delete Goal
  const handleDeleteGoal = async (id) => {
    if (!window.confirm('Are you sure you want to remove this goal?')) {
      return;
    }
    try {
      await api.delete(`/goals/${id}`);
      showToast('Goal removed successfully');
      fetchData();
    } catch {
      showToast('Delete failed', 'error');
    }
  };

  // Split active / historical goals
  const activeGoals = useMemo(() => goals.filter((g) => g.status === 'Active'), [goals]);
  const completedGoals = useMemo(() => goals.filter((g) => g.status === 'Completed'), [goals]);
  const failedGoals = useMemo(() => goals.filter((g) => g.status === 'Failed'), [goals]);

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto text-white">
      {/* Page Header */}
      <section className="flex flex-col sm:flex-row items-center justify-between border-b-2 border-white pb-4 gap-4">
        <div>
          <p className="text-xs text-neutral-400 uppercase tracking-wider font-mono font-bold">Discipline Milestones</p>
          <h2 className="text-2xl font-bold font-mono">Goals and Medals</h2>
        </div>
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            setFormError('');
          }}
          className={showAddForm ? 'btn-red' : 'btn-blue'}
        >
          {showAddForm ? 'Cancel Creation' : 'New Goal'}
        </button>
      </section>

      {error && (
        <div className="p-4 border-2 border-white bg-[#ff0000] text-white text-xs font-mono font-bold shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
          {error}
        </div>
      )}

      {/* 1. ADD GOAL FORM */}
      {showAddForm && (
        <form onSubmit={handleCreateGoal} className="p-6 border-2 border-white bg-[#0e1017] brutalist-card flex flex-col gap-6 animate-fade-in">
          <h3 className="text-lg font-bold border-b-2 border-white pb-2 font-mono">Formulate Goal</h3>
          
          {formError && (
            <p className="text-xs text-red-500 font-mono font-bold">{formError}</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5 col-span-2 font-mono">
              <label className="text-xs uppercase tracking-widest text-white font-bold">Goal Name (e.g. Study 300 hours)</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Solve 50 Graph Problems"
                className="w-full bg-[#0e1017] text-white border-2 border-white"
              />
            </div>
            
            <div className="flex flex-col gap-1.5 font-mono">
              <label className="text-xs uppercase tracking-widest text-white font-bold">Target Quantity</label>
              <input
                type="number"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder="e.g. 50"
                className="w-full bg-[#0e1017] text-white border-2 border-white"
              />
            </div>

            <div className="flex flex-col gap-1.5 font-mono">
              <label className="text-xs uppercase tracking-widest text-white font-bold">Goal Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="border-2 border-white focus:ring-0 text-sm bg-[#0e1017] text-white py-1.5 rounded-none font-bold font-mono"
              >
                <option value="FocusHours">Focus Hours ⏱</option>
                <option value="TasksCompleted">Completed Tasks Count ⚔</option>
                <option value="Custom">Custom Target 🌟</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5 font-mono">
              <label className="text-xs uppercase tracking-widest text-white font-bold">Filter Category (optional)</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="border-2 border-white focus:ring-0 text-sm bg-[#0e1017] text-white py-1.5 rounded-none font-bold font-mono"
              >
                <option value="">No Filter (All Categories)</option>
                {['DSA', 'Development', 'College', 'Health', 'Reading', 'Personal', 'Custom'].map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
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

          <button
            type="submit"
            className="btn-green self-end"
          >
            Formulate Goal
          </button>
        </form>
      )}

      {/* Grid: Left column Goals, Right Column Achievements */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Goals Management list */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Active Goals block */}
          <div>
            <h3 className="text-sm uppercase tracking-wider text-white font-bold border-b-2 border-white pb-2 mb-4 flex items-center gap-2 font-mono">
              <Target size={16} />
              Active Goals
            </h3>
            
            {loading ? (
              <div className="text-xs italic text-neutral-400 font-mono py-4">Reading active goals...</div>
            ) : activeGoals.length > 0 ? (
              <div className="flex flex-col gap-4">
                {activeGoals.map((goal) => {
                  const percent = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
                  return (
                    <div key={goal._id} className="p-4 border-2 border-white bg-[#0e1017] brutalist-card">
                      <div className="flex justify-between items-start mb-2 gap-4">
                        <div>
                          <h4 className="text-sm font-bold text-white font-mono">{goal.name}</h4>
                          <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-wider font-bold">
                            Type: {goal.type} {goal.category ? `| ${goal.category}` : ''}
                          </span>
                        </div>
                        <button 
                          onClick={() => handleDeleteGoal(goal._id)} 
                          className="btn-red text-[10px] px-2 py-1"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-full bg-neutral-800 border border-white h-3 overflow-hidden">
                          <div className="bg-[#ffff00] h-full" style={{ width: `${percent}%` }}></div>
                        </div>
                        <span className="font-mono text-xs text-white font-bold whitespace-nowrap">
                          {goal.currentValue} / {goal.targetValue} ({percent}%)
                        </span>
                      </div>
                      
                      <div className="text-[10px] text-neutral-400 font-mono mt-3 flex justify-between font-bold">
                        <span>Started: {moment(goal.startDate).format('DD MMM YYYY')}</span>
                        <span>Deadline: {moment(goal.endDate).format('DD MMM YYYY')}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-neutral-500 italic py-4 font-mono font-bold">No active discipline goals. Click "New Goal" above.</p>
            )}
          </div>

          {/* Completed Goals block */}
          {completedGoals.length > 0 && (
            <div>
              <h3 className="text-sm uppercase tracking-wider text-white font-bold border-b-2 border-white pb-2 mb-4 flex items-center gap-2 font-mono">
                <CheckCircle2 size={16} />
                Completed Goals
              </h3>
              <div className="flex flex-col gap-3">
                {completedGoals.map((goal) => (
                  <div key={goal._id} className="p-3 border-2 border-white bg-[#0e1017] text-xs flex justify-between items-center shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
                    <div className="font-mono">
                      <h4 className="font-bold text-white">{goal.name}</h4>
                      <span className="text-[9px] text-neutral-400 uppercase font-mono font-bold">
                        Target: {goal.targetValue} | Finished on {moment(goal.updatedAt).format('DD MMM YYYY')}
                      </span>
                    </div>
                    <span className="bg-[#008000] text-white border border-white px-2 py-0.5 font-bold font-mono text-[9px] uppercase tracking-wider shadow-[1px_1px_0px_0px_rgba(255,255,255,1)]">Completed</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Failed Goals block */}
          {failedGoals.length > 0 && (
            <div>
              <h3 className="text-sm uppercase tracking-wider text-white font-bold border-b-2 border-white pb-2 mb-4 flex items-center gap-2 font-mono">
                <AlertTriangle size={16} />
                Sabotaged Goals
              </h3>
              <div className="flex flex-col gap-3">
                {failedGoals.map((goal) => (
                  <div key={goal._id} className="p-3 border-2 border-white bg-[#0e1017] text-xs flex justify-between items-center shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
                    <div className="font-mono">
                      <h4 className="font-semibold text-neutral-400">{goal.name}</h4>
                      <span className="text-[9px] text-neutral-400 uppercase font-mono font-bold">
                        Progress: {goal.currentValue}/{goal.targetValue} | Expired {moment(goal.endDate).format('DD MMM YYYY')}
                      </span>
                    </div>
                    <span className="bg-[#ff0000] text-white border border-white px-2 py-0.5 font-bold font-mono text-[9px] uppercase tracking-wider shadow-[1px_1px_0px_0px_rgba(255,255,255,1)]">Sabotaged</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Achievements medals */}
        <div className="flex flex-col gap-6 font-mono">
          <h3 className="text-sm uppercase tracking-wider text-white font-bold border-b-2 border-white pb-2 flex items-center gap-2">
            <Award size={16} />
            Unlocked Medals
          </h3>

          <div className="flex flex-col gap-4">
            {achievements.length > 0 ? (
              achievements.map((ach) => {
                const isUnlocked = ach.unlockedAt !== null;
                return (
                  <div 
                    key={ach._id} 
                    className={`p-4 border-2 flex items-center gap-4 transition-all duration-200 ${
                      isUnlocked 
                        ? 'border-white bg-[#0e1017] shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]' 
                        : 'border-neutral-700 bg-[#0e1017] opacity-40'
                    }`}
                  >
                    <div className={`p-2.5 rounded-none border-2 ${
                      isUnlocked 
                        ? 'border-white bg-[#ffff00] text-black font-bold shadow-[1px_1px_0px_0px_rgba(255,255,255,1)]' 
                        : 'border-neutral-700 text-neutral-500 bg-transparent'
                    }`}>
                      {isUnlocked ? <Trophy size={20} /> : <Lock size={20} />}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-sm font-bold truncate ${isUnlocked ? 'text-white font-bold' : 'text-neutral-500'}`}>
                        {ach.name}
                      </h4>
                      <p className="text-[10px] text-neutral-400 font-mono leading-tight mt-0.5">
                        {ach.description}
                      </p>
                      {isUnlocked && (
                        <span className="text-[8px] font-mono text-green-400 uppercase font-bold mt-1 block">
                          Unlocked: {moment(ach.unlockedAt).format('DD MMM YYYY')}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-xs text-neutral-500 italic text-center py-4">No medals loaded.</div>
            )}
          </div>
        </div>

      </section>
    </div>
  );
};

export default Goals;

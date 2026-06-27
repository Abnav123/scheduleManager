import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../utils/api.js';
import { 
  Trophy, Plus, Calendar, Target, Award, 
  Lock, CheckCircle2, AlertTriangle, X 
} from 'lucide-react';
import moment from 'moment';

const Goals = () => {
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
      fetchData();
    } catch (err) {
      alert('Delete failed');
    }
  };

  // Split active / historical goals
  const activeGoals = useMemo(() => goals.filter((g) => g.status === 'Active'), [goals]);
  const completedGoals = useMemo(() => goals.filter((g) => g.status === 'Completed'), [goals]);
  const failedGoals = useMemo(() => goals.filter((g) => g.status === 'Failed'), [goals]);

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto">
      {/* Page Header */}
      <section className="flex flex-col sm:flex-row items-center justify-between border-b border-vagabond-slate pb-4 gap-4">
        <div>
          <p className="text-xs text-vagabond-brown uppercase tracking-wider font-mono">Discipline Milestones</p>
          <h2 className="text-2xl font-serif font-bold text-vagabond-gold">Goals and Calligraphy Medals</h2>
        </div>
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            setFormError('');
          }}
          className="flex items-center gap-2 px-4 py-2 border border-vagabond-gold rounded text-xs uppercase tracking-widest font-bold hover:bg-vagabond-gold hover:text-black font-serif transition-all duration-300 shadow-gold-glow"
        >
          {showAddForm ? <X size={14} /> : <Plus size={14} />}
          <span>{showAddForm ? 'Cancel Creation' : 'New Goal'}</span>
        </button>
      </section>

      {error && (
        <div className="p-4 border border-vagabond-red bg-vagabond-red bg-opacity-10 rounded text-xs text-vagabond-red font-serif">
          {error}
        </div>
      )}

      {/* 1. ADD GOAL FORM */}
      {showAddForm && (
        <form onSubmit={handleCreateGoal} className="p-6 border border-vagabond-slate rounded-lg bg-vagabond-charcoal flex flex-col gap-6 animate-fade-in">
          <h3 className="font-serif text-lg text-vagabond-gold border-b border-vagabond-slate pb-2">Draft Goal Intent</h3>
          
          {formError && (
            <p className="text-xs text-vagabond-red font-serif">{formError}</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5 col-span-2">
              <label className="text-xs font-serif uppercase tracking-widest text-vagabond-brown">Goal Name (e.g. Study 300 hours)</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Solve 50 Graph Problems"
                className="px-3 py-2 rounded border border-vagabond-slate bg-vagabond-dark text-sm text-vagabond-parchment focus:outline-none focus:border-vagabond-gold"
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-serif uppercase tracking-widest text-vagabond-brown">Target Quantity</label>
              <input
                type="number"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder="e.g. 50"
                className="px-3 py-2 rounded border border-vagabond-slate bg-vagabond-dark text-sm text-vagabond-parchment focus:outline-none focus:border-vagabond-gold"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-serif uppercase tracking-widest text-vagabond-brown">Goal Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="px-3 py-2 rounded border border-vagabond-slate bg-vagabond-dark text-sm text-vagabond-parchment focus:outline-none focus:border-vagabond-gold"
              >
                <option value="FocusHours">Focus Hours ⏱</option>
                <option value="TasksCompleted">Completed Tasks Count ⚔</option>
                <option value="Custom">Custom Target 🌟</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-serif uppercase tracking-widest text-vagabond-brown">Filter Category (optional)</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="px-3 py-2 rounded border border-vagabond-slate bg-vagabond-dark text-sm text-vagabond-parchment focus:outline-none focus:border-vagabond-gold"
              >
                <option value="">No Filter (All Categories)</option>
                {['DSA', 'Development', 'College', 'Health', 'Reading', 'Personal', 'Custom'].map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-serif uppercase tracking-widest text-vagabond-brown">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 rounded border border-vagabond-slate bg-vagabond-dark text-sm text-vagabond-parchment focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-serif uppercase tracking-widest text-vagabond-brown">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 rounded border border-vagabond-slate bg-vagabond-dark text-sm text-vagabond-parchment focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="self-end px-6 py-2.5 bg-[#1a1a1a] hover:bg-vagabond-gold hover:text-black text-white font-serif uppercase tracking-widest text-xs rounded font-bold transition-all duration-300 border border-vagabond-gold shadow-zen"
          >
            Formulate Intent
          </button>
        </form>
      )}

      {/* Grid: Left column Goals, Right Column Achievements */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Goals Management list */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Active Goals block */}
          <div>
            <h3 className="font-serif text-sm uppercase tracking-wider text-vagabond-gold border-b border-vagabond-slate pb-2 mb-4 flex items-center gap-2">
              <Target size={16} />
              Active Goals
            </h3>
            
            {loading ? (
              <div className="text-xs italic text-vagabond-brown font-serif py-4">Reading active scrolls...</div>
            ) : activeGoals.length > 0 ? (
              <div className="flex flex-col gap-4">
                {activeGoals.map((goal) => {
                  const percent = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
                  return (
                    <div key={goal._id} className="p-4 border border-vagabond-slate rounded bg-vagabond-charcoal shadow-zen">
                      <div className="flex justify-between items-start mb-2 gap-4">
                        <div>
                          <h4 className="font-serif text-sm font-semibold">{goal.name}</h4>
                          <span className="text-[9px] font-mono text-vagabond-brown uppercase tracking-wider">
                            Type: {goal.type} {goal.category ? `| ${goal.category}` : ''}
                          </span>
                        </div>
                        <button onClick={() => handleDeleteGoal(goal._id)} className="text-vagabond-red hover:text-red-400 p-1 text-xs">
                          Remove
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-full bg-vagabond-slate h-1.5 rounded-full overflow-hidden">
                          <div className="bg-vagabond-gold h-full rounded-full" style={{ width: `${percent}%` }}></div>
                        </div>
                        <span className="font-mono text-xs text-vagabond-gold whitespace-nowrap">
                          {goal.currentValue} / {goal.targetValue} ({percent}%)
                        </span>
                      </div>
                      
                      <div className="text-[10px] text-vagabond-brown font-mono mt-3 flex justify-between">
                        <span>Started: {moment(goal.startDate).format('DD MMM YYYY')}</span>
                        <span>Deadline: {moment(goal.endDate).format('DD MMM YYYY')}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-vagabond-brown italic font-serif py-4">No active discipline goals. Click "New Goal" above to create one.</p>
            )}
          </div>

          {/* Completed Goals block */}
          {completedGoals.length > 0 && (
            <div>
              <h3 className="font-serif text-sm uppercase tracking-wider text-vagabond-green border-b border-vagabond-slate pb-2 mb-4 flex items-center gap-2">
                <CheckCircle2 size={16} />
                Completed Goals
              </h3>
              <div className="flex flex-col gap-3">
                {completedGoals.map((goal) => (
                  <div key={goal._id} className="p-3 border border-vagabond-green border-opacity-30 rounded bg-vagabond-charcoal bg-opacity-40 text-xs flex justify-between items-center">
                    <div>
                      <h4 className="font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-vagabond-parchment">{goal.name}</h4>
                      <span className="text-[9px] text-vagabond-brown uppercase tracking-wider font-mono">
                        Target: {goal.targetValue} | Finished on {moment(goal.updatedAt).format('DD MMM YYYY')}
                      </span>
                    </div>
                    <span className="font-serif text-[10px] uppercase font-bold text-vagabond-green tracking-wider">Completed</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Failed Goals block */}
          {failedGoals.length > 0 && (
            <div>
              <h3 className="font-serif text-sm uppercase tracking-wider text-vagabond-red border-b border-vagabond-slate pb-2 mb-4 flex items-center gap-2">
                <AlertTriangle size={16} />
                Failed Goals
              </h3>
              <div className="flex flex-col gap-3">
                {failedGoals.map((goal) => (
                  <div key={goal._id} className="p-3 border border-vagabond-red border-opacity-20 rounded bg-vagabond-charcoal bg-opacity-20 text-xs flex justify-between items-center text-opacity-80">
                    <div>
                      <h4 className="font-serif font-semibold text-gray-400">{goal.name}</h4>
                      <span className="text-[9px] text-vagabond-brown uppercase font-mono">
                        Progress: {goal.currentValue}/{goal.targetValue} | Expired {moment(goal.endDate).format('DD MMM YYYY')}
                      </span>
                    </div>
                    <span className="font-serif text-[10px] uppercase font-bold text-vagabond-red tracking-wider">Failed</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Achievements golden medals scroll */}
        <div className="flex flex-col gap-6">
          <h3 className="font-serif text-sm uppercase tracking-wider text-vagabond-gold border-b border-vagabond-slate pb-2 flex items-center gap-2">
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
                    className={`p-4 border rounded-lg shadow-zen flex items-center gap-4 transition-all duration-300 ${
                      isUnlocked 
                        ? 'border-vagabond-gold bg-vagabond-charcoal border-opacity-70 scale-[1.01]' 
                        : 'border-vagabond-slate bg-vagabond-dark opacity-45'
                    }`}
                  >
                    <div className={`p-2.5 rounded-full border ${
                      isUnlocked 
                        ? 'border-vagabond-gold bg-vagabond-gold bg-opacity-5 text-vagabond-gold shadow-gold-glow' 
                        : 'border-gray-800 text-gray-700 bg-transparent'
                    }`}>
                      {isUnlocked ? <Trophy size={20} /> : <Lock size={20} />}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-serif text-sm font-bold truncate ${isUnlocked ? 'text-vagabond-gold' : 'text-gray-500'}`}>
                        {ach.name}
                      </h4>
                      <p className="text-[10px] text-vagabond-brown leading-tight mt-0.5">
                        {ach.description}
                      </p>
                      {isUnlocked && (
                        <span className="text-[8px] font-mono text-vagabond-green uppercase font-semibold mt-1 block">
                          Unlocked: {moment(ach.unlockedAt).format('DD MMM YYYY')}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-xs text-vagabond-brown italic font-serif text-center py-4">No achievements loaded.</div>
            )}
          </div>
        </div>

      </section>
    </div>
  );
};

export default Goals;

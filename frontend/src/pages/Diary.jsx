import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../utils/api.js';
import { BookOpen, Smile, Tag, FileText, CheckCircle, Clock } from 'lucide-react';
import { getTodayIST } from '../utils/dateHelper.js';

const Diary = () => {
  const [activeTab, setActiveTab] = useState('diary'); // 'diary' or 'reflection'
  const [date, setDate] = useState(getTodayIST());
  
  // Diary State
  const [diaryTitle, setDiaryTitle] = useState('');
  const [diaryContent, setDiaryContent] = useState('');
  const [diaryMood, setDiaryMood] = useState('');
  const [diaryTags, setDiaryTags] = useState('');
  
  // Reflection State
  const [reflectionMood, setReflectionMood] = useState('Good');
  const [reflectionNotes, setReflectionNotes] = useState('');
  
  // UI states
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Load diary and reflection for the selected date
  const loadDateData = useCallback(async (targetDate) => {
    try {
      setLoading(true);
      setMessage('');
      
      // Fetch diary
      const diaryRes = await api.get(`/diary?date=${targetDate}`);
      if (diaryRes.data) {
        setDiaryTitle(diaryRes.data.title || '');
        setDiaryContent(diaryRes.data.content || '');
        setDiaryMood(diaryRes.data.mood || '');
        setDiaryTags(diaryRes.data.tags?.join(', ') || '');
      } else {
        setDiaryTitle('');
        setDiaryContent('');
        setDiaryMood('');
        setDiaryTags('');
      }

      // Fetch reflection
      const reflectionRes = await api.get(`/reflection?date=${targetDate}`);
      if (reflectionRes.data) {
        setReflectionMood(reflectionRes.data.mood || 'Good');
        setReflectionNotes(reflectionRes.data.reflectionNotes || '');
      } else {
        setReflectionMood('Good');
        setReflectionNotes('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDateData(date);
  }, [date, loadDateData]);

  // Handle Save Diary
  const handleSaveDiary = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const tagsArray = diaryTags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const res = await api.post('/diary', {
        date,
        title: diaryTitle,
        content: diaryContent,
        mood: diaryMood,
        tags: tagsArray,
      });

      if (res.data?.cleared) {
        setMessage('✓ Journal entry cleared.');
        setDiaryTitle('');
        setDiaryContent('');
        setDiaryMood('');
        setDiaryTags('');
      } else {
        setMessage('✓ Journal entry saved.');
      }
    } catch (err) {
      setMessage('❌ Failed to save journal.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Clear/Delete Diary directly
  const handleClearDiary = async () => {
    if (!window.confirm('Are you sure you want to clear/delete this journal entry?')) {
      return;
    }
    try {
      setLoading(true);
      await api.post('/diary', {
        date,
        content: '',
      });
      setDiaryTitle('');
      setDiaryContent('');
      setDiaryMood('');
      setDiaryTags('');
      setMessage('✓ Journal entry cleared.');
    } catch (err) {
      setMessage('❌ Failed to clear journal.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Save Reflection
  const handleSaveReflection = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.post('/reflection', {
        date,
        mood: reflectionMood,
        reflectionNotes,
      });

      if (res.data?.cleared) {
        setMessage('✓ Daily reflection cleared.');
        setReflectionMood('Good');
        setReflectionNotes('');
      } else {
        setMessage('✓ Daily reflection saved.');
      }
    } catch (err) {
      setMessage('❌ Failed to save reflection.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Clear/Delete Reflection directly
  const handleClearReflection = async () => {
    if (!window.confirm('Are you sure you want to clear/delete today\'s reflection?')) {
      return;
    }
    try {
      setLoading(true);
      await api.post('/reflection', {
        date,
        reflectionNotes: '',
      });
      setReflectionMood('Good');
      setReflectionNotes('');
      setMessage('✓ Daily reflection cleared.');
    } catch (err) {
      setMessage('❌ Failed to clear reflection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto text-white">
      {/* Date Select Panel */}
      <section className="flex flex-col sm:flex-row items-center justify-between border-b-2 border-white pb-4 gap-4">
        <div>
          <p className="text-xs text-neutral-400 uppercase tracking-wider font-mono font-bold">Writing Chamber</p>
          <h2 className="text-2xl font-bold font-mono">Daily log scroll</h2>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-white" />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="text-center font-bold font-mono bg-[#0e1017] text-white border-2 border-white"
          />
        </div>
      </section>

      {/* Dynamic Notifications */}
      {message && (
        <div className={`p-3 border-2 border-white text-xs font-mono font-bold text-center shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] ${
          message.startsWith('✓') 
            ? 'bg-[#0e1017] text-green-400' 
            : 'bg-[#0e1017] text-red-500'
        }`}>
          {message}
        </div>
      )}

      {/* Tabs Menu */}
      <div className="flex border-b-2 border-white text-sm font-bold">
        <button
          onClick={() => { setActiveTab('diary'); setMessage(''); }}
          className={`flex items-center gap-2 px-6 py-2.5 border-b-4 transition-all ${
            activeTab === 'diary' 
              ? 'border-white text-white font-bold' 
              : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          <BookOpen size={16} />
          <span>Daily Diary</span>
        </button>
        <button
          onClick={() => { setActiveTab('reflection'); setMessage(''); }}
          className={`flex items-center gap-2 px-6 py-2.5 border-b-4 transition-all ${
            activeTab === 'reflection' 
              ? 'border-white text-white font-bold' 
              : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          <FileText size={16} />
          <span>EOD Reflection</span>
        </button>
      </div>

      {loading && (
        <div className="text-center text-xs italic text-neutral-400 font-mono py-6">
          Unrolling scrolls...
        </div>
      )}

      {/* TAB 1: JOURNAL EDITOR */}
      {activeTab === 'diary' && !loading && (
        <form onSubmit={handleSaveDiary} className="p-8 border-2 border-white bg-[#0e1017] brutalist-card flex flex-col gap-5 text-white animate-fade-in">
          <div className="text-center mb-4">
            <h3 className="text-xl font-bold tracking-widest text-white uppercase font-mono">Minimalist Journal</h3>
            <div className="w-16 h-1 bg-white mx-auto mt-1"></div>
          </div>

          {/* Title */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-widest text-white font-bold font-mono">Entry Title (optional)</label>
            <input
              type="text"
              value={diaryTitle}
              onChange={(e) => setDiaryTitle(e.target.value)}
              placeholder="e.g. Realizations of the engine room"
              className="w-full"
            />
          </div>

          {/* Editor block */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-widest text-white font-bold font-mono">Journal Content</label>
            <textarea
              rows={8}
              value={diaryContent}
              onChange={(e) => setDiaryContent(e.target.value)}
              placeholder="Record your thoughts, lessons learned, or anything you wish to remember..."
              className="px-3.5 py-3 border-2 border-white bg-[#0e1017] text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm leading-relaxed rounded-none font-mono"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Mood selector */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-widest text-white font-bold font-mono flex items-center gap-1.5">
                <Smile size={12} />
                Journaling Mood (optional)
              </label>
              <input
                type="text"
                value={diaryMood}
                onChange={(e) => setDiaryMood(e.target.value)}
                placeholder="e.g. Focused, Agitated, Calm"
                className="w-full text-xs"
              />
            </div>
            
            {/* Tags list */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-widest text-white font-bold font-mono flex items-center gap-1.5">
                <Tag size={12} />
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={diaryTags}
                onChange={(e) => setDiaryTags(e.target.value)}
                placeholder="e.g. philosophy, engine-tasks, navigation"
                className="w-full text-xs"
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            {(diaryTitle || diaryContent || diaryMood || diaryTags) && (
              <button
                type="button"
                onClick={handleClearDiary}
                className="btn-red"
              >
                Clear Ink
              </button>
            )}
            <button
              type="submit"
              className="btn-blue"
            >
              Apply Ink
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: REFLECTIONS EDITOR */}
      {activeTab === 'reflection' && !loading && (
        <form onSubmit={handleSaveReflection} className="p-8 border-2 border-white bg-[#0e1017] brutalist-card flex flex-col gap-5 text-white animate-fade-in">
          <div className="text-center mb-4">
            <h3 className="text-xl font-bold tracking-widest text-white uppercase font-mono">End of Day Reflection</h3>
            <div className="w-16 h-1 bg-white mx-auto mt-1"></div>
            <p className="text-[10px] italic mt-1 text-neutral-400 font-mono font-bold">
              Assess today's tasks honestly.
            </p>
          </div>

          {/* Mood Selector Buttons */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase tracking-widest text-white font-bold font-mono text-center">
              State of Mind (Mood Rating)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {['Excellent', 'Good', 'Average', 'Bad'].map((m) => {
                const isSelected = reflectionMood === m;
                const moodColors = {
                  Excellent: 'bg-[#008000] text-white border-2 border-white scale-105 shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]',
                  Good: 'bg-[#0000ff] text-white border-2 border-white scale-105 shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]',
                  Average: 'bg-[#ffff00] text-black border-2 border-white scale-105 shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]',
                  Bad: 'bg-[#ff0000] text-white border-2 border-white scale-105 shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]',
                };
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setReflectionMood(m)}
                    className={`py-3 rounded-none font-bold text-xs uppercase tracking-wider transition-all ${
                      isSelected 
                        ? moodColors[m]
                        : 'border-2 border-neutral-600 hover:border-white text-neutral-400 bg-[#0e1017] font-mono font-bold'
                    }`}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reflections Content */}
          <div className="flex flex-col gap-1 mt-2">
            <label className="text-[10px] uppercase tracking-widest text-white font-bold font-mono">
              Reflection notes
            </label>
            <textarea
              rows={6}
              value={reflectionNotes}
              onChange={(e) => setReflectionNotes(e.target.value)}
              placeholder="What went well today? What did you miss? How will you cultivate discipline tomorrow?"
              className="px-3.5 py-3 border-2 border-white bg-[#0e1017] text-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm leading-relaxed rounded-none font-mono"
            />
          </div>

          <div className="flex gap-3 justify-end">
            {reflectionNotes && (
              <button
                type="button"
                onClick={handleClearReflection}
                className="btn-red"
              >
                Clear Reflection
              </button>
            )}
            <button
              type="submit"
              className="btn-blue"
            >
              Log Reflection
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default Diary;

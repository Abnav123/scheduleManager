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
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      {/* Date Select Panel */}
      <section className="flex flex-col sm:flex-row items-center justify-between border-b border-vagabond-slate pb-4 gap-4">
        <div>
          <p className="text-xs text-vagabond-brown uppercase tracking-wider font-mono">Writing Chamber</p>
          <h2 className="text-2xl font-serif font-bold text-vagabond-gold">Brush & Reflection Scroll</h2>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-vagabond-brown" />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-1.5 border border-vagabond-slate rounded bg-vagabond-dark font-mono text-sm text-vagabond-parchment focus:outline-none focus:border-vagabond-gold text-center"
          />
        </div>
      </section>

      {/* Dynamic Notifications */}
      {message && (
        <div className={`p-3 rounded text-xs font-serif text-center ${
          message.startsWith('✓') 
            ? 'bg-vagabond-green bg-opacity-10 border border-vagabond-green text-[#73af88]' 
            : 'bg-vagabond-red bg-opacity-10 border border-vagabond-red text-vagabond-red'
        }`}>
          {message}
        </div>
      )}

      {/* Tabs Menu */}
      <div className="flex border-b border-vagabond-slate text-sm">
        <button
          onClick={() => { setActiveTab('diary'); setMessage(''); }}
          className={`flex items-center gap-2 px-6 py-2.5 font-serif font-medium border-b-2 transition-colors ${
            activeTab === 'diary' 
              ? 'border-vagabond-gold text-vagabond-gold' 
              : 'border-transparent text-vagabond-parchment text-opacity-60 hover:text-opacity-100'
          }`}
        >
          <BookOpen size={16} />
          <span>Daily Diary</span>
        </button>
        <button
          onClick={() => { setActiveTab('reflection'); setMessage(''); }}
          className={`flex items-center gap-2 px-6 py-2.5 font-serif font-medium border-b-2 transition-colors ${
            activeTab === 'reflection' 
              ? 'border-vagabond-gold text-vagabond-gold' 
              : 'border-transparent text-vagabond-parchment text-opacity-60 hover:text-opacity-100'
          }`}
        >
          <FileText size={16} />
          <span>EOD Reflection</span>
        </button>
      </div>

      {loading && (
        <div className="text-center text-xs italic text-vagabond-brown font-serif py-6">
          Unrolling brush scrolls...
        </div>
      )}

      {/* TAB 1: JOURNAL EDITOR */}
      {activeTab === 'diary' && !loading && (
        <form onSubmit={handleSaveDiary} className="parchment-card p-8 rounded border border-vagabond-slate flex flex-col gap-5 text-white animate-fade-in shadow-zen">
          <div className="text-center mb-4">
            <h3 className="font-serif text-xl font-bold tracking-widest text-white uppercase">Minimalist Journal</h3>
            <div className="w-16 h-0.5 bg-vagabond-slate mx-auto mt-1"></div>
          </div>

          {/* Title */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-serif uppercase tracking-widest text-vagabond-brown font-bold">Entry Title (optional)</label>
            <input
              type="text"
              value={diaryTitle}
              onChange={(e) => setDiaryTitle(e.target.value)}
              placeholder="e.g. Realizations of the sword"
              className="px-3.5 py-2.5 rounded border border-vagabond-slate bg-vagabond-dark text-white focus:outline-none focus:border-vagabond-gold focus:ring-1 focus:ring-vagabond-gold text-sm"
            />
          </div>

          {/* Editor block */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-serif uppercase tracking-widest text-vagabond-brown font-bold">Journal Content</label>
            <textarea
              rows={8}
              value={diaryContent}
              onChange={(e) => setDiaryContent(e.target.value)}
              placeholder="Record your thoughts, lessons learned, or anything you wish to remember..."
              className="px-3.5 py-3 rounded border border-vagabond-slate bg-vagabond-dark text-white focus:outline-none focus:border-vagabond-gold focus:ring-1 focus:ring-vagabond-gold text-sm font-serif leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Mood selector */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-serif uppercase tracking-widest text-vagabond-brown font-bold flex items-center gap-1.5">
                <Smile size={12} />
                Journaling Mood (optional)
              </label>
              <input
                type="text"
                value={diaryMood}
                onChange={(e) => setDiaryMood(e.target.value)}
                placeholder="e.g. Zen, Agitated, Peaceful"
                className="px-3 py-2 rounded border border-vagabond-slate bg-vagabond-dark text-white focus:outline-none focus:border-vagabond-gold text-xs"
              />
            </div>
            
            {/* Tags list */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-serif uppercase tracking-widest text-vagabond-brown font-bold flex items-center gap-1.5">
                <Tag size={12} />
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={diaryTags}
                onChange={(e) => setDiaryTags(e.target.value)}
                placeholder="e.g. philosophy, workout, dsa"
                className="px-3 py-2 rounded border border-vagabond-slate bg-vagabond-dark text-white focus:outline-none focus:border-vagabond-gold text-xs"
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            {(diaryTitle || diaryContent || diaryMood || diaryTags) && (
              <button
                type="button"
                onClick={handleClearDiary}
                className="px-6 py-2.5 border border-vagabond-red text-vagabond-red hover:bg-vagabond-red hover:text-white rounded font-serif uppercase tracking-widest text-xs font-bold transition-all duration-300 shadow-zen"
              >
                Clear Ink
              </button>
            )}
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#1a1a1a] hover:bg-vagabond-gold hover:text-black text-white font-serif uppercase tracking-widest text-xs rounded font-bold transition-all duration-300 shadow-zen"
            >
              Apply Ink
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: REFLECTIONS EDITOR */}
      {activeTab === 'reflection' && !loading && (
        <form onSubmit={handleSaveReflection} className="parchment-card p-8 rounded border border-vagabond-slate flex flex-col gap-5 text-white animate-fade-in shadow-zen">
          <div className="text-center mb-4">
            <h3 className="font-serif text-xl font-bold tracking-widest text-white uppercase">End of Day Reflection</h3>
            <div className="w-16 h-0.5 bg-vagabond-slate mx-auto mt-1"></div>
            <p className="text-[10px] text-opacity-80 italic mt-1 font-serif text-vagabond-brown">
              Assess today's battles honestly.
            </p>
          </div>

          {/* Mood Selector Buttons */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-serif uppercase tracking-widest text-vagabond-brown font-bold text-center">
              State of Mind (Mood Rating)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {['Excellent', 'Good', 'Average', 'Bad'].map((m) => {
                const isSelected = reflectionMood === m;
                const moodColors = {
                  Excellent: 'bg-vagabond-green hover:bg-[#345c42]',
                  Good: 'bg-vagabond-olive hover:bg-[#435239]',
                  Average: 'bg-vagabond-gold hover:bg-[#b08e4f]',
                  Bad: 'bg-vagabond-red hover:bg-[#783434]',
                };
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setReflectionMood(m)}
                    className={`py-3 rounded font-serif text-xs uppercase tracking-wider font-semibold border transition-all duration-300 ${
                      isSelected 
                        ? `${moodColors[m]} text-white border-transparent scale-105 shadow-zen` 
                        : 'border-vagabond-slate hover:border-white text-vagabond-brown bg-transparent'
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
            <label className="text-[10px] font-serif uppercase tracking-widest text-vagabond-brown font-bold">
              Reflection Scroll Notes
            </label>
            <textarea
              rows={6}
              value={reflectionNotes}
              onChange={(e) => setReflectionNotes(e.target.value)}
              placeholder="What went well today? What did you miss? How will you cultivate discipline tomorrow?"
              className="px-3.5 py-3 rounded border border-vagabond-slate bg-vagabond-dark text-white focus:outline-none focus:border-vagabond-gold focus:ring-1 focus:ring-vagabond-gold text-sm font-serif leading-relaxed"
            />
          </div>

          <div className="flex gap-3 justify-end">
            {reflectionNotes && (
              <button
                type="button"
                onClick={handleClearReflection}
                className="px-6 py-2.5 border border-vagabond-red text-vagabond-red hover:bg-vagabond-red hover:text-white rounded font-serif uppercase tracking-widest text-xs font-bold transition-all duration-300 shadow-zen"
              >
                Clear Reflection
              </button>
            )}
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#1a1a1a] hover:bg-vagabond-gold hover:text-black text-white font-serif uppercase tracking-widest text-xs rounded font-bold transition-all duration-300 shadow-zen"
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

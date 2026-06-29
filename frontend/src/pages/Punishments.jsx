import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api.js';
import { ShieldAlert, RefreshCw, CheckCircle, Calendar, Clock } from 'lucide-react';
import moment from 'moment';
import { useToast } from '../context/ToastContext.jsx';

const Punishments = () => {
  const { showToast } = useToast();
  const [punishments, setPunishments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const categoryLabels = {
    DSA: 'DSA ⚔️',
    Development: 'Development 💻',
    College: 'College 🏛️',
    Health: 'Health 🌿',
    Reading: 'Reading 📖',
    Personal: 'Personal 👤',
    Custom: 'Custom ✨',
  };

  const fetchPunishments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/tasks/punishments/pending');
      setPunishments(res.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Could not retrieve pending punishments.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPunishments();
  }, [fetchPunishments]);

  const handleResolvePunishment = async (taskId) => {
    try {
      await api.post(`/tasks/${taskId}/punishment`, { status: 'Completed' });
      showToast('Punishment resolved successfully');
      // Remove or update the resolved task in list
      setPunishments((prev) => prev.filter((p) => p._id !== taskId));
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update punishment.', 'error');
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto text-white font-mono">
      {/* Page Header */}
      <div className="border-b-2 border-white pb-4">
        <h2 className="text-3xl font-bold uppercase tracking-widest text-white flex items-center gap-3">
          <ShieldAlert className="text-red-500" size={32} />
          Sabotage Registry
        </h2>
        <p className="text-xs text-neutral-400 font-bold mt-2">
          Missed tasks create pending punishments. These carry no expiration date and must be completed to restore path discipline.
        </p>
      </div>

      {loading ? (
        <div className="h-[40vh] flex flex-col items-center justify-center gap-4 text-white">
          <RefreshCw className="animate-spin" size={32} />
          <span className="font-bold text-sm">Scanning database for sabotages...</span>
        </div>
      ) : error ? (
        <div className="h-[40vh] flex flex-col items-center justify-center gap-3 text-red-500">
          <ShieldAlert size={48} />
          <h3 className="text-xl font-bold">{error}</h3>
          <button onClick={fetchPunishments} className="mt-2 btn-red">
            Retry Scan
          </button>
        </div>
      ) : punishments.length > 0 ? (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center text-xs text-neutral-400 font-bold border-b border-neutral-800 pb-2">
            <span>UNRESOLVED PUNISHMENTS</span>
            <span>{punishments.length} outstanding sabotages</span>
          </div>

          <div className="flex flex-col gap-4">
            {punishments.map((task) => (
              <div 
                key={task._id} 
                className="p-5 border-2 border-white bg-[#ff0000] bg-opacity-10 text-white shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] transition-all duration-200 hover:translate-x-0.5 hover:translate-y-0.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left Side: Metadata & Content */}
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="text-[10px] uppercase font-bold text-white border border-white bg-[#0e1017] px-1.5 py-0.5 font-mono">
                        {categoryLabels[task.category] || task.category}
                      </span>
                      <span className="text-[10px] font-mono text-neutral-300 font-bold flex items-center gap-1">
                        <Calendar size={12} />
                        {moment(task.date).format('DD MMM YYYY')}
                      </span>
                      <span className="text-[10px] font-mono text-neutral-300 font-bold flex items-center gap-1">
                        <Clock size={12} />
                        {task.startTime} - {task.endTime}
                      </span>
                    </div>

                    <h4 className="text-lg font-bold text-white">
                      {task.name}
                    </h4>

                    <div className="mt-3 p-3 border border-dashed border-red-500 bg-[#0e1017] text-xs font-mono">
                      <span className="text-red-400 font-bold block uppercase tracking-wider text-[10px] mb-1">
                        ACTIVE PUNISHMENT:
                      </span>
                      <strong className="underline text-sm">{task.punishment}</strong>
                    </div>
                  </div>

                  {/* Right Side: Resolve Action */}
                  <div className="flex items-center">
                    <button
                      onClick={() => handleResolvePunishment(task._id)}
                      className="btn-red flex items-center gap-2 text-xs py-2.5 px-4 shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:bg-[#ff3333]"
                    >
                      <CheckCircle size={14} />
                      <span>Mark Done</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-12 text-center border-2 border-dashed border-white bg-[#0e1017] text-neutral-400 max-w-xl mx-auto w-full mt-6">
          <CheckCircle className="text-green-500 mx-auto mb-4" size={48} />
          <p className="font-mono text-sm font-bold text-white uppercase tracking-wider mb-2">No Active Sabotages</p>
          <p className="text-xs text-neutral-400">All systems nominal. You have cleared all pending punishments. Continue maintaining your path.</p>
        </div>
      )}
    </div>
  );
};

export default Punishments;

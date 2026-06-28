import React, { useState, useEffect } from 'react';
import api from '../utils/api.js';
import { FileText, Compass, Sparkles, RefreshCw } from 'lucide-react';

const NotesPlaceholder = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotesPlaceholder = async () => {
      try {
        const res = await api.get('/notes');
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotesPlaceholder();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-xl mx-auto px-6 py-10 relative text-white font-mono">
      {loading ? (
        <div className="flex flex-col items-center gap-3 text-white">
          <RefreshCw className="animate-spin" size={28} />
          <span className="font-mono text-xs font-bold">Scanning shuttle logs...</span>
        </div>
      ) : data ? (
        <div className="w-full p-8 border-2 border-white bg-[#0e1017] brutalist-card text-center relative">
          <div className="p-3.5 border-2 border-white bg-neutral-900 rounded-none inline-block mb-4 text-white shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
            <FileText size={32} />
          </div>

          <h2 className="text-2xl font-bold tracking-widest uppercase mb-1 font-mono">
            Notes Chamber
          </h2>
          <div className="w-16 h-1 bg-white mx-auto mb-4"></div>

          <p className="text-sm italic font-bold max-w-sm mx-auto mb-6 text-neutral-300">
            "{data.message}"
          </p>

          <div className="border-2 border-white bg-[#0e1017] p-5 text-left text-xs shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
            <span className="uppercase font-bold tracking-wider text-[10px] text-white flex items-center gap-1.5 mb-3 border-b-2 border-white pb-1.5">
              <Sparkles size={12} className="text-white" />
              Future Roadmap Features (Version 2.0)
            </span>
            <ul className="flex flex-col gap-2.5 font-mono font-bold">
              {data.plannedFeatures?.map((f, idx) => (
                <li key={idx} className="flex items-start gap-2 text-white">
                  <span>✦</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 text-[9px] uppercase font-mono text-neutral-400 tracking-widest flex items-center justify-center gap-1.5 font-bold">
            <Compass size={10} />
            <span>Reserved for Future Expansion</span>
          </div>
        </div>
      ) : (
        <div className="text-center text-red-500 font-mono font-bold">
          Failed to load placeholder metadata.
        </div>
      )}
    </div>
  );
};

export default NotesPlaceholder;

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
    <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-xl mx-auto px-6 py-10 relative">
      {/* Background Subtle elements */}
      <div className="absolute inset-0 bg-rice-paper opacity-[0.01] pointer-events-none"></div>

      {loading ? (
        <div className="flex flex-col items-center gap-3 text-vagabond-gold">
          <RefreshCw className="animate-spin" size={28} />
          <span className="font-serif italic text-xs">Awaiting calligraphy inks...</span>
        </div>
      ) : data ? (
        <div className="parchment-card w-full p-8 rounded border-2 border-vagabond-brown text-center text-[#1a1a1a] shadow-zen animate-scroll-unfurl relative">
          {/* Scroll roller graphics details */}
          <div className="absolute -top-3 left-12 right-12 h-1.5 bg-[#4a3b2c] rounded-full"></div>
          <div className="absolute -bottom-3 left-12 right-12 h-1.5 bg-[#4a3b2c] rounded-full"></div>
          
          <div className="p-3.5 border border-vagabond-brown bg-opacity-5 bg-black rounded-full inline-block mb-4 text-vagabond-brown">
            <FileText size={32} />
          </div>

          <h2 className="text-2xl font-bold font-serif tracking-widest uppercase mb-1">
            Notes Chamber
          </h2>
          <div className="w-16 h-0.5 bg-vagabond-brown mx-auto mb-4"></div>

          <p className="text-sm font-serif italic font-semibold text-opacity-90 max-w-sm mx-auto mb-6 text-[#4a3b2c]">
            "{data.message}"
          </p>

          <div className="border border-vagabond-parchment-dark bg-white bg-opacity-40 rounded-lg p-5 text-left text-xs text-[#1a1a1a]">
            <span className="font-serif uppercase font-bold tracking-wider text-[10px] text-[#7d6e5c] flex items-center gap-1.5 mb-3 border-b border-vagabond-parchment-dark pb-1.5">
              <Sparkles size={12} className="text-vagabond-gold" />
              Future Roadmap Features (Version 2.0)
            </span>
            <ul className="flex flex-col gap-2.5 font-serif font-medium">
              {data.plannedFeatures?.map((f, idx) => (
                <li key={idx} className="flex items-start gap-2 text-[#2b2b2b]">
                  <span className="text-vagabond-gold mt-0.5">✦</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 text-[9px] uppercase font-mono text-[#7d6e5c] tracking-widest flex items-center justify-center gap-1.5">
            <Compass size={10} />
            <span>Reserved for Future Expansion</span>
          </div>
        </div>
      ) : (
        <div className="text-center text-vagabond-red font-serif">
          Failed to load placeholder metadata.
        </div>
      )}
    </div>
  );
};

export default NotesPlaceholder;

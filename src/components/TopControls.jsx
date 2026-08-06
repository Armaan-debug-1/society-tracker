import React, { useState } from 'react';
import { syncAllData } from '../supabaseClient';

export default function TopControls() {
  const [liveMode, setLiveMode] = useState(() => {
    const stored = localStorage.getItem('liveMode');
    return stored === null ? true : stored === 'true';
  });


  const [syncing, setSyncing] = useState(false);

  const toggleLiveMode = () => {
    const newVal = !liveMode;
    setLiveMode(newVal);
    localStorage.setItem('liveMode', newVal.toString());
    window.location.reload();
  };

  const handleRefresh = async () => {
    setSyncing(true);
    try {
      await syncAllData();
      window.location.reload();
    } catch(e) {
      alert("Error syncing: " + e.message);
    }
    setSyncing(false);
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-4 bg-black/60 p-2 rounded-xl backdrop-blur-md border border-white/10 shadow-lg">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-300">Live Mode</span>
        <button 
          onClick={toggleLiveMode}
          className={`w-12 h-6 rounded-full p-1 transition-colors ${liveMode ? 'bg-green-500' : 'bg-slate-700'}`}
        >
          <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${liveMode ? 'translate-x-6' : 'translate-x-0'}`} />
        </button>
      </div>
      <button 
        onClick={handleRefresh}
        disabled={syncing}
        className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-widest rounded-lg transition-colors shadow-[0_0_10px_rgba(6,182,212,0.5)]"
      >
        {syncing ? 'Syncing...' : 'Refresh'}
      </button>
    </div>
  );
}

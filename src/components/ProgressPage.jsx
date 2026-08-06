import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ParticleBackground from './ParticleBackground';
import { supabase } from '../supabaseClient';

export default function ProgressPage({ user }) {
  const [goals, setGoals] = useState([]);
  const [formData, setFormData] = useState({ name: '', current: 0, target: 100, unit: '%' });

  useEffect(() => {
    fetchGoals();
  }, [user]);

  const fetchGoals = async () => {
    let userId = user?.id;
    if (!userId) {
      const offline = localStorage.getItem('userSession');
      if (offline) userId = JSON.parse(offline).id;
    }
    
    if (userId && userId !== 'offline-test-id') {
      try {
        // Fetch ALL goals from the database (removed .eq('user_id', userId))
        const { data, error } = await supabase.from('my_tasks').select('*').order('created_at', { ascending: false });
        if (!error && data) {
          setGoals(data);
          return;
        }
      } catch (err) {}
    }
    
    // Fallback
    const local = JSON.parse(localStorage.getItem(`offline_my_goals_${userId || 'guest'}`) || '[]');
    setGoals(local);
  };

  const handleSaveGoal = async (e) => {
    e.preventDefault();
    let userId = user?.id;
    if (!userId) {
      const offline = localStorage.getItem('userSession');
      if (offline) userId = JSON.parse(offline).id;
    }
    
    if (!userId || userId === 'offline-test-id') {
      alert("You must be logged in to create a goal.");
      return;
    }
    
    const newGoal = {
      user_id: userId,
      name: formData.name,
      priority: Number(formData.current) || 0,
      description: String(formData.target) || '100',
      deadline_date: formData.unit
    };
    
    try {
      const { error } = await supabase.from('my_tasks').insert([newGoal]);
      if (error) throw error;
      setFormData({ name: '', current: 0, target: 100, unit: '%' });
      fetchGoals();
    } catch (err) {
      console.error("Supabase insert failed", err);
      alert("Failed to save goal on server. Error: " + (err.message || JSON.stringify(err)));
    }
  };

  const handleUpdateProgress = async (id, newCurrent) => {
    // Optimistic Update
    setGoals(prev => prev.map(g => g.id === id ? { ...g, priority: Number(newCurrent), current: Number(newCurrent) } : g));

    try {
      const { error } = await supabase.from('my_tasks').update({ priority: Number(newCurrent) }).eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error("Supabase update failed", err);
      alert("Failed to update on server. Error: " + (err.message || ""));
      fetchGoals(); // Revert optimistic update
    }
  };

  const handleDelete = async (id) => {
    try {
      const { error } = await supabase.from('my_tasks').delete().eq('id', id);
      if (error) throw error;
      fetchGoals();
    } catch (err) {
      console.error("Supabase delete failed", err);
      alert("Failed to delete on server. Error: " + (err.message || ""));
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#030508] text-white px-4 py-12 md:p-8 pb-40 flex flex-col items-center relative overflow-x-hidden overflow-y-auto font-sans">
      <ParticleBackground />
      
      <motion.main initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} 
        className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-4 z-10 transform scale-[0.95] origin-top mt-4 md:mt-0">
        
        {/* Form Panel */}
        <section className="bg-[#0a0f1c]/70 backdrop-blur-2xl border border-white/10 rounded-3xl p-4 md:p-5 shadow-[0_0_50px_-12px_rgba(6,182,212,0.2)]">
          <h2 className="text-lg md:text-xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400 uppercase tracking-widest">
            Launch New Goal
          </h2>
          <form onSubmit={handleSaveGoal} className="space-y-3">
            <input className="w-full bg-black/40 focus:bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-[11px] focus:border-cyan-500 outline-none transition-all placeholder:text-white/20 text-white" placeholder="Goal Name (e.g. Sponsorships)" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
            <div className="grid grid-cols-3 gap-2">
              <input type="number" className="bg-black/40 focus:bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-[11px] focus:border-cyan-500 outline-none transition-all placeholder:text-white/20 text-white" placeholder="Current" value={formData.current} onChange={(e) => setFormData({...formData, current: e.target.value})} required />
              <input type="number" className="bg-black/40 focus:bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-[11px] focus:border-cyan-500 outline-none transition-all placeholder:text-white/20 text-white" placeholder="Target" value={formData.target} onChange={(e) => setFormData({...formData, target: e.target.value})} required />
              <input className="bg-black/40 focus:bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-[11px] focus:border-cyan-500 outline-none transition-all placeholder:text-white/20 text-white" placeholder="Unit (e.g. %)" value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})} required />
            </div>
            
            <button className="w-full bg-gradient-to-r from-cyan-600 to-indigo-600 py-3 rounded-xl font-black uppercase text-[10px] tracking-[0.3em] hover:scale-[1.01] transition-transform text-white">
              Add Goal
            </button>
          </form>
        </section>

        {/* Goals Dashboard */}
        <section className="bg-[#0a0f1c]/70 backdrop-blur-2xl border border-white/10 rounded-3xl p-4 md:p-5 shadow-2xl flex flex-col">
          <h2 className="text-lg md:text-xl font-black uppercase tracking-widest text-white/90 mb-4">Progress Tracker</h2>
          
          <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 scrollbar-hide flex-grow">
            <AnimatePresence>
              {goals.length > 0 ? goals.map(goal => {
                const current = goal.current !== undefined ? goal.current : goal.priority;
                const target = goal.target !== undefined ? goal.target : Number(goal.description);
                const unit = goal.unit !== undefined ? goal.unit : goal.deadline_date;
                const percentage = Math.min(100, Math.max(0, (current / target) * 100)) || 0;
                return (
                  <motion.div key={goal.id} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-black/40 rounded-xl p-4 border border-white/5 hover:border-white/20 transition-all shadow-lg border-l-[3px] border-l-cyan-500">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-bold text-sm text-white">{goal.name}</h4>
                      <button onClick={() => handleDelete(goal.id)} className="text-[10px] bg-red-500/10 text-red-400 hover:bg-red-500/20 px-3 py-1 rounded-lg transition-all uppercase tracking-widest">Delete</button>
                    </div>
                    
                    <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase tracking-widest mb-1">
                      <span>Progress: {current} / {target} {unit}</span>
                      <span>{percentage.toFixed(0)}%</span>
                    </div>
                    
                    <div className="w-full bg-white/10 rounded-full h-2 mb-3">
                      <div className="bg-gradient-to-r from-cyan-400 to-indigo-500 h-2 rounded-full transition-all duration-500" style={{ width: `${percentage}%` }}></div>
                    </div>
                    
                    <div className="flex gap-2">
                      <input type="number" className="w-20 bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-[10px] focus:border-cyan-500 outline-none text-white" 
                        defaultValue={current} />
                      <button className="text-[10px] bg-white/5 hover:bg-white/20 px-3 py-1 rounded-lg transition-all uppercase tracking-widest text-white" onClick={(e) => {
                        const input = e.target.previousElementSibling;
                        handleUpdateProgress(goal.id, input.value);
                      }}>Update</button>
                    </div>
                  </motion.div>
                );
              }) : <p className="text-slate-500 text-sm italic text-center py-20 font-light">No goals tracked yet.</p>}
            </AnimatePresence>
          </div>
        </section>
      </motion.main>
    </div>
  );
}

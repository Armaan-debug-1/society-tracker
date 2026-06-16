import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import ParticleBackground from './ParticleBackground';

export default function MyspacePage({ user }) {
  const [tasks, setTasks] = useState([]);
  const [formData, setFormData] = useState({ name: '', desc: '', date: '', time: '', priority: 1 });
  const [editId, setEditId] = useState(null);

  useEffect(() => { fetchTasks(); }, [user]);

  async function fetchTasks() {
    let userId = user?.id || (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return;
    const { data } = await supabase.from('my_tasks').select('*').eq('user_id', userId).order('priority', { ascending: false });
    setTasks(data || []);
  }

  const handleSaveTask = async (e) => {
    e.preventDefault();
    let userId = user?.id || (await supabase.auth.getUser()).data.user?.id;
    if (editId) {
      await supabase.from('my_tasks').update({ name: formData.name, description: formData.desc, deadline_date: formData.date, deadline_time: formData.time, priority: formData.priority }).eq('id', editId);
    } else {
      await supabase.from('my_tasks').insert([{ user_id: userId, name: formData.name, description: formData.desc, deadline_date: formData.date, deadline_time: formData.time, priority: formData.priority }]);
    }
    setEditId(null);
    setFormData({ name: '', desc: '', date: '', time: '', priority: 1 });
    fetchTasks();
  };

  const handleDelete = async (id) => { await supabase.from('my_tasks').delete().eq('id', id); fetchTasks(); };

  return (
    <div className="min-h-screen bg-[#030508] text-white p-8 flex items-center justify-center relative overflow-hidden font-sans">
      <ParticleBackground />
      
      <motion.main initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} 
        className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-8 z-10">
        
        {/* Form Panel - Modern Tech Look */}
        <section className="bg-[#0a0f1c]/70 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 shadow-[0_0_50px_-12px_rgba(6,182,212,0.2)]">
          <h2 className="text-3xl font-black mb-8 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400 uppercase tracking-widest">
            {editId ? 'Modify Mission' : 'Launch New Task'}
          </h2>
          <form onSubmit={handleSaveTask} className="space-y-5">
            <input className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:border-cyan-500 outline-none transition-all placeholder:text-white/20" placeholder="Task Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
            <textarea className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:border-cyan-500 outline-none transition-all h-28 placeholder:text-white/20" placeholder="Task Description" value={formData.desc} onChange={(e) => setFormData({...formData, desc: e.target.value})} />
            
            <div className="grid grid-cols-2 gap-4">
              <input type="date" className="bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white/50" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} required />
              <input type="time" className="bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white/50" value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})} required />
            </div>
            
            <div className="flex justify-between items-center bg-black/40 p-4 rounded-2xl border border-white/10">
              {[1, 2, 3, 4, 5].map((num) => (
                <button key={num} type="button" onClick={() => setFormData({...formData, priority: num})} 
                  className={`w-12 h-12 rounded-xl font-black text-lg transition-all ${formData.priority === num ? 'ring-4 ring-white/20 scale-110 shadow-xl' : 'opacity-30 hover:opacity-100 hover:scale-105'}`} 
                  style={{backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#f97316', '#ef4444'][num-1]}}>{num}</button>
              ))}
            </div>
            <button className="w-full bg-gradient-to-r from-cyan-600 to-indigo-600 py-5 rounded-2xl font-black uppercase text-sm tracking-[0.3em] hover:scale-[1.01] transition-transform">
              {editId ? 'Update System' : 'Sync to System'}
            </button>
          </form>
        </section>

        {/* Orbital Dashboard */}
        <section className="bg-[#0a0f1c]/70 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 shadow-2xl flex flex-col">
          <h2 className="text-3xl font-black mb-8 uppercase tracking-widest text-white/90">Orbital Dashboard</h2>
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-hide flex-grow">
            <AnimatePresence>
              {tasks.length > 0 ? tasks.map(task => (
                <motion.div key={task.id} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-black/40 border-l-4 rounded-2xl p-6 flex justify-between items-center border border-white/5 hover:border-white/20 transition-all shadow-lg" 
                  style={{ borderLeftColor: ['#10b981', '#3b82f6', '#f59e0b', '#f97316', '#ef4444'][task.priority-1] }}>
                  <div>
                    <h4 className="font-bold text-base text-white">{task.name}</h4>
                    <p className="text-[11px] text-slate-400 uppercase tracking-widest mt-1">{task.deadline_date} • {task.deadline_time}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditId(task.id); setFormData({ name: task.name, desc: task.description, date: task.deadline_date, time: task.deadline_time, priority: task.priority }); }} className="text-[10px] bg-white/5 hover:bg-white/20 px-4 py-2 rounded-lg transition-all uppercase tracking-widest">Edit</button>
                    <button onClick={() => handleDelete(task.id)} className="text-[10px] bg-red-500/10 text-red-400 hover:bg-red-500/20 px-4 py-2 rounded-lg transition-all uppercase tracking-widest">Delete</button>
                  </div>
                </motion.div>
              )) : <p className="text-slate-500 text-sm italic text-center py-20 font-light">No tasks synced to system.</p>}
            </AnimatePresence>
          </div>
        </section>
      </motion.main>
    </div>
  );
}
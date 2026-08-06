import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import ParticleBackground from './ParticleBackground';

export default function MyspacePage({ user }) {
  const [tasks, setTasks] = useState([]);
  const [formData, setFormData] = useState({ name: '', desc: '', date: '', time: '', priority: 1, type: 'Task', designation: '', assignedTo: '', meetingUrl: '' });
  const [editId, setEditId] = useState(null);

  useEffect(() => { fetchTasks(); }, [user]);

  async function fetchTasks() {
    let userId = user?.id;
    if (!userId) {
      const offline = JSON.parse(localStorage.getItem('userSession') || 'null');
      userId = offline?.id;
    }
    if (!userId) return;

    try {
      const { data, error } = await supabase.from('my_tasks').select('*').eq('user_id', userId).order('priority', { ascending: false });
      if (error) throw error;
      setTasks(data || []);
    } catch (err) {
      const local = JSON.parse(localStorage.getItem(`offline_my_tasks_${userId}`) || '[]');
      setTasks(local.sort((a, b) => b.priority - a.priority));
    }
  }

  const handleSaveTask = async (e) => {
    e.preventDefault();
    let userId = user?.id;
    if (!userId) {
      const offline = JSON.parse(localStorage.getItem('userSession') || 'null');
      userId = offline?.id;
    }
    
    let formattedDesc = '';
    if (formData.type === 'Meeting Link') {
      formattedDesc = `[Meeting Link] ${formData.desc} - URL: ${formData.meetingUrl}`;
    } else {
      formattedDesc = `[${formData.type}] ${formData.desc} (By: ${formData.designation || 'N/A'} | To: ${formData.assignedTo || 'All'})`;
    }

    const taskObj = { 
      user_id: userId, 
      name: formData.name, 
      description: formattedDesc, 
      deadline_date: formData.date, 
      deadline_time: formData.time, 
      priority: formData.priority 
    };

    try {
      if (editId) {
        const { error } = await supabase.from('my_tasks').update(taskObj).eq('id', editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('my_tasks').insert([taskObj]);
        if (error) throw error;
      }
    } catch (err) {
      const local = JSON.parse(localStorage.getItem(`offline_my_tasks_${userId}`) || '[]');
      if (editId) {
        localStorage.setItem(`offline_my_tasks_${userId}`, JSON.stringify(local.map(t => t.id === editId ? { ...taskObj, id: editId } : t)));
      } else {
        localStorage.setItem(`offline_my_tasks_${userId}`, JSON.stringify([{ ...taskObj, id: Date.now() }, ...local]));
      }
    }
    
    setEditId(null);
    setFormData({ name: '', desc: '', date: '', time: '', priority: 1, type: 'Task', designation: '', assignedTo: '', meetingUrl: '' });
    fetchTasks();
  };

  const sortedTasks = tasks;

  const handleDelete = async (id) => { 
    let userId = user?.id;
    if (!userId) {
      const offline = JSON.parse(localStorage.getItem('userSession') || 'null');
      userId = offline?.id;
    }

    try {
      const { error } = await supabase.from('my_tasks').delete().eq('id', id); 
      if (error) throw error;
    } catch (err) {
      const local = JSON.parse(localStorage.getItem(`offline_my_tasks_${userId}`) || '[]');
      localStorage.setItem(`offline_my_tasks_${userId}`, JSON.stringify(local.filter(t => t.id !== id)));
    }
    fetchTasks(); 
  };

  return (
    <div className="min-h-screen w-full bg-[#030508] text-white px-4 py-12 md:p-8 pb-40 flex flex-col items-center relative overflow-x-hidden overflow-y-auto font-sans">
      <ParticleBackground />
      
      <motion.main initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} 
        className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-4 z-10 transform scale-[0.95] origin-top mt-4 md:mt-0">
        
        {/* Form Panel - Modern Tech Look */}
        <section className="bg-[#0a0f1c]/70 backdrop-blur-2xl border border-white/10 rounded-3xl p-4 md:p-5 shadow-[0_0_50px_-12px_rgba(6,182,212,0.2)]">
          <h2 className="text-lg md:text-xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400 uppercase tracking-widest">
            {editId ? 'Modify System' : `Launch New ${formData.type}`}
          </h2>
          <form onSubmit={handleSaveTask} className="space-y-3">
            {/* Styled Segmented Control for Type Selection */}
            <div className="flex flex-col md:flex-row bg-black/40 rounded-2xl p-1 mb-3 border border-white/10 gap-1">
              {['Task' /*, 'Announcement', 'Meeting Link'*/].map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({...formData, type})}
                  className={`flex-1 py-2 px-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${
                    formData.type === type 
                    ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(34,211,238,0.5)] scale-[1.02]'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <input className="w-full bg-black/40 focus:bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-[11px] focus:border-cyan-500 outline-none transition-all placeholder:text-white/20 text-white" placeholder={formData.type === 'Meeting Link' ? 'Meeting Title' : `${formData.type} Name`} value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
            
            {formData.type === 'Meeting Link' && (
              <input className="w-full bg-black/40 focus:bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-[11px] focus:border-cyan-500 outline-none transition-all placeholder:text-white/20 text-cyan-400" placeholder="Meeting URL (e.g. https://meet.google.com/...)" value={formData.meetingUrl} onChange={(e) => setFormData({...formData, meetingUrl: e.target.value})} required />
            )}

            {formData.type !== 'Meeting Link' && (
              <textarea className="w-full bg-black/40 focus:bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-[11px] focus:border-cyan-500 outline-none transition-all h-14 placeholder:text-white/20 text-white" placeholder={`${formData.type} Description`} value={formData.desc} onChange={(e) => setFormData({...formData, desc: e.target.value})} />
            )}
            
            {(formData.type === 'Task' || formData.type === 'Announcement') && (
              <select className="w-full bg-black/40 focus:bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-[11px] focus:border-cyan-500 outline-none transition-all text-white appearance-none cursor-pointer" value={formData.designation} onChange={(e) => setFormData({...formData, designation: e.target.value})}>
                <option value="" disabled>Select Position/Designation</option>
                {["EB", "Core", "Member"].map(role => (
                  <option key={role} value={role} className="bg-[#0a0f1c]">{role}</option>
                ))}
              </select>
            )}
            
            {formData.type === 'Task' && (
              <input className="w-full bg-black/40 focus:bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-[11px] focus:border-cyan-500 outline-none transition-all placeholder:text-white/20 text-white" placeholder="Assigned To (e.g. John)" value={formData.assignedTo} onChange={(e) => setFormData({...formData, assignedTo: e.target.value})} />
            )}
            
            {(formData.type === 'Task' || formData.type === 'Meeting Link') && (
              <div className="grid grid-cols-2 gap-3">
              {/* UPDATED DATE INPUT */}
              <input 
                type="date" 
                className="bg-black/40 focus:bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-[11px] text-slate-300 cursor-pointer outline-none focus:border-cyan-500" 
                value={formData.date} 
                onChange={(e) => setFormData({...formData, date: e.target.value})} 
                onClick={(e) => e.target.showPicker && e.target.showPicker()}
                style={{ colorScheme: 'dark' }}
                required 
              />
              
              {/* UPDATED TIME/CLOCK INPUT */}
              <input 
                type="time" 
                className="bg-black/40 focus:bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-[11px] text-slate-300 cursor-pointer outline-none focus:border-cyan-500" 
                value={formData.time} 
                onChange={(e) => setFormData({...formData, time: e.target.value})} 
                onClick={(e) => e.target.showPicker && e.target.showPicker()}
                style={{ colorScheme: 'dark' }}
                required 
              />
              </div>
            )}
            
            {formData.type === 'Task' && (
              <div className="flex justify-between items-center bg-black/40 p-2 rounded-xl border border-white/10">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button key={num} type="button" onClick={() => setFormData({...formData, priority: num})} 
                    className={`w-10 h-10 rounded-lg font-black text-sm transition-all ${formData.priority === num ? 'ring-2 ring-white/30 scale-110 shadow-xl' : 'opacity-40 hover:opacity-100 hover:scale-105'}`} 
                    style={{backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#f97316', '#ef4444'][num-1]}}>{num}</button>
                ))}
              </div>
            )}
            <button className="w-full bg-gradient-to-r from-cyan-600 to-indigo-600 py-3 rounded-xl font-black uppercase text-[10px] tracking-[0.3em] hover:scale-[1.01] transition-transform text-white">
              {editId ? 'Update System' : 'Sync to System'}
            </button>
          </form>
        </section>

        {/* Orbital Dashboard */}
        <section className="bg-[#0a0f1c]/70 backdrop-blur-2xl border border-white/10 rounded-3xl p-4 md:p-5 shadow-2xl flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg md:text-xl font-black uppercase tracking-widest text-white/90">Orbital Dashboard</h2>

          </div>
          
          <div className="space-y-3 max-h-[40vh] md:max-h-[50vh] overflow-y-auto pr-2 scrollbar-hide flex-grow">
            <AnimatePresence>
              {sortedTasks.length > 0 ? sortedTasks.map(task => (
                <motion.div key={task.id} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-black/40 border-l-[3px] rounded-xl p-3 flex justify-between items-center border border-white/5 hover:border-white/20 transition-all shadow-lg" 
                  style={{ borderLeftColor: ['#10b981', '#3b82f6', '#f59e0b', '#f97316', '#ef4444'][task.priority-1] }}>
                  <div>
                    <h4 className="font-bold text-sm text-white">{task.name}</h4>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">{task.deadline_date} • {task.deadline_time}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditId(task.id); setFormData({ name: task.name, desc: task.description.replace(/^\[.*?\]\s*|\s*\(By:.*?To:.*?\)$/g, ''), date: task.deadline_date, time: task.deadline_time, priority: task.priority, type: 'Task', designation: '', assignedTo: '' }); }} className="text-[10px] bg-white/5 hover:bg-white/20 px-4 py-2 rounded-lg transition-all uppercase tracking-widest text-white">Edit</button>
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

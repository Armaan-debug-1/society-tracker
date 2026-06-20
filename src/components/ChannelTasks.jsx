import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import ParticleBackground from '../components/ParticleBackground';

const PRIORITIES = ['P1', 'P2', 'P3', 'P4', 'P5'];

export default function ChannelTasks() {
  const { eventName, channelName } = useParams();
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({ title: '', priority: 'P1', deadline: '' });
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  useEffect(() => { fetchTasks(); }, [eventName, channelName]);

  const fetchTasks = async () => {
    const { data } = await supabase.from('channel_tasks').select('*')
      .eq('event_name', eventName).eq('channel_name', channelName)
      .order('created_at', { ascending: false });
    setTasks(data || []);
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    await supabase.from('channel_tasks').insert([{ event_name: eventName, channel_name: channelName, ...newTask }]);
    setNewTask({ title: '', priority: 'P1', deadline: '' });
    fetchTasks();
  };

  const handleDelete = async (id) => {
    if(window.confirm("Delete this task?")) {
        await supabase.from('channel_tasks').delete().eq('id', id);
        fetchTasks();
    }
  };

  const handleUpdate = async (id) => {
    await supabase.from('channel_tasks').update({ title: editTitle }).eq('id', id);
    setEditingId(null);
    fetchTasks();
  };

  return (
    <div className="min-h-screen bg-[#030508] text-white p-8 relative overflow-hidden">
      <ParticleBackground />
      
      <div className="max-w-7xl mx-auto mb-10 flex justify-between items-end relative z-20">
        <div>
          <p className="text-cyan-500 text-xs font-mono tracking-[0.2em] uppercase">Events / {eventName}</p>
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 uppercase">{channelName?.replace(/-/g, ' ')}</h1>
        </div>
        <Link to={`/home`} className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm transition-all">Back to Channels</Link>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto z-20 relative">
        <div className="bg-[#0a0f1c]/60 backdrop-blur-xl p-8 rounded-3xl border border-white/5 h-fit">
          <h2 className="text-xl font-bold mb-6 text-cyan-400">Deploy New Task</h2>
          <form onSubmit={handleAddTask} className="space-y-4">
            <input 
              className="w-full p-4 bg-black/40 border border-white/5 rounded-xl outline-none focus:border-cyan-500" 
              placeholder="Task description..." 
              value={newTask.title} 
              onChange={(e) => setNewTask({...newTask, title: e.target.value})} 
              required 
            />
            
            <select 
              className="w-full p-4 bg-black/40 border border-white/5 rounded-xl outline-none appearance-none cursor-pointer" 
              onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
              value={newTask.priority}
            >
              {PRIORITIES.map(p => <option key={p} value={p} className="bg-[#0a0f1c]">{p}</option>)}
            </select>
            
            {/* UPDATED DATE INPUT: Click anywhere to open calendar, styled for dark mode */}
            <input 
              type="date" 
              className="w-full p-4 bg-black/40 border border-white/5 rounded-xl outline-none cursor-pointer text-slate-300" 
              onChange={(e) => setNewTask({...newTask, deadline: e.target.value})} 
              onClick={(e) => e.target.showPicker && e.target.showPicker()}
              style={{ colorScheme: 'dark' }}
              value={newTask.deadline}
              required 
            />
            
            <button type="submit" className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl font-bold hover:scale-[1.01] transition-transform">Deploy Task</button>
          </form>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <AnimatePresence>
            {tasks.map(task => (
              <motion.div key={task.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} 
                className="bg-[#0a0f1c]/40 p-6 rounded-2xl border border-white/5 flex justify-between items-center group hover:border-white/10 transition-all">
                {editingId === task.id ? (
                  <input className="bg-black/50 p-2 w-full rounded border border-cyan-500 text-white outline-none" defaultValue={task.title} onChange={(e) => setEditTitle(e.target.value)} autoFocus />
                ) : (
                  <div>
                    <p className="font-bold text-lg text-white">{task.title}</p>
                    <p className="text-xs text-slate-500 font-mono mt-1">📅 {task.deadline}</p>
                  </div>
                )}
                
                <div className="flex items-center gap-3 pl-4">
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-black ${task.priority === 'P1' ? 'bg-red-500/20 text-red-400' : 'bg-cyan-500/20 text-cyan-400'}`}>{task.priority}</span>
                  {editingId === task.id ? (
                    <button onClick={() => handleUpdate(task.id)} className="text-green-400 font-bold hover:text-green-300 ml-2">Save</button>
                  ) : (
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditingId(task.id); setEditTitle(task.title); }} className="p-2 hover:bg-white/5 rounded-lg text-blue-400" title="Edit">✏️</button>
                      <button onClick={() => handleDelete(task.id)} className="p-2 hover:bg-white/5 rounded-lg text-red-400" title="Delete">🗑️</button>
                      
                      {/* FIXED TICK BUTTON: Now calls handleDelete to check off the task */}
                      <button onClick={() => handleDelete(task.id)} className="p-2 hover:bg-white/5 rounded-lg text-green-400" title="Complete">✔</button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
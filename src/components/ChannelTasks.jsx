import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import ParticleBackground from '../components/ParticleBackground';
import { parseRoles, hasAdminAccess } from '../roleUtils';

const PRIORITIES = ['P1', 'P2', 'P3', 'P4', 'P5'];

const parseTaskTitle = (title) => {
  if (!title) return { isParsed: false, name: '' };
  
  const meetingMatch = title.match(/^\[(.*?)\]\s*(.*?)\s*-\s*URL:\s*(.*)$/);
  if (meetingMatch) {
    return { isParsed: true, isMeeting: true, type: meetingMatch[1], name: meetingMatch[2], desc: meetingMatch[3], by: '', to: '' };
  }

  const taskMatch = title.match(/^\[(.*?)\]\s*(.*?)(?:\s*:\s*(.*?))?\s*\(By:\s*(.*?)\s*\|\s*To:\s*(.*?)\)$/);
  if (taskMatch) {
    return { isParsed: true, isMeeting: false, type: taskMatch[1], name: taskMatch[2], desc: taskMatch[3] || '', by: taskMatch[4], to: taskMatch[5] };
  }

  return { isParsed: false, name: title };
};

export default function ChannelTasks() {
  const { eventName, channelName } = useParams();
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({ name: '', desc: '', date: '', time: '', priority: 'P1', type: 'Task', designation: '', assignedTo: '', meetingUrl: '' });
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [userRole, setUserRole] = useState([]);
  const [loadingRole, setLoadingRole] = useState(true);
  const [activeTab, setActiveTab] = useState('Tasks');

  useEffect(() => { 
    checkRole();
    fetchTasks(); 
  }, [eventName, channelName]);

  const checkRole = async () => {
    const offlineStr = localStorage.getItem('userSession');
    if (offlineStr) {
      const userSession = JSON.parse(offlineStr);
      if (hasAdminAccess(userSession.role)) {
        setUserRole(['ADMIN']);
        setLoadingRole(false);
        return;
      }
      try {
        const { data } = await supabase.from('custom_users').select('role').eq('id', userSession.id).maybeSingle();
        setUserRole(parseRoles(data?.role));
      } catch (err) {
        setUserRole(['MEMBER-1']);
      }
    } else {
      setUserRole(['MEMBER-1']);
    }
    setLoadingRole(false);
  };

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase.from('channel_tasks').select('*')
        .eq('event_name', eventName).eq('channel_name', channelName)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setTasks(data || []);
    } catch (err) {
      // Offline fallback
      const local = JSON.parse(localStorage.getItem(`offline_tasks_${eventName}_${channelName}`) || '[]');
      setTasks(local);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    
    let formattedTitle = '';
    if (newTask.type === 'Meeting Link') {
      formattedTitle = `[Meeting Link] ${newTask.name} - URL: ${newTask.meetingUrl}`;
    } else {
      formattedTitle = `[${newTask.type}] ${newTask.name}${newTask.desc ? ': ' + newTask.desc : ''} (By: ${newTask.designation || 'N/A'} | To: ${newTask.assignedTo || 'All'})`;
    }

    let formattedDeadline = `${newTask.date} ${newTask.time}`;

    const newTaskObj = { 
      event_name: eventName, 
      channel_name: channelName, 
      title: formattedTitle,
      priority: newTask.priority,
      deadline: formattedDeadline
    };

    try {
      const { error } = await supabase.from('channel_tasks').insert([newTaskObj]);
      if (error) throw error;
    } catch (err) {
      // Offline fallback
      newTaskObj.id = Date.now();
      const local = JSON.parse(localStorage.getItem(`offline_tasks_${eventName}_${channelName}`) || '[]');
      localStorage.setItem(`offline_tasks_${eventName}_${channelName}`, JSON.stringify([newTaskObj, ...local]));
    }
    
    setNewTask({ name: '', desc: '', date: '', time: '', priority: 'P1', type: 'Task', designation: '', assignedTo: '', meetingUrl: '' });
    fetchTasks();
  };

  const handleDelete = async (id) => {
    if(window.confirm("Delete this task?")) {
        try {
          const { error } = await supabase.from('channel_tasks').delete().eq('id', id);
          if (error) throw error;
        } catch (err) {
          const local = JSON.parse(localStorage.getItem(`offline_tasks_${eventName}_${channelName}`) || '[]');
          localStorage.setItem(`offline_tasks_${eventName}_${channelName}`, JSON.stringify(local.filter(t => t.id !== id)));
        }
        fetchTasks();
    }
  };

  const handleUpdate = async (id) => {
    try {
      const { error } = await supabase.from('channel_tasks').update({ title: editTitle }).eq('id', id);
      if (error) throw error;
    } catch (err) {
      const local = JSON.parse(localStorage.getItem(`offline_tasks_${eventName}_${channelName}`) || '[]');
      const updated = local.map(t => t.id === id ? { ...t, title: editTitle } : t);
      localStorage.setItem(`offline_tasks_${eventName}_${channelName}`, JSON.stringify(updated));
    }
    setEditingId(null);
    fetchTasks();
  };

  const sortedTasks = tasks;

  const sections = [
    { id: 'Tasks', title: 'Tasks', data: sortedTasks.filter(t => {
        const parsed = parseTaskTitle(t.title);
        return parsed.type !== 'Meeting Link' && parsed.type !== 'Announcement';
    }) },
    { id: 'Announcements', title: 'Announcements', data: sortedTasks.filter(t => parseTaskTitle(t.title).type === 'Announcement') },
    { id: 'Meeting Links', title: 'Meeting Links', data: sortedTasks.filter(t => parseTaskTitle(t.title).type === 'Meeting Link') }
  ];

  const activeSection = sections.find(s => s.id === activeTab);

  const channelAccess = {
    "General Announcement": ["EB", "CORE", "OEC", "EMH", "OC", "MEMBER-1", "MEMBER-2", "ADMIN"],
    "EB": ["EB", "ADMIN"], "CORE": ["EB", "CORE", "ADMIN"], "OEC & EMH": ["EB", "CORE", "OEC", "EMH", "ADMIN"],
    "OC": ["EB", "CORE", "OC", "ADMIN"], "TECHNICAL": ["EB", "CORE", "OEC", "TECHNICAL", "ADMIN"],
    "MARKETING": ["EB", "CORE", "OEC", "MARKETING", "ADMIN"], "DESIGN": ["EB", "CORE", "DESIGN", "ADMIN"],
    "MEDIA": ["EB", "CORE", "EMH", "MEDIA", "ADMIN"], "CONTENT": ["EB", "CORE", "CONTENT", "ADMIN"],
    "PUBLICITY": ["EB", "CORE", "EMH", "PUBLICITY", "ADMIN"], "CREATIVITY": ["EB", "CORE", "CREATIVITY", "ADMIN"],
    "1st YEAR ONLY": ["EB", "CORE", "MEMBER-1", "ADMIN"], "General Chat": ["EB", "CORE", "OEC", "EMH", "OC", "MEMBER-1", "MEMBER-2", "ADMIN"]
  };

  const actualChannelKey = Object.keys(channelAccess).find(k => 
    k.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-') === channelName
  );

  const canAccess = userRole.includes('ADMIN') || 
                    userRole.includes('COMPLETE_ACCESS') || 
                    userRole.includes(`${eventName}:ALL`) || 
                    (actualChannelKey && channelAccess[actualChannelKey]?.some(r => userRole.includes(`${eventName}:${r}`) || userRole.includes(r)));

  if (loadingRole) {
    return <div className="min-h-screen bg-[#030508] text-cyan-400 font-bold tracking-widest flex justify-center items-center">Authenticating...</div>;
  }

  if (!canAccess) {
    return (
      <div className="min-h-screen bg-[#030508] text-red-500 font-bold uppercase tracking-widest flex flex-col justify-center items-center">
        <div>Access Denied</div>
        <Link to={`/event/${eventName}`} className="mt-4 px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm transition-all text-white">Back to Event</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030508] text-white p-8 pb-32 relative overflow-hidden">
      <ParticleBackground />
      
      <div className="max-w-7xl mx-auto mb-10 flex justify-between items-end relative z-20">
        <div>
          <p className="text-cyan-500 text-xs font-mono tracking-[0.2em] uppercase">Events / {eventName}</p>
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 uppercase">{actualChannelKey || channelName?.replace(/-/g, ' ')}</h1>
        </div>
        <Link to={`/home`} className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm transition-all">Back to Channels</Link>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto z-20 relative">
        <div className="bg-[#0a0f1c]/60 backdrop-blur-xl p-8 rounded-3xl border border-white/5 h-fit">
          <h2 className="text-xl font-bold mb-6 text-cyan-400">Deploy New {newTask.type}</h2>
          <form onSubmit={handleAddTask} className="space-y-4">
            
            {/* Styled Segmented Control for Type Selection */}
            <div className="flex flex-col md:flex-row bg-black/40 rounded-2xl p-1.5 mb-4 border border-white/10 gap-1">
              {['Task', 'Announcement', 'Meeting Link'].map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setNewTask({...newTask, type})}
                  className={`flex-1 py-3 px-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${
                    newTask.type === type 
                    ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(34,211,238,0.5)] scale-[1.02]'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <input 
              className="w-full p-4 bg-black/40 border border-white/5 rounded-xl outline-none focus:border-cyan-500" 
              placeholder={newTask.type === 'Meeting Link' ? 'Meeting Title' : `${newTask.type} Name`} 
              value={newTask.name} 
              onChange={(e) => setNewTask({...newTask, name: e.target.value})} 
              required 
            />

            {newTask.type === 'Meeting Link' && (
              <input 
                className="w-full p-4 bg-black/40 border border-white/5 rounded-xl outline-none focus:border-cyan-500 text-cyan-400" 
                placeholder="Meeting URL (e.g. https://meet.google.com/...)" 
                value={newTask.meetingUrl} 
                onChange={(e) => setNewTask({...newTask, meetingUrl: e.target.value})} 
                required 
              />
            )}

            {newTask.type !== 'Meeting Link' && (
              <textarea 
                className="w-full p-4 bg-black/40 border border-white/5 rounded-xl outline-none focus:border-cyan-500 h-24" 
                placeholder={`${newTask.type} Description`} 
                value={newTask.desc} 
                onChange={(e) => setNewTask({...newTask, desc: e.target.value})} 
              />
            )}

            {(newTask.type === 'Task' || newTask.type === 'Announcement') && (
              <select 
                className="w-full p-4 bg-black/40 border border-white/5 rounded-xl outline-none focus:border-cyan-500 text-slate-300 appearance-none cursor-pointer" 
                value={newTask.designation} 
                onChange={(e) => setNewTask({...newTask, designation: e.target.value})} 
              >
                <option value="" disabled>Select Position/Designation</option>
                {["EB", "Core", "Member"].map(role => (
                  <option key={role} value={role} className="bg-[#0a0f1c]">{role}</option>
                ))}
              </select>
            )}

            {newTask.type === 'Task' && (
              <input 
                className="w-full p-4 bg-black/40 border border-white/5 rounded-xl outline-none focus:border-cyan-500" 
                placeholder="Assigned To (e.g. Design Team, John)..." 
                value={newTask.assignedTo} 
                onChange={(e) => setNewTask({...newTask, assignedTo: e.target.value})} 
              />
            )}
            
            {newTask.type === 'Task' && (
              <select 
                className="w-full p-4 bg-black/40 focus:bg-black/40 border border-white/5 rounded-xl outline-none appearance-none cursor-pointer text-slate-300" 
                onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                value={newTask.priority}
              >
                {PRIORITIES.map(p => <option key={p} value={p} className="bg-[#0a0f1c]">{p}</option>)}
              </select>
            )}
            
            {(newTask.type === 'Task' || newTask.type === 'Meeting Link') && (
              <div className="grid grid-cols-2 gap-4">
                <input 
                  type="date" 
                  className="w-full p-4 bg-black/40 focus:bg-black/40 border border-white/5 rounded-xl outline-none cursor-pointer text-slate-300" 
                  onChange={(e) => setNewTask({...newTask, date: e.target.value})} 
                  onClick={(e) => e.target.showPicker && e.target.showPicker()}
                  style={{ colorScheme: 'dark' }}
                  value={newTask.date}
                  required 
                />
                <input 
                  type="time" 
                  className="w-full p-4 bg-black/40 focus:bg-black/40 border border-white/5 rounded-xl outline-none cursor-pointer text-slate-300" 
                  onChange={(e) => setNewTask({...newTask, time: e.target.value})} 
                  onClick={(e) => e.target.showPicker && e.target.showPicker()}
                  style={{ colorScheme: 'dark' }}
                  value={newTask.time}
                  required 
                />
              </div>
            )}
            
            <button type="submit" className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl font-bold hover:scale-[1.01] transition-transform">Deploy {newTask.type}</button>
          </form>
        </div>

        <div className="lg:col-span-2 flex flex-col h-full max-h-[80vh] overflow-y-auto scrollbar-hide pb-10 gap-4 pr-2">
          {/* Tabs Navigation */}
          <div className="flex gap-2 border-b border-white/10 pt-3 pb-4 mb-2 overflow-x-auto scrollbar-hide">
            {sections.map(section => (
              <button
                key={section.id}
                onClick={() => setActiveTab(section.id)}
                className={`relative px-5 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all duration-300 ${
                  activeTab === section.id 
                    ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(34,211,238,0.3)]' 
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {section.title}
                {section.data.length > 0 && (
                  <span className={`absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center text-[10px] rounded-full border-2 border-[#030508] font-black ${
                    activeTab === section.id ? 'bg-black text-cyan-400' : 'bg-cyan-500 text-black'
                  }`}>
                    {section.data.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Active Section Content */}
          <div className="flex flex-col">
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {activeSection?.data.length === 0 ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-slate-500 text-center py-10 font-medium">
                    No {activeSection.title.toLowerCase()} deployed yet.
                  </motion.div>
                ) : (
                  activeSection?.data.map(task => (
                    <motion.div key={task.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} 
                      className="bg-[#0a0f1c]/40 p-6 rounded-2xl border border-white/5 flex justify-between items-center group hover:border-white/10 transition-all">
                      {editingId === task.id ? (
                        <input className="bg-black/50 p-2 w-full rounded border border-cyan-500 text-white outline-none" defaultValue={task.title} onChange={(e) => setEditTitle(e.target.value)} autoFocus />
                      ) : (
                        (() => {
                          const parsed = parseTaskTitle(task.title);
                          return (
                            <div className="flex-1 pr-4">
                              {parsed.isParsed ? (
                                <>
                                  <div className="flex items-center gap-2.5 mb-1.5">
                                    <span className="text-[10px] font-semibold text-slate-400 bg-slate-800/50 border border-slate-700/50 px-2 py-0.5 rounded-md tracking-wider whitespace-nowrap shadow-sm">
                                      {parsed.type}
                                    </span>
                                    <h3 className="font-bold text-lg text-slate-100 leading-tight tracking-tight">{parsed.name}</h3>
                                  </div>
                                  
                                  {parsed.desc && parsed.isMeeting ? (
                                    <a href={parsed.desc} target="_blank" rel="noreferrer" className="text-[13px] text-cyan-400 hover:text-cyan-300 hover:underline mt-1 mb-3 block break-all transition-colors">{parsed.desc}</a>
                                  ) : parsed.desc ? (
                                    <p className="text-[13.5px] text-slate-400 mb-3 leading-relaxed font-light">{parsed.desc}</p>
                                  ) : null}

                                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] font-mono">
                                    {!parsed.isMeeting && (
                                      <>
                                        <span className="flex items-center gap-1.5">
                                          <span className="text-slate-500">To</span> 
                                          <span className="text-blue-200/70 font-medium px-2 py-0.5 bg-blue-500/5 border border-blue-500/10 rounded-md">{parsed.to}</span>
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                          <span className="text-slate-500">By</span> 
                                          <span className="text-purple-200/70 font-medium px-2 py-0.5 bg-purple-500/5 border border-purple-500/10 rounded-md">{parsed.by}</span>
                                        </span>
                                      </>
                                    )}
                                    <span className="flex items-center gap-1.5 text-slate-400">
                                      <span className="opacity-70">📅</span> 
                                      <span>{task.deadline}</span>
                                    </span>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <p className="font-bold text-lg text-white mb-2">{task.title}</p>
                                  <p className="text-xs text-slate-500 font-mono">📅 {task.deadline}</p>
                                </>
                              )}
                            </div>
                          );
                        })()
                      )}
                      <div className="flex items-center gap-3 pl-4">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black ${task.priority === 'P1' ? 'bg-red-500/20 text-red-400' : 'bg-cyan-500/20 text-cyan-400'}`}>{task.priority}</span>
                        {editingId === task.id ? (
                          <button onClick={() => handleUpdate(task.id)} className="text-green-400 font-bold hover:text-green-300 ml-2">Save</button>
                        ) : (
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setEditingId(task.id); setEditTitle(task.title); }} className="p-2 hover:bg-white/5 rounded-lg text-blue-400" title="Edit">✏️</button>
                            <button onClick={() => handleDelete(task.id)} className="p-2 hover:bg-white/5 rounded-lg text-red-400" title="Delete">🗑️</button>
                            <button onClick={() => handleDelete(task.id)} className="p-2 hover:bg-white/5 rounded-lg text-green-400" title="Complete">✔</button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

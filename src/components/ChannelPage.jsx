import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import ParticleBackground from './ParticleBackground';

export default function ChannelPage({ user }) {
  const { channelName } = useParams();
  const [data, setData] = useState([]);
  const [input, setInput] = useState('');
  const [role, setRole] = useState(null);

  const isAnnouncement = channelName === 'general-announcement';

  useEffect(() => {
    fetchData();
    if (user) fetchRole();
  }, [channelName, user]);

  async function fetchRole() {
    const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (data) setRole(data.role);
  }

  async function fetchData() {
    // Agar announcement hai to 'notices' table, warna 'channel_tasks' table
    const table = isAnnouncement ? 'notices' : 'channel_tasks';
    const { data } = await supabase.from(table).select('*').eq('channel_name', channelName);
    if (data) setData(data);
  }

  const handlePost = async () => {
    if (!['admin', 'EB', 'core'].includes(role)) return;
    const table = isAnnouncement ? 'notices' : 'channel_tasks';
    await supabase.from(table).insert([{ channel_name: channelName, content: input }]);
    setInput('');
    fetchData();
  };

  return (
    <div className="min-h-screen bg-[#030508] text-white p-8">
      <ParticleBackground />
      <h1 className="text-3xl font-black text-cyan-400 mb-8 uppercase">{channelName?.replace(/-/g, ' ')}</h1>
      
      {/* Post Form (Admin/EB/Core Only) */}
      {['admin', 'EB', 'core'].includes(role) && (
        <div className="bg-black/40 p-6 rounded-xl border border-cyan-500/30 mb-8">
          <textarea value={input} onChange={(e) => setInput(e.target.value)} className="w-full bg-black/50 p-4 rounded-lg mb-2" placeholder="Post content..." />
          <button onClick={handlePost} className="bg-cyan-600 px-6 py-2 rounded-lg font-bold">POST</button>
        </div>
      )}

      {/* Feed */}
      <div className="space-y-4">
        {data.map(item => (
          <div key={item.id} className="bg-[#0a0f1c] p-6 rounded-2xl border-l-4 border-indigo-500">
            <p>{item.content || item.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
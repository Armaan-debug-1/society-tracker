import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

const AdminPanel = () => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  const rolesList = ["ADMIN", "EB", "CORE", "OEC", "EMH", "OC", "TECHNICAL", "MARKETING", "DESIGN", "MEDIA", "CONTENT", "PUBLICITY", "CREATIVITY", "MEMBER-1", "MEMBER-2"];

  useEffect(() => {
    checkAdminAndFetch();
  }, []);

  async function checkAdminAndFetch() {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return navigate('/login');

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    // Security Check: Sirf ADMIN hi andar aa sakta hai
    if (!profile || !profile.role.includes('ADMIN')) {
      alert("Access Denied: You are not an Admin!");
      navigate('/home');
      return;
    }

    fetchProfiles();
  }

  async function fetchProfiles() {
    const { data } = await supabase.from('profiles').select('*');
    if (data) setProfiles(data);
    setLoading(false);
  }

  async function toggleRole(id, currentRoles, roleToToggle) {
    let newRoles = currentRoles.includes(roleToToggle) 
      ? currentRoles.filter(r => r !== roleToToggle) 
      : [...currentRoles, roleToToggle];
    
    await supabase.from('profiles').update({ role: newRoles }).eq('id', id);
    fetchProfiles();
  }

  if (loading) return <div className="p-10 text-white">Loading Security Checks...</div>;

  return (
    <div className="min-h-screen bg-[#030508] text-white p-10">
      <h2 className="text-3xl font-black mb-8 text-cyan-400">Admin Dashboard</h2>
      
      <div className="overflow-x-auto bg-white/5 rounded-2xl border border-white/10 p-6">
        <table className="w-full text-left">
          <thead>
            <tr className="text-cyan-400 text-sm border-b border-white/10">
              <th className="p-4">Email</th>
              <th className="p-4">Roles Management</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => (
              <tr key={p.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="p-4">{p.email}</td>
                <td className="p-4 flex flex-wrap gap-2">
                  {rolesList.map(role => (
                    <button 
                      key={role}
                      onClick={() => toggleRole(p.id, p.role || [], role)}
                      className={`px-3 py-1 text-[10px] font-bold rounded-full border transition-all ${
                        p.role?.includes(role) 
                        ? 'bg-cyan-500 border-cyan-400 text-black' 
                        : 'bg-transparent border-white/20 text-white hover:border-white'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <footer className="mt-10 pt-5 border-t border-white/10 text-center text-slate-500 text-xs">
        © 2026 Society Tracker | Admin Restricted Area
      </footer>
    </div>
  );
};

export default AdminPanel;
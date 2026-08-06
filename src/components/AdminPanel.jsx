import React, { useState, useEffect } from 'react';
import { supabase, secondarySupabase } from '../supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import { parseRoles, hasAdminAccess } from '../roleUtils';

const DEPARTMENTS = [
  { id: 'soc-fair', name: 'Soc Fair' },
  { id: 'iste-sat', name: 'ISTE X SAT' },
  { id: 'colloquium', name: 'Colloquium' },
  { id: 'iste-helix', name: 'ISTE X HELIX' },
];

const ROLES = ["ALL", "EB", "CORE", "OEC", "EMH", "OC", "TECHNICAL", "MARKETING", "DESIGN", "MEDIA", "CONTENT", "PUBLICITY", "CREATIVITY", "MEMBER-1", "MEMBER-2"];

const AdminPanel = () => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editedRoles, setEditedRoles] = useState({});
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('password123'); // Default password
  const [newUserRoles, setNewUserRoles] = useState([]);
  
  // For dropdowns
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [menuDept, setMenuDept] = useState('');
  const [menuRole, setMenuRole] = useState('ALL');

  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAndFetch();
  }, []);

  async function checkAdminAndFetch() {
    const offlineStr = localStorage.getItem('userSession');
    if (!offlineStr) return navigate('/login');
    const user = JSON.parse(offlineStr);

    if (hasAdminAccess(user.role)) {
       fetchProfiles();
       return;
    }

    const { data: profile } = await supabase
      .from('custom_users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !hasAdminAccess(profile.role)) {
      alert("Access Denied: You are not an Admin!");
      navigate('/home');
      return;
    }

    fetchProfiles();
  }

  async function fetchProfiles() {
    const { data } = await supabase.from('custom_users').select('*').order('created_at', { ascending: false });
    if (data) {
      setProfiles(data);
      const initialRoles = {};
      data.forEach(p => {
        initialRoles[p.id] = parseRoles(p.role);
      });
      setEditedRoles(initialRoles);
    }
    setLoading(false);
  }

  const handleAddAccess = (id, isNewUser = false) => {
    if (!menuDept) return;
    
    let newAccess = '';
    if (menuDept === 'ADMIN' || menuDept === 'COMPLETE_ACCESS') {
      newAccess = menuDept;
    } else {
      newAccess = `${menuDept}:${menuRole}`;
    }

    if (isNewUser) {
      if (!newUserRoles.includes(newAccess)) {
        setNewUserRoles([...newUserRoles, newAccess]);
      }
    } else {
      setEditedRoles(prev => {
        const current = prev[id] || [];
        if (!current.includes(newAccess)) {
          return { ...prev, [id]: [...current, newAccess] };
        }
        return prev;
      });
    }
    
    setActiveMenuId(null);
    setMenuDept('');
    setMenuRole('ALL');
  };

  const handleRemoveAccess = (id, accessToRemove, isNewUser = false) => {
    if (isNewUser) {
      setNewUserRoles(prev => prev.filter(r => r !== accessToRemove));
    } else {
      setEditedRoles(prev => {
        const current = prev[id] || [];
        return { ...prev, [id]: current.filter(r => r !== accessToRemove) };
      });
    }
  };

  const handleSaveRoles = async (id) => {
    const rolesToSave = editedRoles[id];
    const { error } = await supabase.from('custom_users').update({ role: rolesToSave }).eq('id', id);
    if (error) {
      alert("Error saving roles: " + error.message);
    } else {
      alert("Roles saved successfully!");
      fetchProfiles();
    }
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm("Are you sure you want to permanently delete this user?")) {
      const { error } = await supabase.rpc('admin_delete_user', { target_user_id: id });
      if (error) {
        alert("Error deleting user: " + error.message);
      } else {
        fetchProfiles();
      }
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUserEmail || !newUserPassword) return alert("Email and Password are required");

    try {
      // 1. Sign up the user via official API so GoTrue generates a perfect hash
      const { error: signUpError } = await secondarySupabase.auth.signUp({
        email: newUserEmail,
        password: newUserPassword
      });

      if (signUpError && !signUpError.message.includes('already registered')) {
        return alert("Error signing up user: " + signUpError.message);
      }

      // 2. Call the new RPC to securely assign their roles in custom_users
      const { error } = await supabase.rpc('admin_assign_roles', {
        target_email: newUserEmail,
        new_roles: newUserRoles
      });

      if (error) {
        alert("Error assigning roles: " + error.message);
      } else {
        alert("User successfully created and roles assigned!");
        setNewUserEmail('');
        setNewUserPassword('password123');
        setNewUserRoles([]);
        fetchProfiles();
      }
    } catch (err) {
      alert("Unexpected error: " + err.message);
    }
  };

  const renderAccessBadge = (role, id, isNewUser = false) => (
    <div key={role} className="flex items-center gap-1 px-2 py-1 bg-cyan-900/40 text-cyan-200 text-[10px] md:text-xs font-bold rounded-md border border-cyan-500/30">
      <span>{role}</span>
      <button 
        onClick={() => handleRemoveAccess(id, role, isNewUser)}
        className="ml-1 text-cyan-400 hover:text-white transition-colors"
      >
        ✕
      </button>
    </div>
  );

  const renderAddAccessMenu = (id, isNewUser = false) => {
    if (activeMenuId !== id) {
      return (
        <button 
          onClick={() => setActiveMenuId(id)}
          className="px-2 py-1 bg-white/5 hover:bg-white/10 text-slate-300 text-[10px] md:text-xs font-bold rounded-md border border-dashed border-white/20 transition-colors"
        >
          + Add Access
        </button>
      );
    }

    return (
      <div className="flex flex-col md:flex-row gap-2 items-center bg-black/40 p-2 rounded-lg border border-white/10">
        <select 
          value={menuDept} 
          onChange={(e) => setMenuDept(e.target.value)}
          className="bg-black border border-white/20 text-white text-xs rounded-md px-2 py-1 outline-none"
        >
          <option value="">Select Dept/Access</option>
          <option value="COMPLETE_ACCESS">COMPLETE ACCESS (All Depts)</option>
          <option value="ADMIN">ADMIN</option>
          {DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>

        {menuDept && menuDept !== 'ADMIN' && menuDept !== 'COMPLETE_ACCESS' && (
          <select 
            value={menuRole} 
            onChange={(e) => setMenuRole(e.target.value)}
            className="bg-black border border-white/20 text-white text-xs rounded-md px-2 py-1 outline-none"
          >
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        )}

        <div className="flex gap-1">
          <button 
            onClick={() => handleAddAccess(id, isNewUser)}
            className="bg-cyan-600 text-white text-xs px-2 py-1 rounded-md hover:bg-cyan-500"
          >
            Add
          </button>
          <button 
            onClick={() => { setActiveMenuId(null); setMenuDept(''); setMenuRole('ALL'); }}
            className="bg-slate-700 text-white text-xs px-2 py-1 rounded-md hover:bg-slate-600"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  };

  if (loading) return <div className="min-h-screen bg-[#030508] flex items-center justify-center text-cyan-400 font-bold uppercase tracking-widest">Loading Security Checks...</div>;

  return (
    <div className="min-h-screen bg-[#030508] text-white p-4 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-2xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400 uppercase tracking-widest">Admin Dashboard</h2>
          <Link to="/home" className="text-slate-400 hover:text-white border border-white/10 px-3 py-1.5 md:px-4 md:py-2 rounded-xl bg-white/5 transition-all text-[10px] md:text-sm font-bold uppercase tracking-widest">Back to Home</Link>
        </div>
        
        {/* Add User Section */}
        <div className="bg-[#0a0f1c]/70 backdrop-blur-xl rounded-3xl border border-white/10 p-5 md:p-8 mb-10 shadow-2xl">
          <h3 className="text-lg md:text-xl font-bold mb-6 text-cyan-400 uppercase tracking-widest border-b border-white/10 pb-4">Add New User</h3>
          <form onSubmit={handleAddUser} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <input type="email" placeholder="Email Address" required value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-cyan-500 outline-none transition-all placeholder:text-slate-600" />
              <input type="text" placeholder="Default Password" required value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-cyan-500 outline-none transition-all placeholder:text-slate-600" />
            </div>
            
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Assign Access</p>
              <div className="flex flex-wrap items-center gap-2">
                {newUserRoles.map(role => renderAccessBadge(role, 'new', true))}
                {renderAddAccessMenu('new', true)}
              </div>
            </div>
            
            <button type="submit" className="bg-gradient-to-r from-cyan-600 to-indigo-600 px-6 py-3 rounded-xl font-black text-xs md:text-sm uppercase tracking-[0.2em] hover:scale-[1.02] transition-transform shadow-[0_0_20px_rgba(6,182,212,0.3)]">
              Create User
            </button>
          </form>
        </div>

        {/* User Management Section */}
        <div className="bg-[#0a0f1c]/70 backdrop-blur-xl rounded-3xl border border-white/10 p-5 md:p-8 shadow-2xl overflow-hidden">
           <h3 className="text-lg md:text-xl font-bold mb-6 text-cyan-400 uppercase tracking-widest border-b border-white/10 pb-4">Manage Users</h3>
           
           <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="text-slate-500 text-xs uppercase tracking-widest border-b border-white/10">
                  <th className="p-4 whitespace-nowrap w-1/4">Email</th>
                  <th className="p-4 w-1/2">Access List</th>
                  <th className="p-4 text-right w-1/4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((p) => {
                  const currentRoles = editedRoles[p.id] || [];
                  const originalRoles = parseRoles(p.role);
                  const hasUnsavedChanges = JSON.stringify(currentRoles.slice().sort()) !== JSON.stringify(originalRoles.slice().sort());

                  return (
                    <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4 font-mono text-sm break-all text-slate-300 align-top pt-5">{p.email}</td>
                      <td className="p-4 align-top">
                        <div className="flex flex-wrap items-center gap-2">
                          {currentRoles.map(role => renderAccessBadge(role, p.id))}
                          {renderAddAccessMenu(p.id)}
                        </div>
                      </td>
                      <td className="p-4 text-right align-top pt-4">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleSaveRoles(p.id)}
                            disabled={!hasUnsavedChanges}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                              hasUnsavedChanges
                              ? 'bg-cyan-600 text-white shadow-[0_0_15px_rgba(34,211,238,0.4)] cursor-pointer hover:bg-cyan-500'
                              : 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/5'
                            }`}
                          >
                            Save
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(p.id)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:text-red-300 transition-all"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <footer className="mt-12 pt-6 border-t border-white/10 text-center text-slate-500 text-[10px] font-black uppercase tracking-widest">
          © 2026 Society Tracker | Admin Restricted Area
        </footer>
      </div>
    </div>
  );
};

export default AdminPanel;

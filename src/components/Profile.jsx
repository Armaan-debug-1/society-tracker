import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient";
import ParticleBackground from "./ParticleBackground";

export default function Profile({ user }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ fullName: '', contact: '', gender: '', association: '' });

  useEffect(() => { if (user?.id) fetchProfileData(); }, [user?.id]);

  async function fetchProfileData() {
    const { data } = await supabase.from('profiles').select('full_name, contact, gender, association').eq('id', user.id).maybeSingle();
    if (data) {
      setFormData({
        fullName: data.full_name || '', contact: data.contact || '',
        gender: data.gender || '', association: data.association || ''
      });
    }
  }

  const handleSave = async () => {
    const { error } = await supabase.from('profiles').update({
      full_name: formData.fullName, contact: formData.contact,
      gender: formData.gender, association: formData.association
    }).eq('id', user.id);
    
    if (!error) setIsEditing(false);
    alert(error ? "Error saving!" : "Profile Updated!");
  };

  return (
    <div className="min-h-screen bg-[#030508] text-white flex flex-col relative overflow-hidden font-sans">
      <ParticleBackground />
      
      <main className="flex-grow p-8 relative z-20 max-w-5xl mx-auto w-full mt-10">
        {/* Updated Heading with Blue/Cyan tone */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ type: "spring", stiffness: 100, damping: 10 }}
          className="mb-12"
        >
          <h1 className="text-6xl font-black text-cyan-400 uppercase tracking-[0.1em] drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">PROFILE</h1>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Avatar Card */}
          <motion.div 
            animate={{ y: [0, -15, 0] }} 
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="bg-[#0a0f1c]/70 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-10 text-center flex flex-col items-center shadow-2xl relative overflow-hidden group hover:border-cyan-500/50 transition-all"
          >
             <motion.div 
                whileHover={{ scale: 1.05, rotate: 5 }}
                className="w-32 h-32 bg-gradient-to-tr from-cyan-500 to-indigo-500 rounded-full flex items-center justify-center text-5xl font-black text-white shadow-[0_0_50px_rgba(6,182,212,0.6)] mb-8"
            >
              {user?.email?.charAt(0).toUpperCase()}
            </motion.div>
            <h3 className="text-3xl font-bold">{formData.fullName || 'New User'}</h3>
            <p className="text-slate-400 text-sm mt-3 font-mono tracking-widest break-all">{user?.email}</p>
          </motion.div>

          {/* Details Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ type: "spring", stiffness: 80 }}
            className="md:col-span-2 bg-[#0a0f1c]/70 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-10 space-y-10 shadow-2xl hover:border-white/20 transition-all"
          >
            <div className="flex justify-between items-center border-b border-white/5 pb-6">
              <h4 className="text-sm font-black uppercase tracking-[0.3em] text-cyan-400">Registry Details</h4>
              <button onClick={() => isEditing ? handleSave() : setIsEditing(true)} 
                className="text-xs font-black uppercase tracking-[0.2em] text-white bg-white/5 px-10 py-4 rounded-2xl border border-white/10 hover:bg-cyan-600 transition-all active:scale-95 shadow-[0_0_20px_rgba(6,182,212,0.4)]">
                {isEditing ? 'Save Changes' : 'Edit Registry'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {[ { label: 'Full Name', name: 'fullName' }, { label: 'Contact', name: 'contact' }, { label: 'Gender', name: 'gender' }, { label: 'Association', name: 'association' } ].map((field) => (
                <motion.div key={field.name} whileHover={{ y: -5 }}>
                  <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4">{field.label}</label>
                  {isEditing ? (
                    <input name={field.name} value={formData[field.name]} onChange={(e) => setFormData({...formData, [field.name]: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-5 text-base focus:border-cyan-500 outline-none transition-all shadow-inner" />
                  ) : (
                    <div className="w-full bg-black/30 border border-white/5 rounded-2xl px-6 py-5 text-base text-slate-200 font-medium tracking-wide">{formData[field.name] || 'Not set'}</div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
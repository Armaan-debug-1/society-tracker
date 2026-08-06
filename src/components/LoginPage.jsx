import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion'; // Important for overlay
import ParticleBackground from './ParticleBackground';
import { supabase } from '../supabaseClient';
import LoadingScreen from './LoadingScreen';

const LoginPage = () => {
  const [emailId, setEmailId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showAnimation, setShowAnimation] = useState(false);
  
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailId,
      password: password,
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    } else {
      setLoading(false);
      setShowAnimation(true); // Animation trigger
      
      setTimeout(() => {
        window.location.href = '/home'; 
      }, 4000);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#030508]">
      {/* Animation Overlay */}
      <AnimatePresence>
        {showAnimation && <LoadingScreen />}
      </AnimatePresence>
      
      <div className="flex items-center justify-center min-h-screen px-4 font-sans text-slate-100 overflow-hidden">
        <ParticleBackground />
        
        <div className="relative z-10 max-w-md w-full bg-[#0a0f1c]/40 backdrop-blur-xl rounded-3xl p-10 border border-white/10">
          <h2 className="text-4xl font-black mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">
            Society Tracker
          </h2>
          {errorMsg && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 text-red-400 text-sm text-center">{errorMsg}</div>}
          <form onSubmit={handleLogin} className="space-y-6">
            <input type="email" required value={emailId} onChange={(e) => setEmailId(e.target.value)} className="w-full px-5 py-3.5 rounded-xl bg-black/40 border border-white/5 focus:border-cyan-400 outline-none transition-all" placeholder="Email ID" />
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-5 py-3.5 rounded-xl bg-black/40 border border-white/5 focus:border-cyan-400 outline-none transition-all" placeholder="Password" />
            <button type="submit" disabled={loading} className="w-full mt-4 bg-gradient-to-r from-cyan-500 to-indigo-600 py-4 rounded-xl font-bold shadow-[0_0_20px_rgba(56,189,248,0.3)] hover:scale-[1.02] transition-all">
              {loading ? 'Authenticating...' : 'Enter System'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
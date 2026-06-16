import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import ParticleBackground from "./ParticleBackground";
import { supabase } from "../supabaseClient";

function HomePage() {
  const [userRole, setUserRole] = useState([]);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  useEffect(() => {
    async function getRole() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
        setUserRole(data?.role ? (Array.isArray(data.role) ? data.role : [data.role]) : ['MEMBER-1']);
      }
    }
    getRole();
  }, []);

  const events = [
    { name: "Soc Fair", path: "/event/soc-fair" },
    { name: "ISTE X SAT", path: "/event/iste-sat" },
    { name: "Colloquium", path: "/event/colloquium" },
    { name: "ISTE X HELIX", path: "/event/iste-helix" },
  ];

  const channelAccess = { 
    "General Announcement": ["EB", "CORE", "OEC", "EMH", "OC", "MEMBER-1", "MEMBER-2", "ADMIN"], 
    "EB": ["EB", "ADMIN"], "CORE": ["EB", "CORE", "ADMIN"], "OEC & EMH": ["EB", "CORE", "OEC", "EMH", "ADMIN"], 
    "OC": ["EB", "CORE", "OC", "ADMIN"], "TECHNICAL": ["EB", "CORE", "OEC", "TECHNICAL", "ADMIN"], 
    "MARKETING": ["EB", "CORE", "OEC", "MARKETING", "ADMIN"], "DESIGN": ["EB", "CORE", "DESIGN", "ADMIN"], 
    "MEDIA": ["EB", "CORE", "EMH", "MEDIA", "ADMIN"], "CONTENT": ["EB", "CORE", "CONTENT", "ADMIN"], 
    "PUBLICITY": ["EB", "CORE", "EMH", "PUBLICITY", "ADMIN"], "CREATIVITY": ["EB", "CORE", "CREATIVITY", "ADMIN"], 
    "1st YEAR ONLY": ["EB", "CORE", "MEMBER-1", "ADMIN"], "General Chat": ["EB", "CORE", "OEC", "EMH", "OC", "MEMBER-1", "MEMBER-2", "ADMIN"] 
  };
  const subheadings = Object.keys(channelAccess);

  return (
    <div className="min-h-screen bg-[#030508] text-white flex flex-col relative overflow-hidden">
      <ParticleBackground />
      
      <header className="p-8 relative z-20">
        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500 tracking-tight">SOCIETY TRACKER</h1>
      </header>

      <main className="flex-grow p-8 flex items-center justify-center relative z-20">
        <div className="flex gap-6 w-full max-w-6xl h-[450px] items-stretch">
          {events.map((event, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`relative rounded-3xl border border-white/10 bg-[#0a0f1c]/80 backdrop-blur-xl p-6 transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] flex flex-col
                ${hoveredIndex === index ? 'flex-[2.5] shadow-[0_0_50px_-15px_rgba(34,211,238,0.4)] border-cyan-500/50' : hoveredIndex === null ? 'flex-1' : 'flex-[0.5] opacity-40 blur-[1px] grayscale'}`}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Heading Section */}
              <div className={`flex flex-col items-center justify-center transition-all duration-500 ${hoveredIndex === index ? 'flex-none mb-6' : 'flex-grow'}`}>
                <h4 className="font-black text-2xl text-center cursor-default text-white/90 leading-tight">{event.name}</h4>
              </div>
              
              {/* Inner Box for Channels List */}
              <div className={`flex flex-col gap-0 overflow-y-auto scrollbar-hide transition-all duration-500 border border-white/5 rounded-xl bg-white/5 ${hoveredIndex === index ? 'opacity-100 h-full' : 'opacity-0 h-0'}`}>
                {subheadings.map((sub) => {
                  const canAccess = userRole.includes('ADMIN') || channelAccess[sub]?.some(r => userRole.includes(r));
                  return (
                    <Link 
                      key={sub} 
                      to={canAccess ? `${event.path}/${sub.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}` : "#"}
                      className={`text-sm font-bold py-4 px-5 flex justify-between items-center transition-all duration-200 
                        ${canAccess 
                          ? "text-slate-300 hover:text-cyan-400 hover:bg-white/10 border-b border-white/10 last:border-0" 
                          : "text-slate-700 cursor-not-allowed border-b border-white/10 last:border-0"
                        }`}
                    >
                      {sub} 
                      {canAccess ? <span className="opacity-30">→</span> : <span className="opacity-50">🔒</span>}
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Role Footer */}
      <div className="fixed bottom-6 right-6 z-[100] px-6 py-3 bg-black/60 backdrop-blur-xl border border-cyan-500/30 rounded-full text-[11px] text-cyan-400 font-black tracking-[0.2em] uppercase shadow-2xl">
        ROLE: {userRole.join(', ')}
      </div>
    </div>
  );
}

export default HomePage;
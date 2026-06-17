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
      
      <header className="p-6 md:p-8 relative z-20 text-center md:text-left mt-4 md:mt-0">
        <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500 tracking-tight">
          SOCIETY TRACKER
        </h1>
      </header>

      {/* Responsive Fix: Changed to items-start on mobile so tall flex boxes don't get chopped off at the top. 
        Added pb-28 so the user can scroll past the fixed footer.
      */}
      <main className="flex-grow p-4 pb-28 md:p-8 flex items-start md:items-center justify-center relative z-20">
        
        {/* Responsive Fix: flex-col on mobile, flex-row on desktop. Removed fixed height on mobile. */}
        <div className="flex flex-col md:flex-row gap-4 md:gap-6 w-full max-w-6xl md:h-[450px] items-stretch">
          
          {events.map((event, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`relative rounded-3xl border border-white/10 bg-[#0a0f1c]/80 backdrop-blur-xl p-5 md:p-6 transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] flex flex-col
                ${hoveredIndex === index 
                  ? 'md:flex-[2.5] shadow-[0_0_50px_-15px_rgba(34,211,238,0.4)] border-cyan-500/50' 
                  : hoveredIndex === null 
                    ? 'md:flex-1' 
                    : 'md:flex-[0.5] opacity-75 md:opacity-40 md:blur-[1px] md:grayscale'}`}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              
              {/* Heading Section: Added vertical padding on mobile so closed cards don't shrink too much */}
              <div className={`flex flex-col items-center justify-center transition-all duration-500 ${hoveredIndex === index ? 'flex-none mb-4 md:mb-6' : 'flex-grow py-6 md:py-0'}`}>
                <h4 className="font-black text-xl md:text-2xl text-center cursor-default text-white/90 leading-tight">
                  {event.name}
                </h4>
              </div>
              
              {/* Inner Box: On mobile, limits the height to 280px when open so it acts like a scrollable accordion.
                On desktop, it takes full height.
              */}
              <div className={`flex flex-col gap-0 overflow-y-auto scrollbar-hide transition-all duration-500 rounded-xl bg-white/5 
                ${hoveredIndex === index ? 'opacity-100 h-[280px] md:h-full border border-white/5' : 'opacity-0 h-0 border-transparent overflow-hidden'}`}>
                {subheadings.map((sub) => {
                  const canAccess = userRole.includes('ADMIN') || channelAccess[sub]?.some(r => userRole.includes(r));
                  return (
                    <Link 
                      key={sub} 
                      to={canAccess ? `${event.path}/${sub.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}` : "#"}
                      className={`text-xs md:text-sm font-bold py-4 px-4 md:px-5 flex justify-between items-center transition-all duration-200 shrink-0
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
      <div className="fixed bottom-6 right-4 md:right-6 z-[100] px-5 md:px-6 py-2.5 md:py-3 bg-black/60 backdrop-blur-xl border border-cyan-500/30 rounded-full text-[10px] md:text-[11px] text-cyan-400 font-black tracking-[0.2em] uppercase shadow-2xl">
        ROLE: {userRole.join(', ')}
      </div>
    </div>
  );
}

export default HomePage;
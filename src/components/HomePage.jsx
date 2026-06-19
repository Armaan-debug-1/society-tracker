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
    { name: "Soc Fair", path: "/event/soc-fair", image: "/soc-fair.jpeg" },
    { name: "ISTE X SAT", path: "/event/iste-sat", image: "/iste-sat.jpeg" },
    { name: "Colloquium", path: "/event/colloquium", image: "/colloquium.jpeg" },
    { name: "ISTE X HELIX", path: "/event/iste-helix", image: "/iste-helix.jpeg" },
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
      
      <header className="p-8 relative z-20 flex justify-between items-center">
        
        <h1 
          className="text-4xl font-black tracking-tight"
          style={{
            background: "linear-gradient(to right, #22d3ee, #6366f1)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}
        >
          SOCIETY TRACKER
        </h1>

        {/* LOGO KA SIZE BADA KIYA HAI: h-14 se h-24 kar diya */}
        <div className="h-24 w-auto">
          <img 
            src="/logo.png" 
            alt="Logo" 
            className="h-full w-full object-contain drop-shadow-[0_0_15px_rgba(34,211,238,0.3)] hover:scale-105 transition-transform duration-300"
          />
        </div>

      </header>

      <main className="flex-grow p-8 flex items-center justify-center relative z-20">
        <div className="flex gap-6 w-full max-w-6xl h-[450px] items-stretch">
          {events.map((event, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`relative rounded-3xl border border-white/10 bg-[#0a0f1c] shadow-xl transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] flex flex-col overflow-hidden
                ${hoveredIndex === index ? 'flex-[2.5] shadow-[0_0_50px_-15px_rgba(34,211,238,0.4)] border-cyan-500/50' : 'flex-1'}`}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div className="absolute inset-0 z-0 bg-black">
                <img 
                  src={event.image} 
                  alt={event.name} 
                  className={`w-full h-full object-cover transition-all duration-700 
                    ${hoveredIndex === index ? 'scale-110 blur-[2px]' : 'scale-100'}`} 
                />
                <div className={`absolute inset-0 transition-all duration-700 
                  ${hoveredIndex === index ? 'bg-cyan-900/60' : 'bg-black/60'}`} />
              </div>

              <div className="relative z-10 flex flex-col h-full p-6">
                <div className="flex flex-col items-center justify-start transition-all duration-500 mb-2">
                  <h4 className="font-black text-2xl text-center cursor-default text-white drop-shadow-lg leading-tight tracking-wide">{event.name}</h4>
                </div>
                
                <div className={`flex flex-col gap-0 overflow-y-auto scrollbar-hide transition-all duration-500 border border-white/10 rounded-xl bg-black/40 backdrop-blur-sm mt-2
                  ${hoveredIndex === index ? 'opacity-100 h-full' : 'opacity-0 h-0'}`}>
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
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      <div className="fixed bottom-6 right-6 z-[100] px-6 py-3 bg-black/60 backdrop-blur-xl border border-cyan-500/30 rounded-full text-[11px] text-cyan-400 font-black tracking-[0.2em] uppercase shadow-2xl">
        ROLE: {userRole.join(', ')}
      </div>
    </div>
  );
}

export default HomePage;

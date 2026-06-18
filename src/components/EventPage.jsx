import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import ParticleBackground from "./ParticleBackground";
import { supabase } from "../supabaseClient"; // Supabase client import

function EventPage() {
  const { eventName } = useParams();
  const [userRole, setUserRole] = useState([]); // Role state add ki

  // Access control definition
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

  // Role load karne ka useEffect
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

  return (
    <div className="min-h-screen bg-[#030508] text-white flex flex-col relative overflow-hidden">
      <ParticleBackground />
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none"></div>

      <header className="p-8 relative z-10">
        <Link to="/home" className="text-slate-400 hover:text-white text-sm">← Back to Home</Link>
        <h1 className="text-4xl font-black mt-4 capitalize">{eventName.replace("-", " ")}</h1>
      </header>

      <main className="flex-grow px-8 py-4 relative z-10 max-w-7xl mx-auto w-full">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-6">Channels / Roles</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {subheadings.map((item) => {
            // Access check logic yahan add ki
            const canAccess = userRole.includes('ADMIN') || channelAccess[item]?.some(r => userRole.includes(r));
            
            return (
              <Link 
                key={item}
                // Agar access nahi hai to link disable kar do
                to={canAccess ? `/event/${eventName}/${item.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}` : "#"}
                onClick={(e) => !canAccess && e.preventDefault()}
                className={`bg-[#0a0f1c]/60 backdrop-blur-xl border p-6 rounded-2xl text-center font-bold text-sm transition-all duration-300
                  ${canAccess 
                    ? "border-white/10 hover:border-cyan-500/50 hover:bg-[#111827] hover:shadow-[0_0_20px_rgba(56,189,248,0.2)]" 
                    : "border-white/5 opacity-50 cursor-not-allowed"}
                `}
              >
                {item}
                {!canAccess && <div className="mt-2 text-xs opacity-50">🔒 Locked</div>}
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}

export default EventPage;

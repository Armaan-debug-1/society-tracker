import React from "react";
import { useParams, Link } from "react-router-dom";
import ParticleBackground from "./ParticleBackground";

function EventPage() {
  const { eventName } = useParams(); // URL se event ka naam (e.g., 'soc-fair')
  
  const subheadings = [
    "General Announcement", "EB", "CORE", "OEC & EMH", "OC", 
    "TECHNICAL", "MARKETING", "DESIGN", "MEDIA", "CONTENT", 
    "PUBLICITY", "CREATIVITY", "1st YEAR ONLY", "General Chat"
  ];

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
          {subheadings.map((item) => (
            <Link 
              key={item}
              // URL structure: /event/soc-fair/technical
              to={`/event/${eventName}/${item.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`}
              className="bg-[#0a0f1c]/60 backdrop-blur-xl border border-white/10 p-6 rounded-2xl text-center font-bold text-sm hover:border-cyan-500/50 hover:bg-[#111827] transition-all duration-300 hover:shadow-[0_0_20px_rgba(56,189,248,0.2)]"
            >
              {item}
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}

export default EventPage;
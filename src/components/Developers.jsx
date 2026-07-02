import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import ParticleBackground from "./ParticleBackground";
import FloatingDock from "./FloatingDock";

// Advanced Immersive Card with Extreme Laser Border Sweep + Fixed 2x2 Layout Matrix
const DeveloperCard = ({ name, role, githubUrl, linkedinUrl, imageUrl, colorTheme }) => {
  const cardRef = useRef(null);
  const [hovered, setHovered] = useState(false);

  // High-frequency mouse position sensors
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Aggressive 3D angle matrix for strong tilt effect
  const rotateX = useTransform(mouseY, [-0.5, 0.5], [25, -25]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-25, 25]);

  const springRotateX = useSpring(rotateX, { stiffness: 180, damping: 18, mass: 0.6 });
  const springRotateY = useSpring(rotateY, { stiffness: 180, damping: 18, mass: 0.6 });

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    const currentX = (e.clientX - rect.left) / width - 0.5;
    const currentY = (e.clientY - rect.top) / height - 0.5;

    mouseX.set(currentX);
    mouseY.set(currentY);

    // Direct inline dynamic injection for extreme border sweep pathing
    const xPixel = e.clientX - rect.left;
    const yPixel = e.clientY - rect.top;
    cardRef.current.style.setProperty("--mouse-x", `${xPixel}px`);
    cardRef.current.style.setProperty("--mouse-y", `${yPixel}px`);
  };

  const themeColors = {
    cyan: "#00f0ff",
    pink: "#ff007f",
    green: "#00ff66",
    orange: "#ff5500"
  };

  const glowColor = themeColors[colorTheme] || themeColors.cyan;

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        mouseX.set(0);
        mouseY.set(0);
      }}
      style={{
        rotateX: springRotateX,
        rotateY: springRotateY,
        transformStyle: "preserve-3d",
        boxShadow: hovered 
          ? `0 35px 75px -10px ${glowColor}70, 0 0 55px 5px ${glowColor}50` 
          : '0 15px 35px rgba(0,0,0,0.7)',
        willChange: "transform, box-shadow",
        transformPerspective: 1000
      }}
      whileHover={{ scale: 1.03 }}
      transition={{ type: "spring", stiffness: 400, damping: 18 }}
      className="relative bg-neutral-950 border border-white/5 rounded-3xl p-10 flex items-center gap-8 cursor-pointer overflow-hidden group transition-all duration-300 w-full min-h-[180px] md:min-h-[220px] z-10"
    >
      {/* 1. LIQUID RADIAL BACKGROUND GLOW SWEEP */}
      <div 
        style={{
          background: `radial-gradient(600px circle at var(--mouse-x, 0px) var(--mouse-y, 0px), ${glowColor}30, transparent 50%)`,
          transform: "translateZ(0px)"
        }}
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0"
      />

      {/* 2. EXTREME BRIGHT LASER BORDER SWEEP FRAME */}
      <div 
        style={{
          background: `radial-gradient(350px circle at var(--mouse-x, 0px) var(--mouse-y, 0px), ${glowColor}, transparent 55%)`,
          transform: "translateZ(0px)"
        }}
        className="absolute -inset-[2px] rounded-3xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0 mix-blend-screen"
      />

      {/* SOLID CORE REINFORCEMENT BASE */}
      <div className="absolute inset-[1px] bg-[#05080f] rounded-[22px] z-10 pointer-events-none" />

      {/* LEFT SIDE: ROUND PHOTO CONTAINER WITH DYNAMIC POP */}
      <div 
        style={{ 
          transform: hovered ? "translateZ(50px)" : "translateZ(0px)",
          transition: "transform 0.25s cubic-bezier(0.25, 1, 0.5, 1)"
        }}
        className="w-28 h-28 rounded-full bg-white/5 border border-white/10 flex-shrink-0 overflow-hidden flex items-center justify-center relative z-20 shadow-2xl"
      >
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-white/20 text-xs font-black tracking-widest select-none">PHOTO</span>
        )}
      </div>

      {/* RIGHT SIDE: CONTENT & SOCIAL PATHS */}
      <div className="flex-grow text-left relative z-20 pl-2">
        
        {/* MAGNETIC SHIFTING DEVELOPER NAME CONTAINER WITH CUSTOM MATRIX GLOW */}
        <div 
          style={{ 
            transform: hovered ? "translateZ(70px)" : "translateZ(0px)",
            transition: "transform 0.25s cubic-bezier(0.25, 1, 0.5, 1)"
          }}
          className="mb-2 relative"
        >
          <motion.h4 
            initial={false}
            animate={{
              color: hovered ? glowColor : "#ffffff",
              letterSpacing: hovered ? "0.08em" : "0em",
              filter: hovered ? `drop-shadow(0 0 12px ${glowColor})` : "drop-shadow(0 0 0px rgba(0,0,0,0))"
            }}
            transition={{ type: "spring", stiffness: 250, damping: 18 }}
            className="text-2xl md:text-3xl font-black tracking-wide select-none"
          >
            {name}
          </motion.h4>
        </div>

        <p className="text-xs md:text-sm text-slate-400 font-extrabold tracking-widest uppercase mb-5 select-none opacity-80">{role || "DEVELOPER"}</p>
        
        {/* Clickable Social Navigation Icons */}
        <div 
          style={{ 
            transform: hovered ? "translateZ(40px)" : "translateZ(0px)",
            transition: "transform 0.25s cubic-bezier(0.25, 1, 0.5, 1)"
          }}
          className="flex gap-5 items-center"
        >
          <a 
            href={githubUrl || "#"} 
            target="_blank" 
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()} 
            className="hover:scale-125 transition-all opacity-50 hover:opacity-100 hover:drop-shadow-[0_0_8px_#fff]"
          >
            <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          </a>
          <a 
            href={linkedinUrl || "#"} 
            target="_blank" 
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="hover:scale-125 transition-all opacity-50 hover:opacity-100"
            style={{ filter: hovered ? `drop-shadow(0 0 8px ${glowColor})` : 'none' }}
          >
            <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24">
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
            </svg>
          </a>
        </div>
      </div>
    </motion.div>
  );
};

export default function Developers() {
  const PAGE_HEADER_TITLE = "MEET THE DEVELOPERS";

  const teamMembers = [
    { name: "Gauri Goyal", github: "https://github.com/Gauri173", linkedin: "https://www.linkedin.com/in/gauri-goyal-11475737a/", img: "/dev1.jpeg", theme: "cyan" },
    { name: "Armaan Gupta", github: "https://github.com/Armaan-debug-1", linkedin: "https://www.linkedin.com/in/armaan-gupta67?utm_source=share_via&utm_content=profile&utm_medium=member_android", img: "/dev2.jpeg", theme: "pink" },
    { name: "Bhavya Goyal", github: "https://github.com/07BhavyaGoyal", linkedin: "https://www.linkedin.com/in/bhavyagoyal07/", img: "/dev3.jpeg", theme: "green" },
    { name: "Siddhant Jindal", github: "https://github.com", linkedin: "https://linkedin.com", img: "/dev4.jpeg", theme: "orange" },
  ];

  return (
    <div className="min-h-screen bg-[#030508] text-white flex flex-col relative overflow-x-hidden pb-40">
      <ParticleBackground />

      {/* HEADER */}
      <header className="p-10 md:p-14 relative z-20 text-center">
        <h1 
          className="text-4xl md:text-5xl font-black tracking-widest uppercase bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent"
        >
          {PAGE_HEADER_TITLE}
        </h1>
        <p className="text-slate-500 text-xs mt-3 tracking-widest font-extrabold uppercase">ISTE Technical Chapter Web Development Team</p>
      </header>

      {/* FORCE GRID CONTROL VIA INLINE INJECTION TO GUARANTEE 2-2 DESKTOP SPLIT */}
      <main className="flex-grow max-w-7xl mx-auto px-8 py-4 relative z-20 w-full">
        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: window.innerWidth >= 768 ? 'repeat(2, 1fr)' : 'repeat(1, 1fr)', 
            gap: '40px',
            width: '100%' 
          }}
        >
          {teamMembers.map((member, idx) => (
            <DeveloperCard 
              key={idx}
              name={member.name}
              role={member.role}
              githubUrl={member.github}
              linkedinUrl={member.linkedin}
              imageUrl={member.img}
              colorTheme={member.theme}
            />
          ))}
        </div>
      </main>

      {/* FLOATING DOCK */}
      <FloatingDock />
    </div>
  );
}

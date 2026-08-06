import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import ParticleBackground from "./ParticleBackground";
import FloatingDock from "./FloatingDock";

// Advanced Immersive Card with Ultra-Smooth Hover Dynamics
const DeveloperCard = ({ name, role, githubUrl, linkedinUrl, instagramUrl, imageUrl, colorTheme }) => {
  const cardRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  const requestRef = useRef(null);

  // Raw mouse sensors
  const rawMouseX = useMotionValue(0);
  const rawMouseY = useMotionValue(0);

  // Smooth mouse sensors to eliminate jitter and abrupt motion shifts
  const mouseX = useSpring(rawMouseX, { stiffness: 120, damping: 22, mass: 0.8 });
  const mouseY = useSpring(rawMouseY, { stiffness: 120, damping: 22, mass: 0.8 });

  // Refined smooth 3D tilt matrix
  const rotateX = useTransform(mouseY, [-0.5, 0.5], [18, -18]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-18, 18]);

  const springRotateX = useSpring(rotateX, { stiffness: 100, damping: 20, mass: 1 });
  const springRotateY = useSpring(rotateY, { stiffness: 100, damping: 20, mass: 1 });

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    const currentX = (e.clientX - rect.left) / width - 0.5;
    const currentY = (e.clientY - rect.top) / height - 0.5;

    rawMouseX.set(currentX);
    rawMouseY.set(currentY);

    const xPixel = e.clientX - rect.left;
    const yPixel = e.clientY - rect.top;

    // Use requestAnimationFrame to optimize layout calculations and keep border movement ultra-smooth
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    requestRef.current = requestAnimationFrame(() => {
      if (cardRef.current) {
        cardRef.current.style.setProperty("--mouse-x", `${xPixel}px`);
        cardRef.current.style.setProperty("--mouse-y", `${yPixel}px`);
      }
    });
  };

  const themeColors = {
    cyan: "#00f0ff",
    pink: "#ff007f",
    green: "#00ff66",
    orange: "#ff5500",
    purple: "#b000ff", 
    yellow: "#ffcc00",
    red: "#ff2a2a",
    violet: "#8b5cf6",
    teal: "#00f5d4"
  };

  const glowColor = themeColors[colorTheme] || themeColors.cyan;

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        rawMouseX.set(0);
        rawMouseY.set(0);
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
      whileHover={{ scale: 1.025 }}
      transition={{ type: "spring", stiffness: 180, damping: 22, mass: 0.8 }}
      className="relative bg-neutral-950 border border-white/5 rounded-3xl p-8 md:p-12 flex flex-col sm:flex-row items-center sm:items-start md:items-center gap-6 md:gap-10 cursor-pointer overflow-hidden group transition-all duration-500 ease-out w-full min-h-[220px] md:min-h-[260px] z-10 text-center sm:text-left"
    >
      {/* 1. LIQUID RADIAL BACKGROUND GLOW SWEEP */}
      <div 
        style={{
          background: `radial-gradient(600px circle at var(--mouse-x, 0px) var(--mouse-y, 0px), ${glowColor}30, transparent 50%)`,
          transform: "translateZ(0px)"
        }}
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out z-0"
      />

      {/* 2. EXTREME BRIGHT LASER BORDER SWEEP FRAME */}
      <div 
        style={{
          background: `radial-gradient(350px circle at var(--mouse-x, 0px) var(--mouse-y, 0px), ${glowColor}, transparent 55%)`,
          transform: "translateZ(0px)"
        }}
        className="absolute -inset-[2px] rounded-3xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out z-0 mix-blend-screen"
      />

      {/* SOLID CORE REINFORCEMENT BASE */}
      <div className="absolute inset-[1px] bg-[#05080f] rounded-[22px] z-10 pointer-events-none" />

      {/* LEFT SIDE: ROUND PHOTO CONTAINER WITH DYNAMIC POP */}
      <div 
        style={{ 
          transform: hovered ? "translateZ(40px)" : "translateZ(0px)",
          transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)"
        }}
        className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-white/5 border border-white/10 flex-shrink-0 overflow-hidden flex items-center justify-center relative z-20 shadow-2xl transition-all duration-300"
      >
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-white/20 text-xs font-black tracking-widest select-none">PHOTO</span>
        )}
      </div>

      {/* RIGHT SIDE: CONTENT & SOCIAL PATHS */}
      <div className="flex-grow relative z-20 md:pl-2 w-full">
        
        {/* MAGNETIC SHIFTING DEVELOPER NAME CONTAINER */}
        <div 
          style={{ 
            transform: hovered ? "translateZ(50px)" : "translateZ(0px)",
            transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)"
          }}
          className="mb-1 md:mb-2 relative"
        >
          <motion.h4 
            initial={false}
            animate={{
              color: hovered ? glowColor : "#ffffff",
              letterSpacing: hovered ? "0.06em" : "0em",
              filter: hovered ? `drop-shadow(0 0 12px ${glowColor})` : "drop-shadow(0 0 0px rgba(0,0,0,0))"
            }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="text-2xl md:text-3xl font-black tracking-wide select-none"
          >
            {name}
          </motion.h4>
        </div>

        <p className="text-[10px] md:text-sm text-slate-400 font-extrabold tracking-widest uppercase mb-4 md:mb-5 select-none opacity-80">{role || "DEVELOPER"}</p>
        
        {/* Clickable Social Navigation Icons */}
        <div 
          style={{ 
            transform: hovered ? "translateZ(30px)" : "translateZ(0px)",
            transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)"
          }}
          className="flex gap-4 md:gap-5 items-center justify-center sm:justify-start"
        >
          {/* GitHub Link */}
          <a 
            href={githubUrl || "#"} 
            target="_blank" 
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()} 
            className="hover:scale-125 transition-all duration-300 ease-out opacity-50 hover:opacity-100 hover:drop-shadow-[0_0_8px_#fff]"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6 fill-white" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          </a>

          {/* LinkedIn Link */}
          <a 
            href={linkedinUrl || "#"} 
            target="_blank" 
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="hover:scale-125 transition-all duration-300 ease-out opacity-50 hover:opacity-100"
            style={{ filter: hovered ? `drop-shadow(0 0 8px ${glowColor})` : 'none' }}
          >
            <svg className="w-5 h-5 md:w-6 md:h-6 fill-white" viewBox="0 0 24 24">
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
            </svg>
          </a>

          {/* Instagram Link */}
          <a 
            href={instagramUrl || "#"} 
            target="_blank" 
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="hover:scale-125 transition-all duration-300 ease-out opacity-50 hover:opacity-100"
            style={{ filter: hovered ? `drop-shadow(0 0 8px ${glowColor})` : 'none' }}
          >
            <svg className="w-5 h-5 md:w-6 md:h-6 fill-white" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
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
    { name: "Gauri Goyal", github: "https://github.com/Gauri173", linkedin: "https://www.linkedin.com/in/gauri-goyal-11475737a/", instagram: "https://www.instagram.com/goyalgauri173/", img: "/dev1.jpeg", theme: "cyan" },
    { name: "Armaan Gupta", github: "https://github.com/Armaan-debug-1", linkedin: "https://www.linkedin.com/in/armaan-gupta67?utm_source=share_via&utm_content=profile&utm_medium=member_android", instagram: "https://www.instagram.com/armaan_gupta_9439/", img: "/dev2.jpeg", theme: "pink" },
    { name: "Bhavya Goyal", github: "https://github.com/07BhavyaGoyal", linkedin: "https://www.linkedin.com/in/bhavyagoyal07/", instagram: "https://www.instagram.com/bgoyal_07/", img: "/dev3.jpeg", theme: "green" },
    { name: "Siddhant Jindal", github: "https://github.com", linkedin: "https://linkedin.com", instagram: "https://www.instagram.com/siddhant_jindal72/", img: "/dev4.jpeg", theme: "orange" },
    { name: "Varchasvi Gupta", github: "https://github.com/Varchasvi22", linkedin: "https://www.linkedin.com/in/varchasvi-gupta-90716737b/", instagram: "https://www.instagram.com/debuggingvarchasvi", img: "/dev5.jpeg", theme: "purple" },
    { name: "Abhilasha Das", github: "https://github.com/abhilashadas2406-eng", linkedin: "https://www.linkedin.com/in/abhilasha-das-93828937a/", instagram: "https://www.instagram.com/_.abhil1sha._/", img: "/dev6.jpeg", theme: "yellow" },
    { name: "Saanvi ", github: "https://github.com/saanvis2007", linkedin: "https://www.linkedin.com/in/saanvi-sharma-81a645236/", instagram: "https://www.instagram.com/saanvisharma_2007", img: "/dev7.jpeg", theme: "red" },
    { name: "Gurshan Shergill", github: "https://github.com/Gurshan-Shergill", linkedin: "https://in.linkedin.com/in/gurshan-shergill-933028217", instagram: "https://www.instagram.com/shergillgurshan/", img: "/dev8.jpeg", theme: "violet" },
    { name: "Aditya Grover", github: "https://github.com/AdityaG-07", linkedin: "https://www.linkedin.com/in/aditya-grover-a7a31330a ", instagram: "https://www.instagram.com/a.d.i.t.y.a._.07", img: "/dev9.jpeg", theme: "teal" },
  ];

  return (
    <div className="min-h-screen bg-[#030508] text-white flex flex-col relative overflow-x-hidden pb-40">
      <ParticleBackground />

      {/* HEADER */}
      <header className="px-4 py-10 md:p-14 relative z-20 text-center">
        <h1 
          className="text-3xl md:text-5xl font-black tracking-widest uppercase bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent"
        >
          {PAGE_HEADER_TITLE}
        </h1>
        <p className="text-slate-500 text-[10px] md:text-xs mt-3 tracking-widest font-extrabold uppercase">ISTE Technical Chapter Web Development Team</p>
      </header>

      {/* GRID CONTAINER */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-8 py-4 relative z-20 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 w-full">
          {teamMembers.map((member, idx) => (
            <DeveloperCard 
              key={idx}
              name={member.name}
              role={member.role}
              githubUrl={member.github}
              linkedinUrl={member.linkedin}
              instagramUrl={member.instagram}
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

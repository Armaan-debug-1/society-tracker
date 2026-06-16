import React from 'react';
import { motion } from 'framer-motion';

export default function LoadingScreen() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[99999] bg-[#030508] flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Title */}
      <motion.h1 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="text-7xl font-black text-white tracking-tighter"
      >
        SOCIETY <span className="text-cyan-400">TRACKER</span>
      </motion.h1>

      {/* Acme-Style Animated Glow Line */}
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: "350px" }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
        className="h-[2px] bg-cyan-500 mt-6 shadow-[0_0_15px_#06b6d4]"
      />

      {/* Particle/Star Shower Animation */}
      <div className="absolute top-[60%] flex justify-center w-full h-[200px] pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 0, x: 0 }}
            animate={{ 
              opacity: [0, 1, 0], 
              y: [0, 100 + Math.random() * 100], 
              x: [(Math.random() - 0.5) * 300] 
            }}
            transition={{ 
              duration: 2 + Math.random() * 2, 
              repeat: Infinity, 
              delay: Math.random() * 2,
              ease: "linear"
            }}
            className="absolute w-[2px] h-[2px] bg-white rounded-full"
          />
        ))}
      </div>
    </motion.div>
  );
}
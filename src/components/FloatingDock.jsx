import React from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';

const items = [
  { name: 'HOME', path: '/home', icon: '🏠' },
  { name: 'MY SPACE', path: '/my-space', icon: '📁' },
  { name: 'DEVELOPERS', path: '/developers', icon: '💻' }, // Added right before PROFILE
  { name: 'PROFILE', path: '/profile', icon: '👤' },
];

export default function FloatingDock() {
  const { pathname } = useLocation();

  return (
    <div className="fixed bottom-8 left-0 right-0 flex justify-center z-50">
      <motion.div 
        className="flex gap-2 p-3 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl"
        initial={{ y: 100 }} 
        animate={{ y: 0 }}
      >
        {items.map((item) => (
          <Link key={item.name} to={item.path}>
            <motion.div 
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.9 }}
              className={`px-5 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors ${
                pathname === item.path ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>{item.icon}</span> {item.name}
            </motion.div>
          </Link>
        ))}
      </motion.div>
    </div>
  );
}

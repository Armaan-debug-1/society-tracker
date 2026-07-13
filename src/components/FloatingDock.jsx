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
    // FIX: added px-3 so the dock never touches the screen edges, and dropped
    // the bottom offset a bit on mobile (bottom-4) vs desktop (sm:bottom-8) so
    // it takes up less of the limited vertical space on small screens.
    <div className="fixed bottom-4 sm:bottom-8 left-0 right-0 flex justify-center z-50 px-3">
      <motion.div 
        // FIX: 
        // - gap-1 sm:gap-2  -> tighter spacing between tabs on mobile
        // - p-2 sm:p-3      -> tighter outer padding on mobile
        // - max-w-full      -> dock can never be wider than the viewport
        // - overflow-x-auto -> if it STILL doesn't fit (e.g. very narrow/older
        //   phones), the dock becomes horizontally scrollable instead of
        //   silently clipping the outer tabs off-screen
        // - scrollbar-hide  -> keeps the scroll functional without an ugly
        //   visible scrollbar (relies on the same utility class already used
        //   in HomePage.jsx)
        className="flex gap-1 sm:gap-2 p-2 sm:p-3 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl max-w-full overflow-x-auto scrollbar-hide"
        initial={{ y: 100 }} 
        animate={{ y: 0 }}
      >
        {items.map((item) => (
          // FIX: shrink-0 stops a tab from being squeezed/wrapped when the
          // dock is in scroll mode — each tab keeps its natural width.
          <Link key={item.name} to={item.path} className="shrink-0">
            <motion.div 
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.9 }}
              className={`px-3 py-1.5 sm:px-5 sm:py-2 rounded-xl font-bold text-[10px] sm:text-sm flex items-center gap-1 sm:gap-2 whitespace-nowrap transition-colors ${
                pathname === item.path ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="text-sm sm:text-base">{item.icon}</span> {item.name}
            </motion.div>
          </Link>
        ))}
      </motion.div>
    </div>
  );
}
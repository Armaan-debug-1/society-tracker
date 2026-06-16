import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { supabase } from './supabaseClient';
import LoginPage from './components/LoginPage';
import HomePage from './components/HomePage';
import EventPage from './components/EventPage';
import ChannelPage from './components/ChannelPage';
import AdminPanel from './components/AdminPanel';
import Profile from './components/Profile';
import MyspacePage from './components/MyspacePage'; 
import ChannelTasks from './components/ChannelTasks';
import FloatingDock from './components/FloatingDock';
import LoadingScreen from './components/LoadingScreen'; // Ye import zaroori hai

function DockWrapper() {
  const location = useLocation();
  return location.pathname !== '/' ? <FloatingDock /> : null;
}

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showGlobalLoading, setShowGlobalLoading] = useState(false); // Animation controller

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user || null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#030508] text-cyan-400 font-bold tracking-widest uppercase">
      Initializing System...
    </div>
  );

  return (
    <Router>
      <div className="min-h-screen bg-[#030508]">
        {/* ANIMATION OVERLAY - Yeh tabhi dikhega jab LoginPage trigger karega */}
        {showGlobalLoading && <LoadingScreen />}
        
        <Routes>
          <Route path="/" element={<LoginPage setShowGlobalLoading={setShowGlobalLoading} />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/event/:eventName" element={<EventPage />} />
          <Route path="/event/:eventName/:channelName" element={<ChannelTasks />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/profile" element={<Profile user={currentUser} />} />
          <Route path="/my-space" element={<MyspacePage user={currentUser} />} />
        </Routes>
        <DockWrapper />
      </div>
    </Router>
  );
}

export default App;
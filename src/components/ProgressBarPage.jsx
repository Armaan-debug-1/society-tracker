import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ParticleBackground from "./ParticleBackground";

export default function ProgressBarPage({ user }) {
  const [goals, setGoals] = useState([]);
  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalTarget, setNewGoalTarget] = useState("");
  
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editTarget, setEditTarget] = useState("");

  const STORAGE_KEY = `progress_goals_${user?.id || 'guest'}`;

  useEffect(() => {
    const storedGoals = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    setGoals(storedGoals);
  }, [STORAGE_KEY]);

  const saveGoals = (updatedGoals) => {
    setGoals(updatedGoals);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedGoals));
  };

  const handleCreateGoal = (e) => {
    e.preventDefault();
    if (!newGoalName.trim() || !newGoalTarget || Number(newGoalTarget) <= 0) return;
    
    const newGoal = {
      id: Date.now().toString(),
      name: newGoalName.trim(),
      target: Number(newGoalTarget),
      current: 0,
      createdAt: new Date().toISOString()
    };
    
    saveGoals([newGoal, ...goals]);
    setNewGoalName("");
    setNewGoalTarget("");
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this goal?")) {
      saveGoals(goals.filter(g => g.id !== id));
    }
  };

  const startEditing = (goal) => {
    setEditingId(goal.id);
    setEditName(goal.name);
    setEditTarget(goal.target);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditName("");
    setEditTarget("");
  };

  const handleUpdate = (id) => {
    if (!editName.trim() || !editTarget || Number(editTarget) <= 0) return;
    
    const updatedGoals = goals.map(g => 
      g.id === id ? { ...g, name: editName.trim(), target: Number(editTarget) } : g
    );
    saveGoals(updatedGoals);
    setEditingId(null);
  };

  const updateProgress = (id, newAmount) => {
    if (newAmount < 0) return;
    const updatedGoals = goals.map(g => {
      if (g.id === id) {
        // Prevent going over target, though could allow it if wanted
        const cappedAmount = Math.min(newAmount, g.target);
        return { ...g, current: cappedAmount };
      }
      return g;
    });
    saveGoals(updatedGoals);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030508] p-6 text-white md:p-8 pb-32">
      <ParticleBackground />

      <div className="relative z-20 mx-auto mb-10 max-w-7xl">
        <h1 className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-3xl font-black uppercase text-transparent md:text-5xl">
          Progress Tracker
        </h1>
        <p className="mt-2 text-slate-400">Track your goals and monitor your team's performance metrics.</p>
      </div>

      <div className="relative z-20 mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* CREATE GOAL FORM */}
        <div className="h-fit rounded-3xl border border-white/5 bg-[#0a0f1c]/60 p-8 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <h2 className="mb-6 text-xl font-bold text-cyan-400 flex items-center gap-2">
            <span>🎯</span> Create New Goal
          </h2>
          
          <form onSubmit={handleCreateGoal} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Goal Name</label>
              <input
                type="text"
                className="w-full rounded-xl border border-white/5 bg-black/40 p-4 outline-none focus:border-cyan-500 transition-colors"
                placeholder="e.g. Marketing Calls"
                value={newGoalName}
                onChange={(e) => setNewGoalName(e.target.value)}
                required
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Target Number</label>
              <input
                type="number"
                min="1"
                className="w-full rounded-xl border border-white/5 bg-black/40 p-4 outline-none focus:border-cyan-500 transition-colors"
                placeholder="e.g. 100"
                value={newGoalTarget}
                onChange={(e) => setNewGoalTarget(e.target.value)}
                required
              />
            </div>
            
            <button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 py-4 font-bold text-white shadow-[0_0_20px_rgba(8,145,178,0.4)] transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(8,145,178,0.6)]"
            >
              Add Goal
            </button>
          </form>
        </div>

        {/* GOALS LIST */}
        <div className="lg:col-span-2 space-y-6">
          {goals.length === 0 && (
            <div className="rounded-3xl border border-white/5 bg-[#0a0f1c]/40 p-12 text-center backdrop-blur-xl">
              <div className="text-4xl mb-4">🚀</div>
              <p className="text-xl font-semibold text-slate-300">No goals set yet</p>
              <p className="mt-2 text-sm text-slate-500">Create your first goal to start tracking progress.</p>
            </div>
          )}
          
          <AnimatePresence>
            {goals.map((goal) => {
              const percentage = Math.round((goal.current / goal.target) * 100);
              const isComplete = goal.current >= goal.target;
              
              return (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -20 }}
                  className="group relative rounded-3xl border border-white/5 bg-[#0a0f1c]/60 p-6 backdrop-blur-xl shadow-lg transition-all hover:border-cyan-500/30 overflow-hidden"
                >
                  {/* Decorative background glow for completed goals */}
                  {isComplete && (
                    <div className="absolute inset-0 bg-green-500/5 blur-3xl rounded-3xl z-0 pointer-events-none" />
                  )}

                  <div className="relative z-10">
                    {editingId === goal.id ? (
                      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                        <div className="flex-1">
                          <label className="text-xs text-slate-400">Name</label>
                          <input
                            type="text"
                            className="w-full rounded-lg border border-cyan-500 bg-black/50 p-2 text-white outline-none"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                          />
                        </div>
                        <div className="w-32">
                          <label className="text-xs text-slate-400">Target</label>
                          <input
                            type="number"
                            min="1"
                            className="w-full rounded-lg border border-cyan-500 bg-black/50 p-2 text-white outline-none"
                            value={editTarget}
                            onChange={(e) => setEditTarget(e.target.value)}
                          />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleUpdate(goal.id)} className="rounded-lg bg-green-500/20 px-4 py-2 text-sm font-bold text-green-400 hover:bg-green-500/30">Save</button>
                          <button onClick={cancelEditing} className="rounded-lg bg-white/5 px-4 py-2 text-sm font-bold text-slate-300 hover:bg-white/10">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                            {goal.name}
                            {isComplete && <span className="text-sm bg-green-500/20 text-green-400 px-2 py-1 rounded-md">Completed 🎉</span>}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startEditing(goal)} className="rounded-lg p-2 text-blue-400 hover:bg-white/10 transition-colors" title="Edit">✏️</button>
                          <button onClick={() => handleDelete(goal.id)} className="rounded-lg p-2 text-red-400 hover:bg-white/10 transition-colors" title="Delete">🗑️</button>
                        </div>
                      </div>
                    )}

                    {/* Progress Bar */}
                    <div className="mt-6 mb-4">
                      <div className="flex justify-between text-sm mb-2 font-mono">
                        <span className="text-cyan-400">{goal.current}</span>
                        <span className="text-slate-500">{goal.target}</span>
                      </div>
                      <div className="h-4 w-full bg-black/60 rounded-full overflow-hidden border border-white/5 relative">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 1, type: "spring" }}
                          className={`h-full rounded-full relative overflow-hidden ${
                            isComplete 
                              ? "bg-gradient-to-r from-green-400 to-emerald-500" 
                              : "bg-gradient-to-r from-cyan-400 to-blue-500"
                          }`}
                        >
                          <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite] -skew-x-12 translate-x-[-150%]"></div>
                        </motion.div>
                      </div>
                    </div>

                    {/* Update Controls */}
                    <div className="flex items-center gap-3 mt-4">
                      <span className="text-sm font-semibold text-slate-400 mr-2">Update Progress:</span>
                      
                      <button 
                        onClick={() => updateProgress(goal.id, goal.current - 1)}
                        className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xl font-bold transition-transform active:scale-95"
                      >
                        -
                      </button>
                      
                      <input 
                        type="number" 
                        value={goal.current || ""} 
                        onChange={(e) => {
                          const val = e.target.value ? parseInt(e.target.value) : 0;
                          updateProgress(goal.id, val);
                        }}
                        className="h-10 w-24 bg-black/40 border border-white/10 rounded-xl text-center font-mono focus:border-cyan-500 outline-none"
                      />
                      
                      <button 
                        onClick={() => updateProgress(goal.id, goal.current + 1)}
                        className="h-10 w-10 flex items-center justify-center rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30 text-xl font-bold transition-transform active:scale-95"
                      >
                        +
                      </button>
                      
                      <button 
                        onClick={() => updateProgress(goal.id, goal.current + 5)}
                        className="h-10 px-3 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-sm font-bold transition-transform active:scale-95"
                      >
                        +5
                      </button>
                      
                      <button 
                        onClick={() => updateProgress(goal.id, goal.current + 10)}
                        className="h-10 px-3 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-sm font-bold transition-transform active:scale-95"
                      >
                        +10
                      </button>
                    </div>

                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          100% { transform: translateX(150%); }
        }
      `}} />
    </div>
  );
}

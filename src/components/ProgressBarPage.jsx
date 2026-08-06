import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient";
import ParticleBackground from "./ParticleBackground";

export default function ProgressBarPage({ user }) {
  const [goals, setGoals] = useState([]);
  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalTarget, setNewGoalTarget] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editTarget, setEditTarget] = useState("");

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // 1. Fetch Goals from Supabase for the current user
  const fetchGoals = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    const { data: { user: currentUser } } = await supabase.auth.getUser();
    const activeUserId = user?.id || currentUser?.id;

    if (!activeUserId) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", activeUserId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching goals:", error);
      setErrorMessage("Could not load goals from database.");
    } else {
      setGoals(data ?? []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  // 2. Create Goal in Supabase
  const handleCreateGoal = async (e) => {
    e.preventDefault();
    if (!newGoalName.trim() || !newGoalTarget || Number(newGoalTarget) <= 0) return;

    const { data: { user: currentUser } } = await supabase.auth.getUser();
    const activeUserId = user?.id || currentUser?.id;

    if (!activeUserId) {
      setErrorMessage("User session not found. Please log in.");
      return;
    }

    const payload = {
      user_id: activeUserId,
      title: newGoalName.trim(),
      target_number: Number(newGoalTarget),
      current_progress: 0,
    };

    const { error } = await supabase.from("goals").insert([payload]);

    if (error) {
      console.error("Error creating goal:", error);
      setErrorMessage(`Failed to create goal: ${error.message}`);
    } else {
      setNewGoalName("");
      setNewGoalTarget("");
      fetchGoals();
    }
  };

  // 3. Delete Goal from Supabase
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this goal?")) return;

    const { error } = await supabase.from("goals").delete().eq("id", id);

    if (error) {
      console.error("Error deleting goal:", error);
      setErrorMessage(`Failed to delete goal: ${error.message}`);
    } else {
      fetchGoals();
    }
  };

  // 4. Update Goal Title & Target
  const handleUpdate = async (id) => {
    if (!editName.trim() || !editTarget || Number(editTarget) <= 0) return;

    const { error } = await supabase
      .from("goals")
      .update({
        title: editName.trim(),
        target_number: Number(editTarget),
      })
      .eq("id", id);

    if (error) {
      console.error("Error updating goal:", error);
      setErrorMessage(`Failed to update goal: ${error.message}`);
    } else {
      setEditingId(null);
      fetchGoals();
    }
  };

  // 5. Update Goal Progress
  const updateProgress = async (goal, newAmount) => {
    if (newAmount < 0) return;

    // Optional cap at target_number
    const cappedAmount = Math.min(newAmount, goal.target_number);

    // Optimistic UI update for smooth dragging/clicking
    setGoals((prevGoals) =>
      prevGoals.map((g) => (g.id === goal.id ? { ...g, current_progress: cappedAmount } : g))
    );

    const { error } = await supabase
      .from("goals")
      .update({ current_progress: cappedAmount })
      .eq("id", goal.id);

    if (error) {
      console.error("Error updating progress:", error);
      fetchGoals(); // Rollback if network update fails
    }
  };

  const startEditing = (goal) => {
    setEditingId(goal.id);
    setEditName(goal.title);
    setEditTarget(goal.target_number);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditName("");
    setEditTarget("");
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030508] p-6 pb-32 text-white md:p-8">
      <ParticleBackground />

      <div className="relative z-20 mx-auto mb-10 max-w-7xl">
        <h1 className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-3xl font-black uppercase text-transparent md:text-5xl">
          Progress Tracker
        </h1>
        <p className="mt-2 text-slate-400">Track your goals and monitor your performance metrics.</p>
      </div>

      {errorMessage && (
        <div className="relative z-20 mx-auto mb-6 max-w-7xl rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-300">
          {errorMessage}
        </div>
      )}

      <div className="relative z-20 mx-auto grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-3">
        {/* CREATE GOAL FORM */}
        <div className="h-fit rounded-3xl border border-white/5 bg-[#0a0f1c]/60 p-8 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl">
          <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-cyan-400">
            <span>🎯</span> Create New Goal
          </h2>

          <form onSubmit={handleCreateGoal} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">
                Goal Name
              </label>
              <input
                type="text"
                className="w-full rounded-xl border border-white/5 bg-black/40 p-4 outline-none transition-colors focus:border-cyan-500"
                placeholder="e.g. Marketing Calls"
                value={newGoalName}
                onChange={(e) => setNewGoalName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">
                Target Number
              </label>
              <input
                type="number"
                min="1"
                className="w-full rounded-xl border border-white/5 bg-black/40 p-4 outline-none transition-colors focus:border-cyan-500"
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
        <div className="space-y-6 lg:col-span-2">
          {loading && (
            <div className="rounded-3xl border border-white/5 bg-[#0a0f1c]/40 p-8 text-center text-slate-400">
              Loading your goals...
            </div>
          )}

          {!loading && goals.length === 0 && (
            <div className="rounded-3xl border border-white/5 bg-[#0a0f1c]/40 p-12 text-center backdrop-blur-xl">
              <div className="mb-4 text-4xl">🚀</div>
              <p className="text-xl font-semibold text-slate-300">No goals set yet</p>
              <p className="mt-2 text-sm text-slate-500">Create your first goal to start tracking progress.</p>
            </div>
          )}

          <AnimatePresence>
            {!loading &&
              goals.map((goal) => {
                const target = goal.target_number || 1;
                const current = goal.current_progress || 0;
                const percentage = Math.min(Math.round((current / target) * 100), 100);
                const isComplete = current >= target;

                return (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -20 }}
                    className="group relative overflow-hidden rounded-3xl border border-white/5 bg-[#0a0f1c]/60 p-6 shadow-lg backdrop-blur-xl transition-all hover:border-cyan-500/30"
                  >
                    {isComplete && (
                      <div className="pointer-events-none absolute inset-0 z-0 rounded-3xl bg-green-500/5 blur-3xl" />
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
                            <button
                              onClick={() => handleUpdate(goal.id)}
                              className="rounded-lg bg-green-500/20 px-4 py-2 text-sm font-bold text-green-400 hover:bg-green-500/30"
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="rounded-lg bg-white/5 px-4 py-2 text-sm font-bold text-slate-300 hover:bg-white/10"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mb-2 flex items-start justify-between">
                          <div>
                            <h3 className="flex items-center gap-3 text-2xl font-bold text-white">
                              {goal.title}
                              {isComplete && (
                                <span className="rounded-md bg-green-500/20 px-2 py-1 text-sm text-green-400">
                                  Completed 🎉
                                </span>
                              )}
                            </h3>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                            <button
                              onClick={() => startEditing(goal)}
                              className="rounded-lg p-2 text-blue-400 transition-colors hover:bg-white/10"
                              title="Edit"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDelete(goal.id)}
                              className="rounded-lg p-2 text-red-400 transition-colors hover:bg-white/10"
                              title="Delete"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Progress Bar */}
                      <div className="mb-4 mt-6">
                        <div className="mb-2 flex justify-between font-mono text-sm">
                          <span className="text-cyan-400">{current}</span>
                          <span className="text-slate-500">{target}</span>
                        </div>
                        <div className="relative h-4 w-full overflow-hidden rounded-full border border-white/5 bg-black/60">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.8, type: "spring" }}
                            className={`relative h-full overflow-hidden rounded-full ${
                              isComplete
                                ? "bg-gradient-to-r from-green-400 to-emerald-500"
                                : "bg-gradient-to-r from-cyan-400 to-blue-500"
                            }`}
                          >
                            <div className="absolute inset-0 h-full w-full -skew-x-12 translate-x-[-150%] bg-white/20 animate-[shimmer_2s_infinite]"></div>
                          </motion.div>
                        </div>
                      </div>

                      {/* Update Controls */}
                      <div className="mt-4 flex items-center gap-3">
                        <span className="mr-2 text-sm font-semibold text-slate-400">Update Progress:</span>

                        <button
                          onClick={() => updateProgress(goal, current - 1)}
                          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-xl font-bold transition-transform hover:bg-white/10 active:scale-95"
                        >
                          -
                        </button>

                        <input
                          type="number"
                          value={current || ""}
                          onChange={(e) => {
                            const val = e.target.value ? parseInt(e.target.value, 10) : 0;
                            updateProgress(goal, val);
                          }}
                          className="h-10 w-24 rounded-xl border border-white/10 bg-black/40 text-center font-mono outline-none focus:border-cyan-500"
                        />

                        <button
                          onClick={() => updateProgress(goal, current + 1)}
                          className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/20 text-xl font-bold text-cyan-400 transition-transform hover:bg-cyan-500/30 active:scale-95"
                        >
                          +
                        </button>

                        <button
                          onClick={() => updateProgress(goal, current + 5)}
                          className="flex h-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 text-sm font-bold transition-transform hover:bg-white/10 active:scale-95"
                        >
                          +5
                        </button>

                        <button
                          onClick={() => updateProgress(goal, current + 10)}
                          className="flex h-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 text-sm font-bold transition-transform hover:bg-white/10 active:scale-95"
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

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes shimmer {
          100% { transform: translateX(150%); }
        }
      `,
        }}
      />
    </div>
  );
}

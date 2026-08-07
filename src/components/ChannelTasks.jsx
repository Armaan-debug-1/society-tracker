import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import { supabase } from "../supabaseClient";
import ParticleBackground from "./ParticleBackground";

const PRIORITIES = ["P1", "P2", "P3", "P4", "P5"];
const POSITIONS = ["Eb", "Core", "Member"];

const EMPTY_TASK = {
  title: "",
  priority: "P1",
  deadline: "",
  position: "Member",
};

const EMPTY_LINK = {
  title: "",
  url: "",
  position: "Member",
};

const EMPTY_ANNOUNCEMENT = {
  title: "",
  content: "",
  position: "Member",
};

export default function ChannelTasks() {
  const { eventName, channelName } = useParams();

  const [activeTab, setActiveTab] = useState("tasks"); // tasks, links, announcements

  const [tasks, setTasks] = useState([]);
  const [links, setLinks] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  const [newTask, setNewTask] = useState(EMPTY_TASK);
  const [newLink, setNewLink] = useState(EMPTY_LINK);
  const [newAnnouncement, setNewAnnouncement] = useState(EMPTY_ANNOUNCEMENT);

  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");

  const [loadingTasks, setLoadingTasks] = useState(true);
  const [deployingTask, setDeployingTask] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const fetchTasks = useCallback(async () => {
    if (!eventName || !channelName) {
      setTasks([]);
      setLoadingTasks(false);
      return;
    }

    setLoadingTasks(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("channel_tasks")
      .select("*")
      .eq("event_name", eventName)
      .eq("channel_name", channelName)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Could not fetch channel tasks:", error);
      setErrorMessage(`Could not load tasks: ${error.message}`);
      setTasks([]);
      setLoadingTasks(false);
      return;
    }

    setTasks(data ?? []);
    setLoadingTasks(false);
  }, [eventName, channelName]);

  const loadLocalData = useCallback(() => {
    const linksKey = `links_${eventName}_${channelName}`;
    const annKey = `announcements_${eventName}_${channelName}`;
    
    const storedLinks = JSON.parse(localStorage.getItem(linksKey) || "[]");
    const storedAnn = JSON.parse(localStorage.getItem(annKey) || "[]");
    
    setLinks(storedLinks);
    setAnnouncements(storedAnn);
  }, [eventName, channelName]);

  useEffect(() => {
    fetchTasks();
    loadLocalData();
  }, [fetchTasks, loadLocalData]);

  const handleAddTask = async (event) => {
    event.preventDefault();

    const trimmedTitle = newTask.title.trim();

    if (!trimmedTitle) {
      setErrorMessage("Please enter a task description.");
      return;
    }

    if (!newTask.deadline) {
      setErrorMessage("Please select a deadline.");
      return;
    }

    if (!eventName || !channelName) {
      setErrorMessage("The event or channel name is missing.");
      return;
    }

    setDeployingTask(true);
    setErrorMessage("");
    setSuccessMessage("");

    const taskToInsert = {
      event_name: eventName,
      channel_name: channelName,
      title: trimmedTitle,
      priority: newTask.priority,
      deadline: newTask.deadline,
    };

    const { data, error } = await supabase
      .from("channel_tasks")
      .insert([taskToInsert])
      .select()
      .single();

    if (error) {
      console.error("Task deployment failed:", error);
      setErrorMessage(`Task could not be deployed: ${error.message}`);
      setDeployingTask(false);
      return;
    }

    setNewTask(EMPTY_TASK);
    setSuccessMessage("Task deployed successfully.");
    setDeployingTask(false);

    await fetchTasks();
    setTimeout(() => setSuccessMessage(""), 4000);
  };

  const handleAddLink = (event) => {
    event.preventDefault();
    if (!newLink.title || !newLink.url) {
      setErrorMessage("Title and URL are required.");
      return;
    }
    const newL = { id: Date.now().toString(), ...newLink, created_at: new Date().toISOString() };
    const updated = [newL, ...links];
    setLinks(updated);
    localStorage.setItem(`links_${eventName}_${channelName}`, JSON.stringify(updated));
    setNewLink(EMPTY_LINK);
    setSuccessMessage("Meeting link deployed!");
    setTimeout(() => setSuccessMessage(""), 4000);
  };

  const handleAddAnnouncement = (event) => {
    event.preventDefault();
    if (!newAnnouncement.title || !newAnnouncement.content) {
      setErrorMessage("Title and content are required.");
      return;
    }
    const newA = { id: Date.now().toString(), ...newAnnouncement, created_at: new Date().toISOString() };
    const updated = [newA, ...announcements];
    setAnnouncements(updated);
    localStorage.setItem(`announcements_${eventName}_${channelName}`, JSON.stringify(updated));
    setNewAnnouncement(EMPTY_ANNOUNCEMENT);
    setSuccessMessage("Announcement deployed!");
    setTimeout(() => setSuccessMessage(""), 4000);
  };

  const handleDelete = async (taskId) => {
    const shouldDelete = window.confirm("Are you sure you want to delete this task?");
    if (!shouldDelete) return;

    setErrorMessage("");
    setSuccessMessage("");

    const { error } = await supabase
      .from("channel_tasks")
      .delete()
      .eq("id", taskId);

    if (error) {
      setErrorMessage(`Task could not be deleted: ${error.message}`);
      return;
    }

    setSuccessMessage("Task deleted successfully.");
    await fetchTasks();
  };
  
  const handleDeleteLink = (id) => {
    const updated = links.filter(l => l.id !== id);
    setLinks(updated);
    localStorage.setItem(`links_${eventName}_${channelName}`, JSON.stringify(updated));
  };
  
  const handleDeleteAnnouncement = (id) => {
    const updated = announcements.filter(a => a.id !== id);
    setAnnouncements(updated);
    localStorage.setItem(`announcements_${eventName}_${channelName}`, JSON.stringify(updated));
  };

  const startEditing = (task) => {
    setEditingId(task.id);
    setEditTitle(task.title);
    setErrorMessage("");
    setSuccessMessage("");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditTitle("");
  };

  const handleUpdate = async (taskId) => {
    const trimmedTitle = editTitle.trim();
    if (!trimmedTitle) {
      setErrorMessage("Task description cannot be empty.");
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");

    const { error } = await supabase
      .from("channel_tasks")
      .update({ title: trimmedTitle })
      .eq("id", taskId);

    if (error) {
      setErrorMessage(`Task could not be updated: ${error.message}`);
      return;
    }

    setEditingId(null);
    setEditTitle("");
    setSuccessMessage("Task updated successfully.");

    await fetchTasks();
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030508] p-6 text-white md:p-8">
      <ParticleBackground />

      <div className="relative z-20 mx-auto mb-10 flex max-w-7xl flex-col items-start justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-500">
            Events / {eventName}
          </p>

          <h1 className={`bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text font-black uppercase text-transparent ${channelName?.length > 14 ? 'text-2xl md:text-3xl lg:text-4xl' : 'text-3xl md:text-5xl'}`}>
            {channelName?.replace(/-/g, " ")}
          </h1>
        </div>
        
        <div className="flex gap-4 items-center mt-4 md:mt-0">
          <button 
            onClick={() => setActiveTab('tasks')}
            className={`relative rounded-full px-4 py-2 text-sm transition-all font-bold ${activeTab === 'tasks' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 hover:bg-white/10 text-slate-400'}`}
          >
            Tasks
            <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500 text-[10px] text-white">
              {tasks.length}
            </span>
          </button>
          <button 
            onClick={() => setActiveTab('links')}
            className={`relative rounded-full px-4 py-2 text-sm transition-all font-bold ${activeTab === 'links' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 hover:bg-white/10 text-slate-400'}`}
          >
            Meeting Links
            <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500 text-[10px] text-white">
              {links.length}
            </span>
          </button>
          <button 
            onClick={() => setActiveTab('announcements')}
            className={`relative rounded-full px-4 py-2 text-sm transition-all font-bold ${activeTab === 'announcements' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 hover:bg-white/10 text-slate-400'}`}
          >
            Announcements
            <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500 text-[10px] text-white">
              {announcements.length}
            </span>
          </button>
        </div>

        <Link
          to="/home"
          className="rounded-xl border border-white/10 bg-white/5 px-6 py-2 text-sm transition-all hover:bg-white/10"
        >
          Back to Channels
        </Link>
      </div>

      <div className="relative z-20 mx-auto mb-6 max-w-7xl">
        {errorMessage && (
          <div className="mb-4 rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-300">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 rounded-xl border border-green-400/30 bg-green-500/10 p-4 text-sm text-green-300">
            {successMessage}
          </div>
        )}
      </div>

      <div className="relative z-20 mx-auto grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-3">
        {/* FORM SECTION */}
        <div className="h-fit rounded-3xl border border-white/5 bg-[#0a0f1c]/60 p-8 backdrop-blur-xl">
          <h2 className="mb-6 text-xl font-bold text-cyan-400">
            Deploy New {activeTab === 'tasks' ? 'Task' : activeTab === 'links' ? 'Link' : 'Announcement'}
          </h2>

          {activeTab === 'tasks' && (
            <form onSubmit={handleAddTask} className="space-y-4">
              <input
                type="text"
                className="w-full rounded-xl border border-white/5 bg-black/40 p-4 outline-none focus:border-cyan-500"
                placeholder="Task description..."
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                disabled={deployingTask}
                required
              />
              <select
                className="w-full cursor-pointer appearance-none rounded-xl border border-white/5 bg-black/40 p-4 outline-none"
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                disabled={deployingTask}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p} className="bg-[#0a0f1c]">{p}</option>
                ))}
              </select>
              <select
                className="w-full cursor-pointer appearance-none rounded-xl border border-white/5 bg-black/40 p-4 outline-none"
                value={newTask.position}
                onChange={(e) => setNewTask({ ...newTask, position: e.target.value })}
                disabled={deployingTask}
              >
                {POSITIONS.map((pos) => (
                  <option key={pos} value={pos} className="bg-[#0a0f1c]">{pos}</option>
                ))}
              </select>
              <input
                type="date"
                className="w-full cursor-pointer rounded-xl border border-white/5 bg-black/40 p-4 text-slate-300 outline-none"
                value={newTask.deadline}
                onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                onClick={(e) => e.currentTarget.showPicker && e.currentTarget.showPicker()}
                style={{ colorScheme: "dark" }}
                disabled={deployingTask}
                required
              />
              <button
                type="submit"
                disabled={deployingTask}
                className="w-full rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 py-4 font-bold transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deployingTask ? "Deploying..." : "Deploy Task"}
              </button>
            </form>
          )}

          {activeTab === 'links' && (
            <form onSubmit={handleAddLink} className="space-y-4">
              <input
                type="text"
                className="w-full rounded-xl border border-white/5 bg-black/40 p-4 outline-none focus:border-cyan-500"
                placeholder="Meeting Title..."
                value={newLink.title}
                onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
                required
              />
              <input
                type="url"
                className="w-full rounded-xl border border-white/5 bg-black/40 p-4 outline-none focus:border-cyan-500"
                placeholder="Meeting URL (https://...)"
                value={newLink.url}
                onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                required
              />
              <select
                className="w-full cursor-pointer appearance-none rounded-xl border border-white/5 bg-black/40 p-4 outline-none"
                value={newLink.position}
                onChange={(e) => setNewLink({ ...newLink, position: e.target.value })}
              >
                {POSITIONS.map((pos) => (
                  <option key={pos} value={pos} className="bg-[#0a0f1c]">{pos}</option>
                ))}
              </select>
              <button
                type="submit"
                className="w-full rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 py-4 font-bold transition-transform hover:scale-[1.01]"
              >
                Deploy Link
              </button>
            </form>
          )}

          {activeTab === 'announcements' && (
            <form onSubmit={handleAddAnnouncement} className="space-y-4">
              <input
                type="text"
                className="w-full rounded-xl border border-white/5 bg-black/40 p-4 outline-none focus:border-cyan-500"
                placeholder="Announcement Title..."
                value={newAnnouncement.title}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                required
              />
              <textarea
                className="w-full rounded-xl border border-white/5 bg-black/40 p-4 outline-none focus:border-cyan-500 min-h-[100px]"
                placeholder="Announcement Content..."
                value={newAnnouncement.content}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                required
              />
              <select
                className="w-full cursor-pointer appearance-none rounded-xl border border-white/5 bg-black/40 p-4 outline-none"
                value={newAnnouncement.position}
                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, position: e.target.value })}
              >
                {POSITIONS.map((pos) => (
                  <option key={pos} value={pos} className="bg-[#0a0f1c]">{pos}</option>
                ))}
              </select>
              <button
                type="submit"
                className="w-full rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 py-4 font-bold transition-transform hover:scale-[1.01]"
              >
                Deploy Announcement
              </button>
            </form>
          )}
        </div>

        {/* LIST SECTION */}
        <div className="space-y-4 lg:col-span-2">
          {activeTab === 'tasks' && (
            <>
              {loadingTasks && (
                <div className="rounded-2xl border border-white/5 bg-[#0a0f1c]/40 p-6 text-slate-400">
                  Loading tasks...
                </div>
              )}
              {!loadingTasks && tasks.length === 0 && (
                <div className="rounded-2xl border border-white/5 bg-[#0a0f1c]/40 p-8 text-center">
                  <p className="font-semibold text-slate-300">No tasks deployed yet</p>
                </div>
              )}
              <AnimatePresence>
                {tasks.map((task) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="group flex items-center justify-between rounded-2xl border border-white/5 bg-[#0a0f1c]/40 p-6 transition-all hover:border-white/10"
                  >
                    {editingId === task.id ? (
                      <input
                        type="text"
                        className="w-full rounded border border-cyan-500 bg-black/50 p-2 text-white outline-none"
                        value={editTitle}
                        onChange={(event) => setEditTitle(event.target.value)}
                        autoFocus
                      />
                    ) : (
                      <div>
                        <p className="text-lg font-bold text-white">{task.title}</p>
                        <p className="mt-1 font-mono text-xs text-slate-500">📅 {task.deadline}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-3 pl-4">
                      <span className={`rounded-lg px-3 py-1 text-[10px] font-black ${task.priority === "P1" ? "bg-red-500/20 text-red-400" : "bg-cyan-500/20 text-cyan-400"}`}>
                        {task.priority}
                      </span>
                      {editingId === task.id ? (
                        <div className="flex gap-2">
                          <button onClick={() => handleUpdate(task.id)} className="font-bold text-green-400 hover:text-green-300">Save</button>
                          <button onClick={cancelEditing} className="font-bold text-slate-400 hover:text-white">Cancel</button>
                        </div>
                      ) : (
                        <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                          <button onClick={() => startEditing(task)} className="rounded-lg p-2 text-blue-400 hover:bg-white/5">✏️</button>
                          <button onClick={() => handleDelete(task.id)} className="rounded-lg p-2 text-red-400 hover:bg-white/5">🗑️</button>
                          <button onClick={() => handleDelete(task.id)} className="rounded-lg p-2 text-green-400 hover:bg-white/5">✔</button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </>
          )}

          {activeTab === 'links' && (
            <>
              {links.length === 0 && (
                <div className="rounded-2xl border border-white/5 bg-[#0a0f1c]/40 p-8 text-center">
                  <p className="font-semibold text-slate-300">No meeting links deployed yet</p>
                </div>
              )}
              <AnimatePresence>
                {links.map((link) => (
                  <motion.div
                    key={link.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="group flex items-center justify-between rounded-2xl border border-white/5 bg-[#0a0f1c]/40 p-6 transition-all hover:border-cyan-500/30"
                  >
                    <div>
                      <p className="text-lg font-bold text-cyan-300">{link.title}</p>
                      <a href={link.url} target="_blank" rel="noreferrer" className="mt-1 text-sm text-cyan-400 underline">{link.url}</a>
                      <p className="mt-2 font-mono text-xs text-slate-500">For: {link.position}</p>
                    </div>
                    <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <button onClick={() => handleDeleteLink(link.id)} className="rounded-lg p-2 text-red-400 hover:bg-white/5">🗑️</button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </>
          )}

          {activeTab === 'announcements' && (
            <>
              {announcements.length === 0 && (
                <div className="rounded-2xl border border-white/5 bg-[#0a0f1c]/40 p-8 text-center">
                  <p className="font-semibold text-slate-300">No announcements deployed yet</p>
                </div>
              )}
              <AnimatePresence>
                {announcements.map((ann) => (
                  <motion.div
                    key={ann.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="group flex items-center justify-between rounded-2xl border border-white/5 bg-[#0a0f1c]/40 p-6 transition-all hover:border-cyan-500/30"
                  >
                    <div className="w-full">
                      <div className="flex justify-between w-full">
                        <p className="text-lg font-bold text-cyan-300">{ann.title}</p>
                        <button onClick={() => handleDeleteAnnouncement(ann.id)} className="rounded-lg p-2 text-red-400 hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity">🗑️</button>
                      </div>
                      <p className="mt-2 text-slate-300 bg-black/20 p-3 rounded-xl">{ann.content}</p>
                      <p className="mt-3 font-mono text-xs text-cyan-500/70">Target: {ann.position}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
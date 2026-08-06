import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import { supabase } from "../supabaseClient";
import ParticleBackground from "./ParticleBackground";

const PRIORITIES = ["P1", "P2", "P3", "P4", "P5"];

const EMPTY_TASK = {
  title: "",
  priority: "P1",
  deadline: "",
};

export default function ChannelTasks() {
  const { eventName, channelName } = useParams();

  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState(EMPTY_TASK);

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

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

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

    console.log("Deploying task:", taskToInsert);

    const { data, error } = await supabase
      .from("channel_tasks")
      .insert([taskToInsert])
      .select()
      .single();

    if (error) {
      console.error("Task deployment failed:", error);

      setErrorMessage(
        `Task could not be deployed: ${error.message}`
      );

      setDeployingTask(false);
      return;
    }

    console.log("Task deployed successfully:", data);

    setNewTask(EMPTY_TASK);
    setSuccessMessage(
      "Task deployed successfully. Notifications should now be created automatically."
    );
    setDeployingTask(false);

    await fetchTasks();

    window.setTimeout(() => {
      setSuccessMessage("");
    }, 4000);
  };

  const handleDelete = async (taskId) => {
    const shouldDelete = window.confirm(
      "Are you sure you want to delete this task?"
    );

    if (!shouldDelete) {
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");

    const { error } = await supabase
      .from("channel_tasks")
      .delete()
      .eq("id", taskId);

    if (error) {
      console.error("Task deletion failed:", error);
      setErrorMessage(
        `Task could not be deleted: ${error.message}`
      );
      return;
    }

    setSuccessMessage("Task deleted successfully.");
    await fetchTasks();
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
      .update({
        title: trimmedTitle,
      })
      .eq("id", taskId);

    if (error) {
      console.error("Task update failed:", error);
      setErrorMessage(
        `Task could not be updated: ${error.message}`
      );
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

          <h1 className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-3xl font-black uppercase text-transparent md:text-5xl">
            {channelName?.replace(/-/g, " ")}
          </h1>
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
        <div className="h-fit rounded-3xl border border-white/5 bg-[#0a0f1c]/60 p-8 backdrop-blur-xl">
          <h2 className="mb-6 text-xl font-bold text-cyan-400">
            Deploy New Task
          </h2>

          <form
            onSubmit={handleAddTask}
            className="space-y-4"
          >
            <input
              type="text"
              className="w-full rounded-xl border border-white/5 bg-black/40 p-4 outline-none focus:border-cyan-500"
              placeholder="Task description..."
              value={newTask.title}
              onChange={(event) =>
                setNewTask((currentTask) => ({
                  ...currentTask,
                  title: event.target.value,
                }))
              }
              disabled={deployingTask}
              required
            />

            <select
              className="w-full cursor-pointer appearance-none rounded-xl border border-white/5 bg-black/40 p-4 outline-none"
              value={newTask.priority}
              onChange={(event) =>
                setNewTask((currentTask) => ({
                  ...currentTask,
                  priority: event.target.value,
                }))
              }
              disabled={deployingTask}
            >
              {PRIORITIES.map((priority) => (
                <option
                  key={priority}
                  value={priority}
                  className="bg-[#0a0f1c]"
                >
                  {priority}
                </option>
              ))}
            </select>

            <input
              type="date"
              className="w-full cursor-pointer rounded-xl border border-white/5 bg-black/40 p-4 text-slate-300 outline-none"
              value={newTask.deadline}
              onChange={(event) =>
                setNewTask((currentTask) => ({
                  ...currentTask,
                  deadline: event.target.value,
                }))
              }
              onClick={(event) => {
                if (event.currentTarget.showPicker) {
                  event.currentTarget.showPicker();
                }
              }}
              style={{
                colorScheme: "dark",
              }}
              disabled={deployingTask}
              required
            />

            <button
              type="submit"
              disabled={deployingTask}
              className="w-full rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 py-4 font-bold transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {deployingTask
                ? "Deploying..."
                : "Deploy Task"}
            </button>
          </form>
        </div>

        <div className="space-y-4 lg:col-span-2">
          {loadingTasks && (
            <div className="rounded-2xl border border-white/5 bg-[#0a0f1c]/40 p-6 text-slate-400">
              Loading tasks...
            </div>
          )}

          {!loadingTasks && tasks.length === 0 && (
            <div className="rounded-2xl border border-white/5 bg-[#0a0f1c]/40 p-8 text-center">
              <p className="font-semibold text-slate-300">
                No tasks deployed yet
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Deploy the first task for this channel.
              </p>
            </div>
          )}

          <AnimatePresence>
            {tasks.map((task) => (
              <motion.div
                key={task.id}
                initial={{
                  opacity: 0,
                  y: 20,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  x: -20,
                }}
                className="group flex items-center justify-between rounded-2xl border border-white/5 bg-[#0a0f1c]/40 p-6 transition-all hover:border-white/10"
              >
                {editingId === task.id ? (
                  <input
                    type="text"
                    className="w-full rounded border border-cyan-500 bg-black/50 p-2 text-white outline-none"
                    value={editTitle}
                    onChange={(event) =>
                      setEditTitle(event.target.value)
                    }
                    autoFocus
                  />
                ) : (
                  <div>
                    <p className="text-lg font-bold text-white">
                      {task.title}
                    </p>

                    <p className="mt-1 font-mono text-xs text-slate-500">
                      📅 {task.deadline}
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-3 pl-4">
                  <span
                    className={`rounded-lg px-3 py-1 text-[10px] font-black ${
                      task.priority === "P1"
                        ? "bg-red-500/20 text-red-400"
                        : "bg-cyan-500/20 text-cyan-400"
                    }`}
                  >
                    {task.priority}
                  </span>

                  {editingId === task.id ? (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdate(task.id)
                        }
                        className="font-bold text-green-400 hover:text-green-300"
                      >
                        Save
                      </button>

                      <button
                        type="button"
                        onClick={cancelEditing}
                        className="font-bold text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => startEditing(task)}
                        className="rounded-lg p-2 text-blue-400 hover:bg-white/5"
                        title="Edit task"
                      >
                        ✏️
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(task.id)
                        }
                        className="rounded-lg p-2 text-red-400 hover:bg-white/5"
                        title="Delete task"
                      >
                        🗑️
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(task.id)
                        }
                        className="rounded-lg p-2 text-green-400 hover:bg-white/5"
                        title="Complete task"
                      >
                        ✔
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
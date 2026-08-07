import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { supabase } from "../supabaseClient";
import ParticleBackground from "./ParticleBackground";

export default function Profile({ user }) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [formData, setFormData] = useState({
    fullName: "",
    contact: "",
    gender: "",
    association: "",
    password: "",
  });

  // Fetch profile details directly from Supabase
  const fetchProfileData = useCallback(async () => {
    const activeUserId = user?.id;
    if (!activeUserId) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("full_name, contact, gender, association")
      .eq("id", activeUserId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching profile:", error);
      setMessage({ type: "error", text: "Could not load profile details." });
    } else if (data) {
      setFormData({
        fullName: data.full_name || "",
        contact: data.contact || "",
        gender: data.gender || "",
        association: data.association || "",
        password: "", // Kept blank for security
      });
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  // Handle Save (Profile Updates + Password Reset via Supabase)
  const handleSave = async () => {
    const activeUserId = user?.id;
    if (!activeUserId) {
      setMessage({ type: "error", text: "User session expired. Please log in again." });
      return;
    }

    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      // 1. Update Profile Information in Supabase DB Table
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: formData.fullName,
          contact: formData.contact,
          gender: formData.gender,
          association: formData.association,
        })
        .eq("id", activeUserId);

      if (profileError) throw profileError;

      // 2. Update Password if user entered a new one
      if (formData.password.trim().length > 0) {
        if (formData.password.trim().length < 6) {
          throw new Error("Password must be at least 6 characters long.");
        }

        const { error: passwordError } = await supabase.auth.updateUser({
          password: formData.password.trim(),
        });

        if (passwordError) throw passwordError;
      }

      setMessage({ type: "success", text: "Profile & Registry updated successfully!" });
      setIsEditing(false);
      setFormData((prev) => ({ ...prev, password: "" })); // Reset password field
      await fetchProfileData();
    } catch (err) {
      console.error("Profile save error:", err);
      setMessage({ type: "error", text: err.message || "Failed to update profile." });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage({ type: "", text: "" }), 4000);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#030508] font-sans text-white">
      <ParticleBackground />

      {/* Added pb-28 and sm:pb-32 here to prevent the floating dock from hiding the form */}
      <main className="relative z-20 mx-auto mt-4 flex-grow w-full max-w-5xl p-4 pb-28 md:mt-10 sm:p-8 sm:pb-32">
        
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 10 }}
          className="mb-8 md:mb-12 text-center md:text-left"
        >
          {/* Scaled text size for mobile */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-[0.1em] text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">
            PROFILE
          </h1>
        </motion.div>

        {/* Feedback Message Alert */}
        {message.text && (
          <div
            className={`mb-6 rounded-2xl border p-4 text-sm font-medium ${
              message.type === "error"
                ? "border-red-500/30 bg-red-500/10 text-red-300"
                : "border-green-500/30 bg-green-500/10 text-green-300"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:gap-8 md:grid-cols-3">
          {/* Avatar Card */}
          <motion.div
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="group relative flex flex-col items-center overflow-hidden rounded-[2rem] md:rounded-[2.5rem] border border-white/10 bg-[#0a0f1c]/70 p-8 sm:p-10 text-center shadow-2xl backdrop-blur-2xl transition-all hover:border-cyan-500/50"
          >
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="mb-6 md:mb-8 flex h-28 w-28 md:h-32 md:w-32 items-center justify-center rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-500 text-4xl md:text-5xl font-black text-white shadow-[0_0_50px_rgba(6,182,212,0.6)]"
            >
              {user?.email?.charAt(0).toUpperCase() || "U"}
            </motion.div>
            <h3 className="text-2xl md:text-3xl font-bold">{formData.fullName || "New User"}</h3>
            <p className="mt-2 md:mt-3 break-all font-mono text-xs md:text-sm tracking-widest text-slate-400">
              {user?.email}
            </p>
          </motion.div>

          {/* Registry Details Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 80 }}
            className="space-y-8 md:space-y-10 rounded-[2rem] md:rounded-[2.5rem] border border-white/10 bg-[#0a0f1c]/70 p-6 sm:p-10 shadow-2xl backdrop-blur-2xl transition-all hover:border-white/20 md:col-span-2"
          >
            {/* Action Bar: Stacks vertically on mobile, horizontally on sm+ */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-0 border-b border-white/5 pb-6">
              <h4 className="text-sm font-black uppercase tracking-[0.3em] text-cyan-400 text-center sm:text-left">
                Registry Details
              </h4>
              
              {/* Buttons: Full width on mobile */}
              <div className="flex w-full sm:w-auto flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
                  disabled={saving || loading}
                  className="w-full sm:w-auto rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 px-6 py-3 sm:px-10 sm:py-4 text-xs font-black uppercase tracking-[0.2em] text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all hover:bg-cyan-600 active:scale-95 disabled:opacity-50"
                >
                  {saving ? "Saving..." : isEditing ? "Save Changes" : "Edit Registry"}
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full sm:w-auto rounded-xl sm:rounded-2xl border border-red-500/20 bg-red-500/10 px-6 py-3 sm:px-10 sm:py-4 text-xs font-black uppercase tracking-[0.2em] text-white transition-all hover:border-red-500 hover:bg-red-600 hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] active:scale-95"
                >
                  Logout
                </button>
              </div>
            </div>

            {loading ? (
              <div className="p-8 text-center text-slate-400">Loading profile information...</div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:gap-8 sm:grid-cols-2">
                {[
                  { label: "Full Name", name: "fullName", placeholder: "e.g. John Doe" },
                  { label: "Contact", name: "contact", placeholder: "e.g. +1234567890" },
                  { label: "Gender", name: "gender", placeholder: "e.g. Male / Female / Other" },
                  { label: "Association", name: "association", placeholder: "e.g. Core Team" },
                  {
                    label: "New Password",
                    name: "password",
                    type: "password",
                    placeholder: "Enter new password to update...",
                  },
                ].map((field) => (
                  <motion.div key={field.name} whileHover={{ y: -5 }}>
                    <label className="mb-2 sm:mb-4 block text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                      {field.label}
                    </label>
                    {isEditing ? (
                      <input
                        type={field.type || "text"}
                        name={field.name}
                        placeholder={field.placeholder}
                        value={formData[field.name]}
                        onChange={(e) =>
                          setFormData({ ...formData, [field.name]: e.target.value })
                        }
                        className="w-full rounded-xl sm:rounded-2xl border border-white/10 bg-black/50 px-4 py-3 sm:px-6 sm:py-5 text-sm sm:text-base shadow-inner outline-none transition-all focus:border-cyan-500"
                      />
                    ) : (
                      <div className="w-full rounded-xl sm:rounded-2xl border border-white/5 bg-black/30 px-4 py-3 sm:px-6 sm:py-5 text-sm sm:text-base font-medium tracking-wide text-slate-200 truncate">
                        {field.type === "password"
                          ? "••••••••"
                          : formData[field.name] || "Not set"}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
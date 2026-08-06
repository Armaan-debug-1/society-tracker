import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

const AdminPanel = () => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const rolesList = [
    "ADMIN",
    "EB",
    "CORE",
    "OEC",
    "EMH",
    "OC",
    "TECHNICAL",
    "MARKETING",
    "DESIGN",
    "MEDIA",
    "CONTENT",
    "PUBLICITY",
    "CREATIVITY",
    "MEMBER-1",
    "MEMBER-2",
  ];

  const fetchProfiles = useCallback(async () => {
    const { data, error } = await supabase.from("profiles").select("*");
    if (error) {
      console.error("Error fetching profiles:", error);
      setErrorMessage(`Failed to fetch profiles: ${error.message}`);
    } else {
      setProfiles(data ?? []);
    }
    setLoading(false);
  }, []);

  const checkAdminAndFetch = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return navigate("/login");

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (error || !profile) {
      alert("Access Denied: Could not verify permissions!");
      navigate("/home");
      return;
    }

    const roles = profile.role || [];
    const isAdmin = roles.some((r) => String(r).toUpperCase() === "ADMIN");

    if (!isAdmin) {
      alert("Access Denied: You are not an Admin!");
      navigate("/home");
      return;
    }

    await fetchProfiles();
  }, [navigate, fetchProfiles]);

  useEffect(() => {
    checkAdminAndFetch();
  }, [checkAdminAndFetch]);

  async function toggleRole(targetUserId, currentRoles = [], roleToToggle) {
    const safeRoles = Array.isArray(currentRoles) ? currentRoles : [];
    
    // Toggle role presence in array
    const newRoles = safeRoles.includes(roleToToggle)
      ? safeRoles.filter((r) => r !== roleToToggle)
      : [...safeRoles, roleToToggle];

    setErrorMessage("");

    // Optimistic UI Update (instant visual feedback)
    setProfiles((prev) =>
      prev.map((p) => (p.id === targetUserId ? { ...p, role: newRoles } : p))
    );

    // Save to Supabase
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRoles })
      .eq("id", targetUserId);

    if (error) {
      console.error("Failed to update role:", error);
      setErrorMessage(`Failed to update user role: ${error.message}`);
      // Revert optimistic update on error
      await fetchProfiles();
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#030508] p-10 font-mono text-cyan-400">
        Loading Security Checks...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030508] p-6 text-white md:p-10">
      <div className="mx-auto max-w-7xl">
        <h2 className="mb-8 text-3xl font-black text-cyan-400 md:text-4xl">
          Admin Dashboard
        </h2>

        {errorMessage && (
          <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {errorMessage}
          </div>
        )}

        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10 text-sm font-bold text-cyan-400">
                <th className="p-4">Email</th>
                <th className="p-4">Roles Management</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => {
                const userRoles = Array.isArray(p.role) ? p.role : [];
                return (
                  <tr
                    key={p.id}
                    className="border-b border-white/5 transition-colors hover:bg-white/5"
                  >
                    <td className="p-4 font-mono text-sm text-slate-300">
                      {p.email || "No Email Provided"}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-2">
                        {rolesList.map((role) => {
                          const isActive = userRoles.includes(role);
                          return (
                            <button
                              key={role}
                              onClick={() => toggleRole(p.id, userRoles, role)}
                              className={`rounded-full border px-3 py-1 text-[10px] font-bold transition-all active:scale-95 ${
                                isActive
                                  ? "border-cyan-400 bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                                  : "border-white/20 bg-transparent text-white hover:border-white"
                              }`}
                            >
                              {role}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <footer className="mt-10 border-t border-white/10 pt-5 text-center font-mono text-xs text-slate-500">
          © 2026 Society Tracker | Admin Restricted Area
        </footer>
      </div>
    </div>
  );
};

export default AdminPanel;

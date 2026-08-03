import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import ParticleBackground from "./ParticleBackground";
import { supabase } from "../supabaseClient";

const channelAccess = {
  "General Announcement": [
    "EB",
    "CORE",
    "OEC",
    "EMH",
    "OC",
    "MEMBER",
    "MEMBER-1",
    "MEMBER-2",
    "ADMIN",
  ],

  EB: ["EB", "ADMIN"],

  CORE: ["EB", "CORE", "ADMIN"],

  "OEC & EMH": [
    "EB",
    "CORE",
    "OEC",
    "EMH",
    "ADMIN",
  ],

  OC: ["EB", "CORE", "OC", "ADMIN"],

  TECHNICAL: [
    "EB",
    "CORE",
    "OEC",
    "TECHNICAL",
    "ADMIN",
  ],

  MARKETING: [
    "EB",
    "CORE",
    "OEC",
    "MARKETING",
    "ADMIN",
  ],

  DESIGN: ["EB", "CORE", "DESIGN", "ADMIN"],

  MEDIA: [
    "EB",
    "CORE",
    "EMH",
    "MEDIA",
    "ADMIN",
  ],

  CONTENT: ["EB", "CORE", "CONTENT", "ADMIN"],

  PUBLICITY: [
    "EB",
    "CORE",
    "EMH",
    "PUBLICITY",
    "ADMIN",
  ],

  CREATIVITY: [
    "EB",
    "CORE",
    "CREATIVITY",
    "ADMIN",
  ],

  "1st YEAR ONLY": [
    "EB",
    "CORE",
    "MEMBER-1",
    "ADMIN",
  ],

  "General Chat": [
    "EB",
    "CORE",
    "OEC",
    "EMH",
    "OC",
    "MEMBER",
    "MEMBER-1",
    "MEMBER-2",
    "ADMIN",
  ],
};

function normaliseRole(role) {
  const normalisedRole = String(role ?? "")
    .trim()
    .toUpperCase();

  // Support the old role name temporarily
  if (normalisedRole === "CORE_MEMBER") {
    return "CORE";
  }

  return normalisedRole;
}

function createChannelSlug(channelName) {
  return channelName
    .toLowerCase()
    .replace(/ & /g, "-")
    .replace(/\s+/g, "-");
}

function EventPage() {
  const { eventName } = useParams();

  const [userRole, setUserRole] = useState("");
  const [loadingRole, setLoadingRole] = useState(true);
  const [roleError, setRoleError] = useState("");

  const subheadings = Object.keys(channelAccess);

  useEffect(() => {
    let isMounted = true;

    async function loadUserRole() {
      try {
        setLoadingRole(true);
        setRoleError("");

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          if (isMounted) {
            setUserRole("");
            setRoleError("Please log in to access channels.");
          }

          return;
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        if (error) {
          throw error;
        }

        const role = normaliseRole(data?.role);

        console.log("Supabase role:", data?.role);
        console.log("Normalised role:", role);

        if (isMounted) {
          setUserRole(role);
        }
      } catch (error) {
        console.error("Could not load user role:", error);

        if (isMounted) {
          setUserRole("");
          setRoleError(
            error instanceof Error
              ? error.message
              : "Unable to load your role."
          );
        }
      } finally {
        if (isMounted) {
          setLoadingRole(false);
        }
      }
    }

    loadUserRole();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#030508] text-white">
      <ParticleBackground />

      <div className="pointer-events-none absolute left-[-10%] top-[-10%] h-[500px] w-[500px] rounded-full bg-indigo-600/15 blur-[120px]" />

      <header className="relative z-10 p-8">
        <Link
          to="/home"
          className="text-sm text-slate-400 hover:text-white"
        >
          ← Back to Home
        </Link>

        <h1 className="mt-4 text-4xl font-black capitalize">
          {eventName?.replaceAll("-", " ")}
        </h1>

        {!loadingRole && userRole && (
          <p className="mt-2 font-mono text-xs uppercase text-cyan-400">
            Role: {userRole}
          </p>
        )}
      </header>

      <main className="relative z-10 mx-auto w-full max-w-7xl flex-grow px-8 py-4">
        <h3 className="mb-6 text-sm font-semibold uppercase tracking-widest text-slate-400">
          Channels / Roles
        </h3>

        {loadingRole && (
          <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">
            Checking channel access...
          </div>
        )}

        {roleError && (
          <div className="mb-6 rounded-xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-300">
            {roleError}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {subheadings.map((channel) => {
            const allowedRoles =
              channelAccess[channel] ?? [];

            const canAccess =
              !loadingRole &&
              userRole &&
              allowedRoles.includes(userRole);

            const channelSlug =
              createChannelSlug(channel);

            return (
              <Link
                key={channel}
                to={
                  canAccess
                    ? `/event/${eventName}/${channelSlug}`
                    : "#"
                }
                onClick={(event) => {
                  if (!canAccess) {
                    event.preventDefault();
                  }
                }}
                className={`rounded-2xl border bg-[#0a0f1c]/60 p-6 text-center text-sm font-bold backdrop-blur-xl transition-all duration-300 ${
                  canAccess
                    ? "border-white/10 hover:border-cyan-500/50 hover:bg-[#111827] hover:shadow-[0_0_20px_rgba(56,189,248,0.2)]"
                    : "cursor-not-allowed border-white/5 opacity-50"
                }`}
              >
                {channel}

                {!canAccess && !loadingRole && (
                  <div className="mt-2 text-xs opacity-50">
                    🔒 Locked
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}

export default EventPage;
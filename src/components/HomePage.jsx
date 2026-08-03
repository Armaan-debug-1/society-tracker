import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

import ParticleBackground from "./ParticleBackground";
import NotificationBell from "./NotificationBell";
import { supabase } from "../supabaseClient";

const EVENTS = [
  {
    name: "Soc Fair",
    path: "/event/soc-fair",
    image: "/soc-fair.jpeg",
  },
  {
    name: "ISTE X SAT",
    path: "/event/iste-sat",
    image: "/iste-sat.jpeg",
  },
  {
    name: "Colloquium",
    path: "/event/colloquium",
    image: "/colloquium.jpeg",
  },
  {
    name: "ISTE X HELIX",
    path: "/event/iste-helix",
    image: "/iste-helix.jpeg",
  },
];

const CHANNEL_ACCESS = {
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

  DESIGN: [
    "EB",
    "CORE",
    "DESIGN",
    "ADMIN",
  ],

  MEDIA: [
    "EB",
    "CORE",
    "EMH",
    "MEDIA",
    "ADMIN",
  ],

  CONTENT: [
    "EB",
    "CORE",
    "CONTENT",
    "ADMIN",
  ],

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

function normalizeRole(role) {
  const normalizedRole = String(role ?? "")
    .trim()
    .toUpperCase();

  // Support old database role value
  if (normalizedRole === "CORE_MEMBER") {
    return "CORE";
  }

  return normalizedRole;
}

function createChannelSlug(channelName) {
  return channelName
    .toLowerCase()
    .replace(/ & /g, "-")
    .replace(/\s+/g, "-");
}

function HomePage() {
  const [userRoles, setUserRoles] = useState([]);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const [roleError, setRoleError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function getRole() {
      try {
        setRoleLoading(true);
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
            setUserRoles([]);
            setRoleError("Please log in again.");
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

        const rawRoles = Array.isArray(data?.role)
          ? data.role
          : [data?.role];

        const normalizedRoles = rawRoles
          .map(normalizeRole)
          .filter(Boolean);

        console.log("Database role:", data?.role);
        console.log("Normalized roles:", normalizedRoles);

        if (isMounted) {
          setUserRoles(
            normalizedRoles.length > 0
              ? normalizedRoles
              : ["MEMBER"]
          );
        }
      } catch (error) {
        console.error("Could not load profile role:", error);

        if (isMounted) {
          setUserRoles([]);
          setRoleError(
            error instanceof Error
              ? error.message
              : "Could not load your role."
          );
        }
      } finally {
        if (isMounted) {
          setRoleLoading(false);
        }
      }
    }

    getRole();

    return () => {
      isMounted = false;
    };
  }, []);

  const subheadings = Object.keys(CHANNEL_ACCESS);

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#030508] text-white">
      <ParticleBackground />

      <header className="relative z-40 mt-2 flex flex-col items-center justify-between gap-6 p-6 md:mt-0 md:flex-row md:gap-0 md:p-8">
        <h1
          className="text-center text-3xl font-black tracking-tight md:text-left md:text-4xl"
          style={{
            background:
              "linear-gradient(to right, #22d3ee, #6366f1)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          SOCIETY TRACKER
        </h1>

        <div className="relative z-[9999] flex items-center gap-4">
          <NotificationBell />

          <div className="h-16 w-auto shrink-0 md:h-24">
            <a
              href="https://istetiet.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="block h-full w-auto cursor-pointer"
            >
              <img
                src="/logo.png"
                alt="ISTE logo"
                className="h-full w-full object-contain drop-shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-transform duration-300 hover:scale-105"
              />
            </a>
          </div>
        </div>
      </header>

      {roleError && (
        <div className="relative z-30 mx-auto w-full max-w-6xl px-4">
          <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-300">
            Could not check channel access: {roleError}
          </div>
        </div>
      )}

      <main className="relative z-20 flex flex-grow items-center justify-center p-4 pb-28 md:p-8 md:pb-8">
        <div className="flex h-[75vh] min-h-[500px] w-full max-w-6xl flex-col items-stretch gap-4 md:h-[450px] md:min-h-0 md:flex-row md:gap-6">
          {EVENTS.map((event, index) => {
            const isActive = hoveredIndex === index;

            return (
              <motion.div
                key={event.name}
                initial={{
                  opacity: 0,
                  scale: 0.9,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                transition={{
                  delay: index * 0.1,
                }}
                onClick={() =>
                  setHoveredIndex(
                    isActive ? null : index
                  )
                }
                onMouseEnter={() =>
                  setHoveredIndex(index)
                }
                onMouseLeave={() =>
                  setHoveredIndex(null)
                }
                className={`relative flex cursor-pointer flex-col overflow-hidden rounded-3xl border bg-[#0a0f1c] shadow-xl transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] md:cursor-default ${
                  isActive
                    ? "flex-[2.5] border-cyan-500/50 shadow-[0_0_50px_-15px_rgba(34,211,238,0.4)]"
                    : "flex-1 border-white/10"
                }`}
              >
                <div className="absolute inset-0 z-0 bg-black">
                  <img
                    src={event.image}
                    alt={event.name}
                    className={`h-full w-full object-cover transition-all duration-700 ${
                      isActive
                        ? "scale-110 blur-[2px]"
                        : "scale-100"
                    }`}
                  />

                  <div
                    className={`absolute inset-0 transition-all duration-700 ${
                      isActive
                        ? "bg-cyan-900/60"
                        : "bg-black/60"
                    }`}
                  />
                </div>

                <div className="relative z-10 flex h-full min-h-0 flex-col p-5 md:p-6">
                  <div
                    className={`mb-2 flex shrink-0 flex-col items-center justify-center transition-all duration-500 ${
                      isActive
                        ? "h-auto"
                        : "h-full"
                    } md:h-auto`}
                  >
                    <h4 className="text-center text-xl font-black leading-tight tracking-wide text-white drop-shadow-lg md:text-2xl">
                      {event.name}
                    </h4>
                  </div>

                  <div
                    className={`flex flex-col gap-0 overflow-y-auto rounded-xl border bg-black/40 backdrop-blur-sm transition-all duration-500 scrollbar-hide md:mt-2 ${
                      isActive
                        ? "min-h-0 flex-1 border-white/10 py-2 opacity-100"
                        : "h-0 border-transparent py-0 opacity-0"
                    }`}
                  >
                    {subheadings.map((channel) => {
                      const allowedRoles =
                        CHANNEL_ACCESS[channel] ?? [];

                      const canAccess =
                        !roleLoading &&
                        userRoles.some((role) =>
                          allowedRoles.includes(role)
                        );

                      const channelSlug =
                        createChannelSlug(channel);

                      return (
                        <Link
                          key={channel}
                          to={
                            canAccess
                              ? `${event.path}/${channelSlug}`
                              : "#"
                          }
                          onClick={(clickEvent) => {
                            if (!canAccess) {
                              clickEvent.preventDefault();
                            }

                            clickEvent.stopPropagation();
                          }}
                          className={`flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3 text-xs font-bold transition-all duration-200 last:border-0 md:px-5 md:py-4 md:text-sm ${
                            canAccess
                              ? "text-slate-300 hover:bg-white/10 hover:text-cyan-400"
                              : "cursor-not-allowed text-slate-700"
                          }`}
                        >
                          {channel}

                          {canAccess ? (
                            <span className="opacity-30">
                              →
                            </span>
                          ) : (
                            <span className="opacity-50">
                              🔒
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </main>

      <div className="fixed bottom-4 right-4 z-[100] rounded-full border border-cyan-500/30 bg-black/60 px-4 py-2 text-[9px] font-black uppercase tracking-[0.2em] text-cyan-400 shadow-2xl backdrop-blur-xl md:bottom-6 md:right-6 md:px-6 md:py-3 md:text-[11px]">
        ROLE:{" "}
        {roleLoading
          ? "LOADING..."
          : userRoles.length > 0
            ? userRoles.join(", ")
            : "UNKNOWN"}
      </div>
    </div>
  );
}

export default HomePage;
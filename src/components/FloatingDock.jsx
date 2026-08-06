import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";

const items = [
  {
    name: "HOME",
    path: "/home",
    icon: "🏠",
  },
  {
    name: "MY SPACE",
    path: "/my-space",
    icon: "📁",
  },
  {
    name: "DEVELOPERS",
    path: "/developers",
    icon: "💻",
  },
  {
    name: "NOTIFICATIONS",
    path: "/notifications",
    icon: "🔔",
    isNotification: true,
  },
  {
    name: "PROGRESS BAR",
    path: "/progress",
    icon: "📊",
  },
  {
    name: "PROFILE",
    path: "/profile",
    icon: "👤",
  },
];

export default function FloatingDock({ user }) {
  const { pathname } = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user?.id) {
      setUnreadCount(0);
      return undefined;
    }

    let isMounted = true;

    async function loadUnreadCount() {
      const { count, error } = await supabase
        .from("notifications")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("recipient_id", user.id)
        .eq("is_read", false);

      if (error) {
        console.error(
          "Could not load unread notification count:",
          error
        );
        return;
      }

      if (isMounted) {
        setUnreadCount(count ?? 0);
      }
    }

    loadUnreadCount();

    const notificationChannel = supabase
      .channel(`floating-dock-notifications-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${user.id}`,
        },
        () => {
          loadUnreadCount();
        }
      )
      .subscribe();

    // Also refresh the number when the browser/tab is focused again.
    function handleWindowFocus() {
      loadUnreadCount();
    }

    window.addEventListener("focus", handleWindowFocus);

    return () => {
      isMounted = false;
      window.removeEventListener("focus", handleWindowFocus);
      supabase.removeChannel(notificationChannel);
    };
  }, [user?.id]);

  return (
    <div className="fixed bottom-4 sm:bottom-8 left-0 right-0 z-50 flex justify-center px-3">
      <motion.div
        className="flex max-w-full gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-black/40 p-2 shadow-2xl backdrop-blur-xl scrollbar-hide sm:gap-2 sm:p-3"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
      >
        {items.map((item) => {
          const isActive = pathname === item.path;

          return (
            <Link
              key={item.name}
              to={item.path}
              className="shrink-0"
            >
              <motion.div
                whileHover={{ y: -5 }}
                whileTap={{ scale: 0.9 }}
                className={`flex items-center gap-1 whitespace-nowrap rounded-xl px-3 py-1.5 text-[10px] font-bold transition-colors sm:gap-2 sm:px-5 sm:py-2 sm:text-sm ${
                  isActive
                    ? "bg-cyan-500/20 text-cyan-400"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <span className="relative text-sm sm:text-base">
                  {item.icon}

                  {item.isNotification && unreadCount > 0 && (
                    <span className="absolute -right-3 -top-3 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-cyan-400 px-1 text-[9px] font-extrabold leading-none text-black shadow-[0_0_8px_rgba(34,211,238,0.8)]">
                      {unreadCount > 99
                        ? "99+"
                        : unreadCount}
                    </span>
                  )}
                </span>

                {item.name}
              </motion.div>
            </Link>
          );
        })}
      </motion.div>
    </div>
  );
}
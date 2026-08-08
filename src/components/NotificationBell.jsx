import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import toast, { Toaster } from "react-hot-toast";

export default function NotificationBell() {
  const navigate = useNavigate();
  const bellRef = useRef(null);

  const [ring, setRing] = useState(false);
  const [streaks, setStreaks] = useState([]);
  const [zooming, setZooming] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pushStatus, setPushStatus] = useState("default");

  // 1. Native OS Banner Dispatcher
  const showNativeNotification = (rawTitle, body) => {
    if (!("Notification" in window) || Notification.permission !== "granted") {
      return;
    }

    const title = rawTitle && String(rawTitle).trim() ? String(rawTitle) : "New Task Alert 📋";
    const messageBody = body && String(body).trim() ? String(body) : "A new task was deployed to your workspace.";

    try {
      const notif = new Notification(title, {
        body: messageBody,
        icon: "/favicon.ico",
        tag: "app-notification",
        renotify: true,
      });

      notif.onclick = () => {
        window.focus();
        navigate("/notifications");
      };
    } catch (e) {
      console.warn("Native Notification error:", e);
    }
  };

  // 2. Guaranteed In-App Toast Banner
  const showInAppToast = (title, message) => {
    toast(
      (t) => (
        <div
          onClick={() => {
            toast.dismiss(t.id);
            navigate("/notifications");
          }}
          style={{
            background: "#10131f",
            border: "1px solid rgba(56, 189, 248, 0.5)",
            boxShadow: "0 0 25px rgba(56, 189, 248, 0.35)",
            borderRadius: "16px",
            padding: "14px",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            cursor: "pointer",
            maxWidth: "380px",
            width: "100%",
          }}
        >
          <span style={{ fontSize: "24px" }}>📋</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "14px", fontWeight: "bold", color: "#ffffff" }}>
              {title}
            </div>
            <div style={{ fontSize: "12px", color: "#9ca3af", marginTop: "2px" }}>
              {message || "New task deployed."}
            </div>
            <div style={{ fontSize: "10px", color: "#38bdf8", marginTop: "4px" }}>
              Click to view notifications →
            </div>
          </div>
        </div>
      ),
      { duration: 5000, position: "top-right" }
    );
  };

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      alert("This browser does not support desktop notifications.");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPushStatus(permission);

      if (permission === "granted") {
        showNativeNotification(
          "Notifications Active! 🔔",
          "You will receive real-time updates when tasks are deployed."
        );
      } else if (permission === "denied") {
        alert("Notifications are blocked in browser settings.");
      }
    } catch (err) {
      console.error("Error requesting notification permission:", err);
    }
  };

  useEffect(() => {
    const rootEl = document.getElementById("root");
    if (!rootEl) return;
    rootEl.classList.toggle("hyperstreak-zoom", zooming);
  }, [zooming]);

  const triggerPopEffect = () => {
    setRing(true);
    setTimeout(() => setRing(false), 650);

    const rect = bellRef.current?.getBoundingClientRect();
    const cx = rect ? rect.left + rect.width / 2 : 0;
    const cy = rect ? rect.top + rect.height / 2 : 0;

    const STREAK_COUNT = 24;
    const newStreaks = Array.from({ length: STREAK_COUNT }, (_, index) => {
      const angle = Math.random() * Math.PI * 2;
      const len = 300 + Math.random() * 500;
      const delay = Math.random() * 120;
      return { id: index, cx, cy, angle, len, delay };
    });

    setStreaks(newStreaks);
    setTimeout(() => setStreaks([]), 900);

    setTimeout(() => setZooming(true), 60);
    setTimeout(() => setZooming(false), 900);
  };

  const handleClick = () => {
    triggerPopEffect();
    setTimeout(() => {
      navigate("/notifications");
    }, 520);
  };

  useEffect(() => {
    let isMounted = true;
    let realtimeChannel = null;

    if ("Notification" in window) {
      setPushStatus(Notification.permission);
    }

    async function loadUnreadCount(userId) {
      if (!userId) {
        if (isMounted) setUnreadCount(0);
        return;
      }

      const { count, error } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("recipient_id", userId)
        .eq("is_read", false);

      if (error) {
        console.error("Could not load unread count:", error);
        return;
      }

      if (isMounted) {
        setUnreadCount(count ?? 0);
      }
    }

    function subscribeToNotifications(userId) {
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
        realtimeChannel = null;
      }

      if (!userId) {
        if (isMounted) setUnreadCount(0);
        return;
      }

      loadUnreadCount(userId);

      realtimeChannel = supabase
        .channel(`bell-notifications-${userId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
          },
          (payload) => {
            console.log("🔥 REALTIME EVENT FIRED:", payload);

            loadUnreadCount(userId);
            triggerPopEffect();

            const notifTitle =
              payload.new?.title ||
              (payload.new?.type
                ? payload.new.type.replaceAll("_", " ").toUpperCase()
                : "New Task Alert 📋");

            const notifMessage =
              payload.new?.message || "A new task was deployed.";

            // 1. Trigger Top-Right Toast
            showInAppToast(notifTitle, notifMessage);

            // 2. Trigger System Native Pop
            showNativeNotification(notifTitle, notifMessage);
          }
        )
        .subscribe();
    }

    async function initialiseNotificationBell() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (isMounted) {
        subscribeToNotifications(session?.user?.id ?? null);
      }
    }

    initialiseNotificationBell();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        subscribeToNotifications(session?.user?.id ?? null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      if (realtimeChannel) supabase.removeChannel(realtimeChannel);
    };
  }, []);

  return (
    <>
      {/* Toast Render Anchor */}
      <Toaster position="top-right" containerStyle={{ zIndex: 99999 }} />

      <style>{`
        @keyframes ringSwing {
          0% { transform: rotate(0deg); }
          15% { transform: rotate(22deg); }
          30% { transform: rotate(-18deg); }
          45% { transform: rotate(14deg); }
          60% { transform: rotate(-10deg); }
          75% { transform: rotate(6deg); }
          90% { transform: rotate(-3deg); }
          100% { transform: rotate(0deg); }
        }

        @keyframes badgePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }

        @keyframes streakFade {
          0% { opacity: 0; }
          20% { opacity: 1; }
          70% { opacity: 1; }
          100% { opacity: 0; }
        }

        @keyframes streakOut {
          0% { width: 0; opacity: 0; }
          15% { opacity: 1; }
          100% { width: var(--len); opacity: 0; }
        }

        .bell-ring {
          animation: ringSwing 0.65s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }

        .bell-badge {
          animation: badgePulse 2.2s ease-in-out infinite;
        }

        .streak-layer {
          position: fixed;
          inset: 0;
          z-index: 9998;
          pointer-events: none;
          animation: streakFade 0.8s ease forwards;
        }

        .streak {
          position: absolute;
          height: 2px;
          background: linear-gradient(90deg, transparent, #bfe9ff, transparent);
          transform-origin: 0 50%;
          animation: streakOut 0.55s cubic-bezier(0.2, 0.7, 0.3, 1) forwards;
        }

        #root.hyperstreak-zoom {
          transition: transform 0.5s cubic-bezier(0.5, 0, 0.5, 1), filter 0.5s ease;
          transform: scale(1.4);
          filter: blur(6px) brightness(1.3);
        }

        #root {
          transition: transform 0.5s cubic-bezier(0.5, 0, 0.5, 1), filter 0.5s ease;
        }
      `}</style>

      <div className="flex items-center gap-3">
        {pushStatus !== "granted" && (
          <button
            type="button"
            onClick={requestNotificationPermission}
            className="flex items-center gap-1.5 rounded-lg bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition-all cursor-pointer"
          >
            <span>Enable Device Push</span>
            <span>🔔</span>
          </button>
        )}

        <button
          ref={bellRef}
          type="button"
          onClick={handleClick}
          aria-label={`Notifications: ${unreadCount} unread`}
          className="relative flex h-[52px] w-[52px] cursor-pointer items-center justify-center rounded-full border border-white/10 bg-white/5 transition-all duration-200 hover:bg-white/10 active:scale-95"
        >
          <svg
            className={`relative z-10 h-7 w-7 fill-none stroke-white stroke-[1.8] ${
              ring ? "bell-ring" : ""
            }`}
            viewBox="0 0 24 24"
            style={{ transformOrigin: "50% 15%" }}
          >
            <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>

          {unreadCount > 0 && (
            <div className="bell-badge absolute right-0.5 top-0.5 z-20 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gradient-to-br from-red-400 to-red-700 px-1 text-[11px] font-bold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </div>
          )}
        </button>
      </div>

      {streaks.length > 0 && (
        <div className="streak-layer">
          {streaks.map((s) => (
            <div
              key={s.id}
              className="streak"
              style={{
                left: s.cx,
                top: s.cy,
                transform: `rotate(${s.angle}rad)`,
                "--len": `${s.len}px`,
                animationDelay: `${s.delay}ms`,
              }}
            />
          ))}
        </div>
      )}
    </>
  );
}
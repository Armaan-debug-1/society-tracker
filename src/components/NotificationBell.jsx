import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import toast, { Toaster } from "react-hot-toast";

export default function NotificationBell({ isGlobalListener = false }) {
  const navigate = useNavigate();
  const bellRef = useRef(null);

  const [ring, setRing] = useState(false);
  const [streaks, setStreaks] = useState([]);
  const [zooming, setZooming] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pushStatus, setPushStatus] = useState("default");

  // Native Device Banner Dispatcher
  const showNativeNotification = async (rawTitle, body) => {
    if (!("Notification" in window) || Notification.permission !== "granted") {
      return;
    }

    const title = rawTitle && String(rawTitle).trim() ? String(rawTitle) : "New Task Alert 📋";
    const messageBody = body && String(body).trim() ? String(body) : "A new task was deployed.";

    const options = {
      body: messageBody,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      tag: "app-notification",
      renotify: true,
      data: { url: "/notifications" },
    };

    try {
      const notif = new Notification(title, options);
      notif.onclick = () => {
        window.focus();
        navigate("/notifications");
      };
      return;
    } catch (e) {
      console.warn("Direct notification failed:", e);
    }

    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration && registration.showNotification) {
          await registration.showNotification(title, options);
        }
      } catch (err) {
        console.error("SW notification error:", err);
      }
    }
  };

  // In-App Toast Card Pop
  const showInAppToast = (title, message) => {
    toast.custom(
      (t) => (
        <div
          onClick={() => {
            toast.dismiss(t.id);
            navigate("/notifications");
          }}
          className={`${
            t.visible ? "animate-enter" : "animate-leave"
          } max-w-md w-full bg-[#10131f] border border-cyan-400/50 shadow-[0_0_30px_rgba(56,189,248,0.35)] rounded-2xl p-4 flex items-start gap-3.5 cursor-pointer hover:border-cyan-400 transition-all text-white z-[99999]`}
        >
          <div className="w-10 h-10 rounded-xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center text-xl flex-shrink-0">
            📋
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              {title}
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            </h4>
            <p className="text-xs text-gray-300 mt-1 line-clamp-2">
              {message || "New task deployed."}
            </p>
            <span className="text-[10px] text-cyan-400 font-mono mt-1 block">
              Click to view notifications →
            </span>
          </div>
        </div>
      ),
      { duration: 4500, position: "top-right" }
    );
  };

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) return;
    try {
      const permission = await Notification.requestPermission();
      setPushStatus(permission);
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

      if (error) return;
      if (isMounted) setUnreadCount(count ?? 0);
    }

    function subscribeToNotifications(userId) {
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
        realtimeChannel = null;
      }

      if (!userId) return;

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
            console.log("🔥 Realtime Event Received:", payload);

            loadUnreadCount(userId);
            triggerPopEffect();

            const notifTitle =
              payload.new?.title ||
              (payload.new?.type
                ? payload.new.type.replaceAll("_", " ").toUpperCase()
                : "New Task Alert 📋");

            const notifMessage =
              payload.new?.message || "A new item was added to your workspace.";

            showInAppToast(notifTitle, notifMessage);
            showNativeNotification(notifTitle, notifMessage);
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "notifications",
          },
          () => loadUnreadCount(userId)
        )
        .subscribe();
    }

    async function initialiseNotificationBell() {
      const { data: { session } } = await supabase.auth.getSession();
      if (isMounted) subscribeToNotifications(session?.user?.id ?? null);
    }

    initialiseNotificationBell();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) subscribeToNotifications(session?.user?.id ?? null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      if (realtimeChannel) supabase.removeChannel(realtimeChannel);
    };
  }, []);

  // Invisible background listener mode
  if (isGlobalListener) {
    return <Toaster position="top-right" containerStyle={{ zIndex: 99999 }} />;
  }

  return (
    <>
      <Toaster position="top-right" containerStyle={{ zIndex: 99999 }} />

      <div className="flex items-center gap-3">
        {pushStatus !== "granted" && (
          <button
            type="button"
            onClick={requestNotificationPermission}
            className="flex items-center gap-1.5 rounded-lg bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition-all cursor-pointer"
          >
            <span>Enable Push</span>
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
    </>
  );
}

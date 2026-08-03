import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

const notificationDetails = {
  test: {
    icon: "🔔",
    title: "Test notification",
  },
  my_task_created: {
  icon: "📁",
  title: "New My Space task",
},

  task_assignment: {
    icon: "✅",
    title: "New task assigned",
  },

  task_created: {
    icon: "📋",
    title: "New task created",
  },

  channel_created: {
    icon: "📢",
    title: "New channel created",
  },

  message: {
    icon: "💬",
    title: "New message",
  },

  link: {
    icon: "🔗",
    title: "New link shared",
  },

  announcement: {
    icon: "📣",
    title: "New announcement",
  },

  event: {
    icon: "🎤",
    title: "New event update",
  },
};

function getNotificationDetails(type) {
  if (notificationDetails[type]) {
    return notificationDetails[type];
  }

  const formattedTitle = type
    ? type
        .replaceAll("_", " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase())
    : "Notification";

  return {
    icon: "🔔",
    title: formattedTitle,
  };
}

function getTimeAgo(createdAt) {
  if (!createdAt) {
    return "Now";
  }

  const createdTime = new Date(createdAt).getTime();

  if (Number.isNaN(createdTime)) {
    return "";
  }

  const difference = Date.now() - createdTime;
  const minutes = Math.floor(difference / 60000);

  if (minutes < 1) {
    return "Now";
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);

  return `${days}d ago`;
}

function NotificationsPage({ user }) {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!user?.id) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    let componentIsMounted = true;

    async function loadNotifications() {
      setLoading(true);
      setErrorMessage("");

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("recipient_id", user.id);

      if (!componentIsMounted) {
        return;
      }

      if (error) {
        console.error("Notification fetch error:", error);
        setErrorMessage(error.message);
        setLoading(false);
        return;
      }

      const sortedNotifications = [...(data ?? [])].sort(
        (first, second) =>
          new Date(second.created_at ?? 0).getTime() -
          new Date(first.created_at ?? 0).getTime()
      );

      setNotifications(
        sortedNotifications.map((notification) => ({
          ...notification,

          // is_read false means it is unread.
          // If is_read does not exist yet, treat it as unread.
          unread:
            notification.is_read === undefined
              ? true
              : !notification.is_read,
        }))
      );

      setLoading(false);
    }

    loadNotifications();

    const notificationChannel = supabase
      .channel(`notifications-page-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = {
            ...payload.new,
            unread:
              payload.new.is_read === undefined
                ? true
                : !payload.new.is_read,
          };

          setNotifications((currentNotifications) => {
            const alreadyExists = currentNotifications.some(
              (notification) =>
                notification.id === newNotification.id
            );

            if (alreadyExists) {
              return currentNotifications;
            }

            return [
              newNotification,
              ...currentNotifications,
            ];
          });
        }
      )
      .subscribe();

    return () => {
      componentIsMounted = false;
      supabase.removeChannel(notificationChannel);
    };
  }, [user?.id]);

  async function openNotification(notification) {
    // Immediately remove the unread styling.
    setNotifications((currentNotifications) =>
      currentNotifications.map((currentNotification) =>
        currentNotification.id === notification.id
          ? {
              ...currentNotification,
              unread: false,
              is_read: true,
            }
          : currentNotification
      )
    );

    // Update Supabase only when the table has is_read.
    if (
      Object.prototype.hasOwnProperty.call(
        notification,
        "is_read"
      ) &&
      notification.is_read !== true
    ) {
      const { error } = await supabase
        .from("notifications")
        .update({
          is_read: true,
        })
        .eq("id", notification.id)
        .eq("recipient_id", user.id);

      if (error) {
        console.error(
          "Could not mark notification as read:",
          error
        );
      }
    }

    if (!notification.route) {
      return;
    }

    // Support both internal pages and external links.
    if (/^https?:\/\//i.test(notification.route)) {
      window.location.assign(notification.route);
      return;
    }

    navigate(notification.route);
  }

  const unreadCount = notifications.filter(
    (notification) => notification.unread
  ).length;

  return (
    <div className="min-h-screen bg-[#030508] text-white">
      <style>{`
        @keyframes slideIn {
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fadeDown {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .notif-card-in {
          animation: slideIn .5s cubic-bezier(.2,.8,.2,1) forwards;
        }

        .notif-top-in {
          animation: fadeDown .45s ease forwards;
        }
      `}</style>

      <div
        className="notif-top-in flex items-center gap-4 p-6 md:p-8"
        style={{
          opacity: 0,
          transform: "translateY(-10px)",
        }}
      >
        <button
          type="button"
          onClick={() => navigate("/home")}
          className="w-[38px] h-[38px] rounded-full border border-white/10 bg-white/5 flex items-center justify-center cursor-pointer hover:bg-white/10 active:scale-95 transition-all"
          aria-label="Go back to home"
        >
          ←
        </button>

        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl md:text-2xl font-bold">
              Notifications
            </h1>

            {unreadCount > 0 && (
              <span className="rounded-full bg-cyan-400 px-2 py-0.5 text-xs font-bold text-black">
                {unreadCount}
              </span>
            )}
          </div>

          <span className="block text-xs text-cyan-400 font-mono mt-0.5 opacity-80">
            /notifications
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3 p-6 md:p-8 max-w-2xl">
        {!user && (
          <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/5 p-4 text-sm text-yellow-200">
            Please log in to see your notifications.
          </div>
        )}

        {user && loading && (
          <div className="rounded-2xl border border-white/10 bg-[#10131f] p-4 text-sm text-gray-400">
            Loading notifications...
          </div>
        )}

        {user && errorMessage && (
          <div className="rounded-2xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-300">
            Could not load notifications: {errorMessage}
          </div>
        )}

        {user &&
          !loading &&
          !errorMessage &&
          notifications.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-[#10131f] p-6 text-center">
              <div className="text-3xl">🔔</div>

              <p className="mt-3 font-semibold">
                No notifications yet
              </p>

              <p className="mt-1 text-sm text-gray-500">
                New tasks, messages and channel updates will
                appear here.
              </p>
            </div>
          )}

        {notifications.map((notification, index) => {
          const details = getNotificationDetails(
            notification.type
          );

          return (
            <button
              type="button"
              key={notification.id}
              onClick={() =>
                openNotification(notification)
              }
              className="notif-card-in relative overflow-hidden flex w-full gap-3.5 items-start bg-[#10131f] border border-white/10 rounded-2xl p-4 cursor-pointer hover:bg-white/5 hover:border-cyan-400/30 transition-colors text-left"
              style={{
                opacity: 0,
                transform: "translateX(-24px)",
                animationDelay: `${index * 90}ms`,
              }}
            >
              {notification.unread && (
                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-cyan-400 to-purple-500" />
              )}

              <div className="w-[38px] h-[38px] rounded-[10px] bg-cyan-400/10 flex items-center justify-center flex-shrink-0 text-lg">
                {details.icon}
              </div>

              <div className="flex-1">
                <p className="text-sm font-semibold flex items-center gap-1.5">
                  {details.title}

                  {notification.unread && (
                    <span
                      className="w-2 h-2 rounded-full bg-cyan-400"
                      style={{
                        boxShadow:
                          "0 0 8px 2px rgba(62,198,240,.7)",
                      }}
                    />
                  )}
                </p>

                <p className="text-[13px] text-gray-400 mt-0.5">
                  {notification.message}
                </p>

                {notification.route && (
                  <p className="mt-2 text-[11px] text-cyan-400/70">
                    Click to open
                  </p>
                )}
              </div>

              <div className="text-[11.5px] text-gray-500 whitespace-nowrap mt-0.5">
                {getTimeAgo(notification.created_at)}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default NotificationsPage;
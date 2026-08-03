// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { supabase } from "../supabaseClient";

// function NotificationBell() {
//   const navigate = useNavigate();

//   const [ring, setRing] = useState(false);
//   const [ripples, setRipples] = useState([]);
//   const [sparks, setSparks] = useState([]);
//   const [warping, setWarping] = useState(false);

//   // Actual unread notification count from Supabase
//   const [unreadCount, setUnreadCount] = useState(0);

//   useEffect(() => {
//     let isMounted = true;
//     let realtimeChannel = null;
//     let activeUserId = null;

//     async function loadUnreadCount(userId) {
//       if (!userId) {
//         if (isMounted) {
//           setUnreadCount(0);
//         }
//         return;
//       }

//       const { count, error } = await supabase
//         .from("notifications")
//         .select("id", {
//           count: "exact",
//           head: true,
//         })
//         .eq("recipient_id", userId)
//         .eq("is_read", false);

//       if (error) {
//         console.error(
//           "Could not load unread notification count:",
//           error
//         );
//         return;
//       }

//       if (isMounted) {
//         setUnreadCount(count ?? 0);
//       }
//     }

//     async function subscribeToNotifications(userId) {
//       activeUserId = userId ?? null;

//       if (realtimeChannel) {
//         await supabase.removeChannel(realtimeChannel);
//         realtimeChannel = null;
//       }

//       if (!userId) {
//         if (isMounted) {
//           setUnreadCount(0);
//         }
//         return;
//       }

//       await loadUnreadCount(userId);

//       realtimeChannel = supabase
//         .channel(`notification-bell-${userId}`)
//         .on(
//           "postgres_changes",
//           {
//             event: "*",
//             schema: "public",
//             table: "notifications",
//             filter: `recipient_id=eq.${userId}`,
//           },
//           () => {
//             loadUnreadCount(userId);
//           }
//         )
//         .subscribe((status) => {
//           if (status === "CHANNEL_ERROR") {
//             console.error(
//               "Notification Realtime subscription failed."
//             );
//           }
//         });
//     }

//     async function initialiseNotificationBell() {
//       const {
//         data: { session },
//         error,
//       } = await supabase.auth.getSession();

//       if (error) {
//         console.error(
//           "Could not get the current login session:",
//           error
//         );

//         if (isMounted) {
//           setUnreadCount(0);
//         }

//         return;
//       }

//       await subscribeToNotifications(
//         session?.user?.id ?? null
//       );
//     }

//     initialiseNotificationBell();

//     const {
//       data: { subscription },
//     } = supabase.auth.onAuthStateChange((_event, session) => {
//       subscribeToNotifications(
//         session?.user?.id ?? null
//       );
//     });

//     // Recheck whenever the user returns to the browser tab.
//     function handleWindowFocus() {
//       if (activeUserId) {
//         loadUnreadCount(activeUserId);
//       }
//     }

//     window.addEventListener("focus", handleWindowFocus);

//     return () => {
//       isMounted = false;

//       window.removeEventListener(
//         "focus",
//         handleWindowFocus
//       );

//       subscription.unsubscribe();

//       if (realtimeChannel) {
//         supabase.removeChannel(realtimeChannel);
//       }
//     };
//   }, []);

//   const handleClick = () => {
//     setRing(true);
//     setTimeout(() => setRing(false), 650);

//     setRipples([Date.now(), Date.now() + 1]);
//     setTimeout(() => setRipples([]), 900);

//     const newSparks = Array.from(
//       { length: 10 },
//       (_, index) => {
//         const angle =
//           (Math.PI * 2 * index) / 10 +
//           Math.random() * 0.3;

//         const distance = 30 + Math.random() * 20;

//         return {
//           id: index,
//           dx: Math.cos(angle) * distance,
//           dy: Math.sin(angle) * distance,
//         };
//       }
//     );

//     setSparks(newSparks);
//     setTimeout(() => setSparks([]), 700);

//     setWarping(true);

//     setTimeout(() => {
//       navigate("/notifications");
//     }, 850);
//   };

//   return (
//     <>
//       <style>{`
//         @keyframes ringSwing {
//           0% {
//             transform: rotate(0deg);
//           }

//           15% {
//             transform: rotate(22deg);
//           }

//           30% {
//             transform: rotate(-18deg);
//           }

//           45% {
//             transform: rotate(14deg);
//           }

//           60% {
//             transform: rotate(-10deg);
//           }

//           75% {
//             transform: rotate(6deg);
//           }

//           90% {
//             transform: rotate(-3deg);
//           }

//           100% {
//             transform: rotate(0deg);
//           }
//         }

//         @keyframes rippleOut {
//           0% {
//             opacity: 0.9;
//             transform: translate(-50%, -50%) scale(1);
//           }

//           100% {
//             opacity: 0;
//             transform: translate(-50%, -50%) scale(4.2);
//           }
//         }

//         @keyframes sparkOut {
//           0% {
//             opacity: 1;
//             transform:
//               translate(-50%, -50%)
//               translate(0, 0)
//               scale(1);
//           }

//           100% {
//             opacity: 0;
//             transform:
//               translate(-50%, -50%)
//               translate(var(--dx), var(--dy))
//               scale(0.3);
//           }
//         }

//         @keyframes badgePulse {
//           0%,
//           100% {
//             transform: scale(1);
//           }

//           50% {
//             transform: scale(1.15);
//           }
//         }

//         @keyframes warpGrow {
//           0% {
//             transform: translate(-50%, -50%) scale(0);
//             opacity: 0.9;
//           }

//           60% {
//             opacity: 1;
//           }

//           100% {
//             transform: translate(-50%, -50%) scale(60);
//             opacity: 1;
//           }
//         }

//         .bell-ring {
//           animation:
//             ringSwing
//             0.65s
//             cubic-bezier(0.36, 0.07, 0.19, 0.97)
//             both;
//         }

//         .bell-badge {
//           animation:
//             badgePulse
//             2.2s
//             ease-in-out
//             infinite;
//         }
//       `}</style>

//       <button
//         type="button"
//         onClick={handleClick}
//         aria-label={`Notifications: ${unreadCount} unread`}
//         className="relative flex h-[52px] w-[52px] cursor-pointer items-center justify-center rounded-full border border-white/10 bg-white/5 transition-all duration-200 hover:bg-white/10 active:scale-95"
//       >
//         {ripples.map((id, index) => (
//           <div
//             key={id}
//             className="pointer-events-none absolute left-1/2 top-1/2 h-[52px] w-[52px] rounded-full border border-cyan-400/80"
//             style={{
//               animation:
//                 "rippleOut 0.9s ease-out forwards",
//               animationDelay: `${index * 140}ms`,
//               transform: "translate(-50%, -50%)",
//             }}
//           />
//         ))}

//         {sparks.map((spark) => (
//           <div
//             key={spark.id}
//             className="pointer-events-none absolute left-1/2 top-1/2 h-1 w-1 rounded-full bg-cyan-400"
//             style={{
//               animation:
//                 "sparkOut 0.6s ease-out forwards",
//               "--dx": `${spark.dx}px`,
//               "--dy": `${spark.dy}px`,
//             }}
//           />
//         ))}

//         <svg
//           className={`relative z-10 h-7 w-7 fill-none stroke-white stroke-[1.8] ${
//             ring ? "bell-ring" : ""
//           }`}
//           viewBox="0 0 24 24"
//           style={{
//             transformOrigin: "50% 15%",
//           }}
//         >
//           <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
//           <path d="M13.73 21a2 2 0 0 1-3.46 0" />
//         </svg>

//         {unreadCount > 0 && (
//           <div
//             className="bell-badge absolute right-0.5 top-0.5 z-20 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gradient-to-br from-red-400 to-red-700 px-1 text-[11px] font-bold text-white"
//             style={{
//               boxShadow: "0 0 0 2px #030508",
//             }}
//           >
//             {unreadCount > 99
//               ? "99+"
//               : unreadCount}
//           </div>
//         )}
//       </button>

//       {warping && (
//         <div
//           className="pointer-events-none fixed z-[9999] rounded-full"
//           style={{
//             top: 0,
//             left: 0,
//             width: 40,
//             height: 40,
//             background:
//               "radial-gradient(circle, #cdefff 0%, #6cc9f0 25%, #4a3fb0 55%, #05070f 100%)",
//             animation:
//               "warpGrow 0.85s cubic-bezier(.65,0,.35,1) forwards",
//             transform:
//               "translate(calc(-50% + 34px), calc(-50% + 34px))",
//           }}
//         />
//       )}
//     </>
//   );
// }

// export default NotificationBell;










import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

function NotificationBell() {
  const navigate = useNavigate();
  const bellRef = useRef(null);

  const [ring, setRing] = useState(false);
  const [streaks, setStreaks] = useState([]);
  const [zooming, setZooming] = useState(false);

  // Actual unread notification count from Supabase
  const [unreadCount, setUnreadCount] = useState(0);

  // Toggle the punch-zoom on the app root whenever `zooming` changes.
  // Update the id below if your app's root wrapper isn't "#root".
  useEffect(() => {
    const rootEl = document.getElementById("root");
    if (!rootEl) return;

    rootEl.classList.toggle("hyperstreak-zoom", zooming);
  }, [zooming]);

  useEffect(() => {
    let isMounted = true;
    let realtimeChannel = null;
    let activeUserId = null;

    async function loadUnreadCount(userId) {
      if (!userId) {
        if (isMounted) {
          setUnreadCount(0);
        }
        return;
      }

      const { count, error } = await supabase
        .from("notifications")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("recipient_id", userId)
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

    async function subscribeToNotifications(userId) {
      activeUserId = userId ?? null;

      if (realtimeChannel) {
        await supabase.removeChannel(realtimeChannel);
        realtimeChannel = null;
      }

      if (!userId) {
        if (isMounted) {
          setUnreadCount(0);
        }
        return;
      }

      await loadUnreadCount(userId);

      realtimeChannel = supabase
        .channel(`notification-bell-${userId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
            filter: `recipient_id=eq.${userId}`,
          },
          () => {
            loadUnreadCount(userId);
          }
        )
        .subscribe((status) => {
          if (status === "CHANNEL_ERROR") {
            console.error(
              "Notification Realtime subscription failed."
            );
          }
        });
    }

    async function initialiseNotificationBell() {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error(
          "Could not get the current login session:",
          error
        );

        if (isMounted) {
          setUnreadCount(0);
        }

        return;
      }

      await subscribeToNotifications(
        session?.user?.id ?? null
      );
    }

    initialiseNotificationBell();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      subscribeToNotifications(
        session?.user?.id ?? null
      );
    });

    // Recheck whenever the user returns to the browser tab.
    function handleWindowFocus() {
      if (activeUserId) {
        loadUnreadCount(activeUserId);
      }
    }

    window.addEventListener("focus", handleWindowFocus);

    return () => {
      isMounted = false;

      window.removeEventListener(
        "focus",
        handleWindowFocus
      );

      subscription.unsubscribe();

      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, []);

  const handleClick = () => {
    // 1. Ring the bell
    setRing(true);
    setTimeout(() => setRing(false), 650);

    // 2. Fire streaks outward from the bell's actual screen position
    const rect = bellRef.current?.getBoundingClientRect();
    const cx = rect ? rect.left + rect.width / 2 : 0;
    const cy = rect ? rect.top + rect.height / 2 : 0;

    const STREAK_COUNT = 24;
    const newStreaks = Array.from(
      { length: STREAK_COUNT },
      (_, index) => {
        const angle = Math.random() * Math.PI * 2;
        const len = 300 + Math.random() * 500;
        const delay = Math.random() * 120;

        return { id: index, cx, cy, angle, len, delay };
      }
    );

    setStreaks(newStreaks);
    setTimeout(() => setStreaks([]), 900);

    // 3. Punch-zoom the page
    setTimeout(() => setZooming(true), 60);
    setTimeout(() => setZooming(false), 900);

    // 4. Navigate to the existing notifications page mid-effect
    setTimeout(() => {
      navigate("/notifications");
    }, 520);
  };

  return (
    <>
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

        /* Punch-zoom applied to the app root. Adjust the selector below
           (#root, #app, .app-shell, etc.) to match your actual layout wrapper. */
        #root.hyperstreak-zoom {
          transition: transform 0.5s cubic-bezier(0.5, 0, 0.5, 1), filter 0.5s ease;
          transform: scale(1.4);
          filter: blur(6px) brightness(1.3);
        }

        #root {
          transition: transform 0.5s cubic-bezier(0.5, 0, 0.5, 1), filter 0.5s ease;
        }
      `}</style>

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
          style={{
            transformOrigin: "50% 15%",
          }}
        >
          <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {unreadCount > 0 && (
          <div
            className="bell-badge absolute right-0.5 top-0.5 z-20 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gradient-to-br from-red-400 to-red-700 px-1 text-[11px] font-bold text-white"
            style={{
              boxShadow: "0 0 0 2px #030508",
            }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </div>
        )}
      </button>

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

export default NotificationBell;
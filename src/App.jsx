import { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import { supabase } from "./supabaseClient";

import LoginPage from "./components/LoginPage";
import HomePage from "./components/HomePage";
import EventPage from "./components/EventPage";
import AdminPanel from "./components/AdminPanel";
import Profile from "./components/Profile";
import MyspacePage from "./components/MyspacePage";
import ChannelTasks from "./components/ChannelTasks";
import FloatingDock from "./components/FloatingDock";
import LoadingScreen from "./components/LoadingScreen";
import Developers from "./components/Developers";
import NotificationsPage from "./components/NotificationsPage";
import ProgressBarPage from "./components/ProgressBarPage";

function DockWrapper({ user }) {
  const location = useLocation();

  if (location.pathname === "/") {
    return null;
  }

  return <FloatingDock user={user} />;
}
function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#030508] text-white">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Page not found</h1>

        <a href="/" className="mt-4 inline-block text-cyan-400 underline">
          Return to login
        </a>
      </div>
    </div>
  );
}

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [showGlobalLoading, setShowGlobalLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function initialiseAuth() {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (isMounted) {
          setCurrentUser(data.session?.user ?? null);
          setAuthError("");
        }
      } catch (error) {
        console.error("Auth initialization error:", error);

        if (isMounted) {
          setCurrentUser(null);
          setAuthError(
            error instanceof Error
              ? error.message
              : "Unable to initialise login."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    initialiseAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;

      setCurrentUser(session?.user ?? null);
      setLoading(false);
      setAuthError("");
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#030508] font-bold uppercase tracking-widest text-cyan-400">
        Initializing System...
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-[#030508]">
        {showGlobalLoading && <LoadingScreen />}

        {authError && (
          <div className="fixed left-1/2 top-4 z-[9999] -translate-x-1/2 rounded bg-red-900 px-4 py-2 text-white">
            {authError}
          </div>
        )}

        <Routes>
          <Route
            path="/"
            element={
              <LoginPage
                setShowGlobalLoading={setShowGlobalLoading}
              />
            }
          />

          <Route path="/home" element={<HomePage />} />

          <Route
            path="/event/:eventName"
            element={<EventPage />}
          />

          <Route
            path="/event/:eventName/:channelName"
            element={<ChannelTasks />}
          />

          <Route path="/admin" element={<AdminPanel />} />

          <Route
            path="/profile"
            element={<Profile user={currentUser} />}
          />

          <Route
            path="/my-space"
            element={<MyspacePage user={currentUser} />}
          />

          <Route
            path="/developers"
            element={<Developers />}
          />

          <Route
            path="/notifications"
            element={<NotificationsPage user={currentUser} />}
          />

          <Route
            path="/progress"
            element={<ProgressBarPage user={currentUser} />}
          />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        <DockWrapper user={currentUser} />
      </div>
    </Router>
  );
}

export default App;
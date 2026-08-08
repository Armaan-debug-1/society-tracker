import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
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

// ----------------------------------------------------------------------
// Route Guards
// ----------------------------------------------------------------------

// Protects internal pages: Redirects unauthenticated users back to Login ("/")
function ProtectedRoute({ user, children }) {
  if (!user) {
    return <Navigate to="/" replace />;
  }
  return children;
}

// Protects the Login page: Redirects already authenticated users to "/home"
function PublicOnlyRoute({ user, children }) {
  if (user) {
    return <Navigate to="/home" replace />;
  }
  return children;
}

// ----------------------------------------------------------------------
// Layout Wrappers
// ----------------------------------------------------------------------

function DockWrapper({ user }) {
  const location = useLocation();

  // Hide floating dock on the login screen or if no user is present
  if (location.pathname === "/" || !user) {
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
          Return to home
        </a>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// Main Application Component
// ----------------------------------------------------------------------

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [showGlobalLoading, setShowGlobalLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // Fetch initial session from localStorage / Supabase
    async function initialiseAuth() {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) throw error;

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

    // Listen for auth updates (sign in, sign out, token refreshes)
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

  // Display initial loading state while Supabase reads the cached token from localStorage
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
          <div className="fixed left-1/2 top-4 z-[9999] -translate-x-1/2 rounded bg-red-900 px-4 py-2 text-white shadow-lg">
            {authError}
          </div>
        )}

        <Routes>
          {/* Public-only Route: Redirects to /home if user is already logged in */}
          <Route
            path="/"
            element={
              <PublicOnlyRoute user={currentUser}>
                <LoginPage setShowGlobalLoading={setShowGlobalLoading} />
              </PublicOnlyRoute>
            }
          />

          {/* Protected Routes */}
          <Route
            path="/home"
            element={
              <ProtectedRoute user={currentUser}>
                <HomePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/event/:eventName"
            element={
              <ProtectedRoute user={currentUser}>
                <EventPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/event/:eventName/:channelName"
            element={
              <ProtectedRoute user={currentUser}>
                <ChannelTasks />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute user={currentUser}>
                <AdminPanel />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute user={currentUser}>
                <Profile user={currentUser} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-space"
            element={
              <ProtectedRoute user={currentUser}>
                <MyspacePage user={currentUser} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/developers"
            element={
              <ProtectedRoute user={currentUser}>
                <Developers />
              </ProtectedRoute>
            }
          />

          <Route
            path="/notifications"
            element={
              <ProtectedRoute user={currentUser}>
                <NotificationsPage user={currentUser} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/progress"
            element={
              <ProtectedRoute user={currentUser}>
                <ProgressBarPage user={currentUser} />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>

        <DockWrapper user={currentUser} />
      </div>
    </Router>
  );
}

export default App;
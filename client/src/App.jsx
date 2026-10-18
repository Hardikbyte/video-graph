import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { useAuth } from "./context/auth.js";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Boards from "./pages/Boards.jsx";
import Board from "./pages/Board.jsx";

// Pages for signed-in people. A saved login is checked first, so a stale one never flashes the app.
function RequireAuth({ children }) {
  const { token, checking } = useAuth();
  const location = useLocation();
  if (checking) return <div className="page-center muted">Loading...</div>;
  if (!token) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return children;
}

// Login and sign up are not for people who are already signed in.
function PublicOnly({ children }) {
  const { token, checking } = useAuth();
  if (checking) return <div className="page-center muted">Loading...</div>;
  if (token) return <Navigate to="/boards" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicOnly>
            <Login />
          </PublicOnly>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicOnly>
            <Signup />
          </PublicOnly>
        }
      />
      <Route
        path="/boards"
        element={
          <RequireAuth>
            <Boards />
          </RequireAuth>
        }
      />
      <Route
        path="/boards/:id"
        element={
          <RequireAuth>
            <Board />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/boards" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

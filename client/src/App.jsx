import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import Login from "./pages/Login.jsx";
import Boards from "./pages/Boards.jsx";
import Board from "./pages/Board.jsx";

function RequireAuth({ children }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
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

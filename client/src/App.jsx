import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import TableView from "./pages/TableView.jsx";
import { useAuth } from "./AuthContext.jsx";

export default function App() {
  const { loading } = useAuth();
  if (loading) return null;

  return (
    <div className="app-shell">
      <Navbar />
      <div className="container">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/t/:slug"
            element={
              <ProtectedRoute>
                <TableView />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </div>
  );
}

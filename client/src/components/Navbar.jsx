import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  return (
    <div className="navbar">
      <Link to="/" className="brand">Shared Database</Link>
      {user && (
        <div className="nav-right">
          <span>
            Signed in as <strong>{user.username}</strong>
            {user.role === "admin" && <span className="badge" style={{ marginLeft: 6 }}>admin</span>}
          </span>
          <button className="link-btn" onClick={logout}>Log out</button>
        </div>
      )}
    </div>
  );
}

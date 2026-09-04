import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <h1>Log in</h1>
      <p className="subtitle">Access your team's shared database.</p>
      {error && <div className="error-banner">{error}</div>}
      <form onSubmit={onSubmit}>
        <div className="field-row">
          <label htmlFor="username">Username</label>
          <input id="username" type="text" value={username} autoFocus
            onChange={(e) => setUsername(e.target.value)} required />
        </div>
        <div className="field-row">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" value={password}
            onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button className="btn btn-block" type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Log in"}
        </button>
      </form>
      <p style={{ marginTop: 16, fontSize: 13 }}>
        No account yet? <Link to="/register">Register</Link>
      </p>
    </div>
  );
}

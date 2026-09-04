import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";

export default function Register() {
  const { register } = useAuth();
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
      await register(username, password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <h1>Create your account</h1>
      <p className="subtitle">
        Join your team's shared database. The first person to register becomes admin.
      </p>
      {error && <div className="error-banner">{error}</div>}
      <form onSubmit={onSubmit}>
        <div className="field-row">
          <label htmlFor="username">Username</label>
          <input id="username" type="text" value={username} autoFocus
            onChange={(e) => setUsername(e.target.value)} required />
        </div>
        <div className="field-row">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" value={password} minLength={8}
            onChange={(e) => setPassword(e.target.value)} required />
          <span className="muted" style={{ fontSize: 12 }}>At least 8 characters.</span>
        </div>
        <button className="btn btn-block" type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Register"}
        </button>
      </form>
      <p style={{ marginTop: 16, fontSize: 13 }}>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
}

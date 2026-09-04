import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import NewTableModal from "../components/NewTableModal.jsx";

export default function Dashboard() {
  const navigate = useNavigate();
  const [tables, setTables] = useState(null);
  const [error, setError] = useState("");
  const [showNew, setShowNew] = useState(false);

  function refresh() {
    api.listTables().then((r) => setTables(r.tables)).catch((e) => setError(e.message));
  }

  useEffect(refresh, []);

  return (
    <div>
      <div className="page-header">
        <h1>Your databases</h1>
        <button className="btn" onClick={() => setShowNew(true)}>+ New database</button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {tables && tables.length === 0 && (
        <div className="empty-state">
          <p>No databases yet. Create one to start sharing data with your team &mdash;
            customers, suppliers, jobs, anything you like.</p>
          <button className="btn" onClick={() => setShowNew(true)}>+ New database</button>
        </div>
      )}

      {tables && tables.length > 0 && (
        <div className="table-cards">
          {tables.map((t) => (
            <Link to={`/t/${t.slug}`} key={t.id} className="table-card" style={{ color: "inherit" }}>
              <h3>{t.name}</h3>
              {t.description && <p>{t.description}</p>}
              <span className="meta">{t.fieldCount} fields &middot; {t.recordCount} records</span>
              <span className="meta">Created by {t.createdBy || "unknown"}</span>
            </Link>
          ))}
        </div>
      )}

      {showNew && (
        <NewTableModal
          onClose={() => setShowNew(false)}
          onCreated={(table) => {
            setShowNew(false);
            navigate(`/t/${table.slug}`);
          }}
        />
      )}
    </div>
  );
}

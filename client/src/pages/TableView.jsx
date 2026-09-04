import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api.js";
import { formatValue } from "../fieldTypes.js";
import RecordFormModal from "../components/RecordFormModal.jsx";
import ManageFieldsModal from "../components/ManageFieldsModal.jsx";
import { useAuth } from "../AuthContext.jsx";

export default function TableView() {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [table, setTable] = useState(null);
  const [records, setRecords] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [showAdd, setShowAdd] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [showFields, setShowFields] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [descDraft, setDescDraft] = useState("");

  function loadAll() {
    setError("");
    Promise.all([api.getTable(slug), api.listRecords(slug)])
      .then(([t, r]) => {
        setTable(t.table);
        setRecords(r.records);
      })
      .catch((e) => setError(e.message));
  }

  useEffect(loadAll, [slug]);

  const fields = table?.fields || [];

  const filteredRecords = useMemo(() => {
    if (!records) return [];
    if (!search.trim()) return records;
    const q = search.toLowerCase();
    return records.filter((r) =>
      fields.some((f) => String(r.data[f.key] ?? "").toLowerCase().includes(q))
    );
  }, [records, search, fields]);

  async function handleAdd(data) {
    const { record } = await api.createRecord(slug, data);
    setRecords((rs) => [record, ...rs]);
    setShowAdd(false);
  }

  async function handleEdit(data) {
    const { record } = await api.updateRecord(slug, editingRecord.id, data);
    setRecords((rs) => rs.map((r) => (r.id === record.id ? record : r)));
    setEditingRecord(null);
  }

  async function handleDelete(record) {
    if (!confirm("Delete this record?")) return;
    await api.deleteRecord(slug, record.id);
    setRecords((rs) => rs.filter((r) => r.id !== record.id));
  }

  async function handleDeleteTable() {
    if (!confirm(`Delete the "${table.name}" database and all its records? This cannot be undone.`)) return;
    try {
      await api.deleteTable(slug);
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  }

  async function saveDetails(e) {
    e.preventDefault();
    try {
      const { table: updated } = await api.updateTable(slug, {
        name: nameDraft,
        description: descDraft,
      });
      setTable((t) => ({ ...t, name: updated.name, description: updated.description }));
      setRenaming(false);
    } catch (err) {
      setError(err.message);
    }
  }

  if (error) return <div className="error-banner">{error}</div>;
  if (!table || !records) return <p className="muted">Loading...</p>;

  const canDeleteTable = user.role === "admin" || user.id === table.created_by;

  return (
    <div>
      <div className="page-header">
        <div>
          {!renaming && (
            <>
              <h1>
                {table.name}{" "}
                <button className="link-btn" style={{ fontSize: 13 }} onClick={() => {
                  setNameDraft(table.name);
                  setDescDraft(table.description || "");
                  setRenaming(true);
                }}>Edit</button>
              </h1>
              {table.description && <p className="muted" style={{ margin: 0 }}>{table.description}</p>}
            </>
          )}
          {renaming && (
            <form onSubmit={saveDetails} style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="text" value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} />
              <input type="text" value={descDraft} placeholder="Description"
                onChange={(e) => setDescDraft(e.target.value)} />
              <button type="submit" className="btn">Save</button>
              <button type="button" className="btn btn-secondary" onClick={() => setRenaming(false)}>Cancel</button>
            </form>
          )}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => setShowFields(true)}>Manage fields</button>
          <button className="btn" onClick={() => setShowAdd(true)}>+ Add record</button>
        </div>
      </div>

      <div className="table-toolbar">
        <input
          className="search-input"
          type="text"
          placeholder="Search records..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span className="muted">{filteredRecords.length} of {records.length} records</span>
          {canDeleteTable && (
            <button className="btn btn-danger" onClick={handleDeleteTable}>Delete database</button>
          )}
        </div>
      </div>

      {fields.length === 0 && (
        <div className="empty-state">
          <p>This database has no fields yet.</p>
          <button className="btn" onClick={() => setShowFields(true)}>Manage fields</button>
        </div>
      )}

      {fields.length > 0 && (
        <div className="data-grid-wrap">
          <table className="data-grid">
            <thead>
              <tr>
                {fields.map((f) => <th key={f.id}>{f.label}</th>)}
                <th>Updated by</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((r) => (
                <tr key={r.id}>
                  {fields.map((f) => (
                    <td key={f.id} title={formatValue(f, r.data[f.key])}>
                      {formatValue(f, r.data[f.key])}
                    </td>
                  ))}
                  <td>{r.updatedBy}</td>
                  <td>
                    <div className="row-actions">
                      <button className="btn btn-secondary" onClick={() => setEditingRecord(r)}>Edit</button>
                      <button className="btn btn-danger" onClick={() => handleDelete(r)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredRecords.length === 0 && (
                <tr><td colSpan={fields.length + 2} className="muted">No records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <RecordFormModal
          title={`Add to ${table.name}`}
          fields={fields}
          initialData={null}
          onClose={() => setShowAdd(false)}
          onSave={handleAdd}
        />
      )}

      {editingRecord && (
        <RecordFormModal
          title={`Edit record`}
          fields={fields}
          initialData={editingRecord.data}
          onClose={() => setEditingRecord(null)}
          onSave={handleEdit}
        />
      )}

      {showFields && (
        <ManageFieldsModal
          slug={slug}
          fields={fields}
          onClose={() => setShowFields(false)}
          onChanged={(newFields) => setTable((t) => ({ ...t, fields: newFields }))}
        />
      )}
    </div>
  );
}

import { useState } from "react";
import { api } from "../api.js";
import FieldRow from "./FieldRow.jsx";

const BLANK_FIELD = () => ({ label: "", type: "text", required: false, options: [] });

export default function NewTableModal({ onClose, onCreated }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState([BLANK_FIELD()]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField(i, updated) {
    setFields((fs) => fs.map((f, idx) => (idx === i ? updated : f)));
  }
  function removeField(i) {
    setFields((fs) => fs.filter((_, idx) => idx !== i));
  }
  function addField() {
    setFields((fs) => [...fs, BLANK_FIELD()]);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    const cleanFields = fields.filter((f) => f.label.trim());
    if (!name.trim()) return setError("Table name is required");
    setLoading(true);
    try {
      const { table } = await api.createTable({ name, description, fields: cleanFields });
      onCreated(table);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2>New database</h2>
        {error && <div className="error-banner">{error}</div>}
        <form onSubmit={onSubmit}>
          <div className="field-row">
            <label>Name</label>
            <input type="text" value={name} autoFocus placeholder="e.g. Customers"
              onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field-row">
            <label>Description (optional)</label>
            <input type="text" value={description} placeholder="What is this database for?"
              onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="field-row">
            <label>Fields</label>
            {fields.map((f, i) => (
              <FieldRow
                key={i}
                field={f}
                onChange={(updated) => updateField(i, updated)}
                onRemove={() => removeField(i)}
              />
            ))}
            <button type="button" className="btn btn-secondary" onClick={addField}>+ Add field</button>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn" disabled={loading}>
              {loading ? "Creating..." : "Create database"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

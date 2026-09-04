import { useState } from "react";
import { api } from "../api.js";
import FieldRow from "./FieldRow.jsx";

const BLANK_FIELD = () => ({ label: "", type: "text", required: false, options: [] });

export default function ManageFieldsModal({ slug, fields, onClose, onChanged }) {
  const [error, setError] = useState("");
  const [newField, setNewField] = useState(BLANK_FIELD());
  const [busyId, setBusyId] = useState(null);

  async function saveExisting(field) {
    setError("");
    setBusyId(field.id);
    try {
      const { fields } = await api.updateField(slug, field.id, {
        label: field.label,
        type: field.type,
        required: field.required,
        options: field.options,
      });
      onChanged(fields);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function removeExisting(field) {
    if (!confirm(`Delete field "${field.label}"? Existing data in this field will be hidden.`)) return;
    setError("");
    setBusyId(field.id);
    try {
      const { fields } = await api.deleteField(slug, field.id);
      onChanged(fields);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function addField(e) {
    e.preventDefault();
    if (!newField.label.trim()) return;
    setError("");
    try {
      const { fields } = await api.addField(slug, newField);
      onChanged(fields);
      setNewField(BLANK_FIELD());
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 600 }}>
        <h2>Manage fields</h2>
        {error && <div className="error-banner">{error}</div>}

        {fields.map((f) => (
          <FieldRow
            key={f.id}
            field={f}
            onChange={(updated) => saveExisting(updated)}
            onRemove={() => removeExisting(f)}
          />
        ))}

        <form onSubmit={addField}>
          <label style={{ fontSize: 13, fontWeight: 600 }}>Add a new field</label>
          <FieldRow
            field={newField}
            onChange={setNewField}
            onRemove={() => setNewField(BLANK_FIELD())}
          />
          <button type="submit" className="btn btn-secondary">+ Add field</button>
        </form>

        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";

function FieldInput({ field, value, onChange }) {
  const common = {
    value: value ?? "",
    onChange: (e) => onChange(e.target.value),
  };

  switch (field.type) {
    case "textarea":
      return <textarea {...common} />;
    case "number":
      return <input type="number" {...common} />;
    case "currency":
      return <input type="number" step="0.01" {...common} />;
    case "date":
      return <input type="date" {...common} />;
    case "email":
      return <input type="email" {...common} />;
    case "phone":
      return <input type="tel" {...common} />;
    case "boolean":
      return (
        <input
          type="checkbox"
          checked={value === true || value === "true"}
          onChange={(e) => onChange(e.target.checked)}
        />
      );
    case "select":
      return (
        <select value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
          <option value="">Select...</option>
          {(field.options || []).map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    default:
      return <input type="text" {...common} />;
  }
}

export default function RecordFormModal({ fields, initialData, onClose, onSave, title }) {
  const [data, setData] = useState(() => initialData || {});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField(key, value) {
    setData((d) => ({ ...d, [key]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await onSave(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2>{title}</h2>
        {error && <div className="error-banner">{error}</div>}
        <form onSubmit={onSubmit}>
          {fields.map((f) => (
            <div className="field-row" key={f.id ?? f.key}>
              <label>
                {f.label}{f.required ? " *" : ""}
              </label>
              <FieldInput field={f} value={data[f.key]} onChange={(v) => updateField(f.key, v)} />
            </div>
          ))}
          {fields.length === 0 && (
            <p className="muted">This database has no fields yet. Add some from "Manage fields" first.</p>
          )}
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn" disabled={loading || fields.length === 0}>
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

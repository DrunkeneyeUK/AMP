import { FIELD_TYPES } from "../fieldTypes.js";

// Editable row for one field definition. `field` = { label, type, options, required }
export default function FieldRow({ field, onChange, onRemove }) {
  function update(patch) {
    onChange({ ...field, ...patch });
  }

  return (
    <div className="field-def-row">
      <div className="grow">
        <input
          type="text"
          placeholder="Field name (e.g. Distribution Board Type)"
          value={field.label}
          onChange={(e) => update({ label: e.target.value })}
        />
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select value={field.type} onChange={(e) => update({ type: e.target.value })}>
            {FIELD_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={!!field.required}
              onChange={(e) => update({ required: e.target.checked })}
            />
            Required
          </label>
        </div>
        {field.type === "select" && (
          <input
            type="text"
            placeholder="Options, comma separated (e.g. Split Load, Dual RCD)"
            value={(field.options || []).join(", ")}
            onChange={(e) =>
              update({
                options: e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
          />
        )}
      </div>
      <button type="button" className="btn btn-secondary" onClick={onRemove}>Remove</button>
    </div>
  );
}

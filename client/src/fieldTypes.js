export const FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "textarea", label: "Long text" },
  { value: "number", label: "Number" },
  { value: "currency", label: "Currency (£)" },
  { value: "date", label: "Date" },
  { value: "boolean", label: "Yes / No" },
  { value: "select", label: "Dropdown" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
];

export function formatValue(field, value) {
  if (value === undefined || value === null || value === "") return "";
  if (field.type === "currency") {
    const n = Number(value);
    return isNaN(n) ? value : `£${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (field.type === "boolean") {
    return value === true || value === "true" ? "Yes" : "No";
  }
  return String(value);
}

export function slugify(name) {
  return String(name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export const FIELD_TYPES = [
  "text",
  "textarea",
  "number",
  "currency",
  "date",
  "boolean",
  "select",
  "email",
  "phone",
];

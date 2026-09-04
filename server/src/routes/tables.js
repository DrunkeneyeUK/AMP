import { Router } from "express";
import { db } from "../db.js";
import { requireAuth } from "../auth.js";
import { slugify, FIELD_TYPES } from "../slugify.js";

export const tablesRouter = Router();
tablesRouter.use(requireAuth);

function loadFields(tableId) {
  return db
    .prepare(
      "SELECT id, key, label, type, options, required, sort_order AS sortOrder FROM fields_def WHERE table_id = ? ORDER BY sort_order, id"
    )
    .all(tableId)
    .map((f) => ({
      ...f,
      required: !!f.required,
      options: f.options ? JSON.parse(f.options) : null,
    }));
}

function getTableOr404(slug, res) {
  const table = db
    .prepare("SELECT * FROM tables_def WHERE slug = ?")
    .get(slug);
  if (!table) {
    res.status(404).json({ error: "Table not found" });
    return null;
  }
  return table;
}

function validateFieldInput(f) {
  if (!f.label || !String(f.label).trim()) return "Field label is required";
  if (!FIELD_TYPES.includes(f.type)) return `Invalid field type: ${f.type}`;
  if (f.type === "select" && (!Array.isArray(f.options) || f.options.length === 0)) {
    return "Select fields need at least one option";
  }
  return null;
}

// List all tables with counts
tablesRouter.get("/", (req, res) => {
  const tables = db
    .prepare(
      `SELECT t.id, t.name, t.slug, t.description, t.created_at AS createdAt,
              u.username AS createdBy,
              (SELECT COUNT(*) FROM fields_def f WHERE f.table_id = t.id) AS fieldCount,
              (SELECT COUNT(*) FROM records r WHERE r.table_id = t.id) AS recordCount
       FROM tables_def t
       LEFT JOIN users u ON u.id = t.created_by
       ORDER BY t.created_at DESC`
    )
    .all();
  res.json({ tables });
});

// Create a table with initial fields
tablesRouter.post("/", (req, res) => {
  const { name, description = "", fields = [] } = req.body || {};
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: "Table name is required" });
  }

  let slug = slugify(name);
  if (!slug) return res.status(400).json({ error: "Table name is invalid" });
  const exists = db.prepare("SELECT id FROM tables_def WHERE slug = ?").get(slug);
  if (exists) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  for (const f of fields) {
    const err = validateFieldInput(f);
    if (err) return res.status(400).json({ error: err });
  }

  const insertTable = db.prepare(
    "INSERT INTO tables_def (name, slug, description, created_by) VALUES (?, ?, ?, ?)"
  );
  const insertField = db.prepare(
    "INSERT INTO fields_def (table_id, key, label, type, options, required, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );

  const tableId = db.transaction(() => {
    const result = insertTable.run(name.trim(), slug, description, req.user.id);
    const id = result.lastInsertRowid;
    fields.forEach((f, i) => {
      const key = slugify(f.label).replace(/-/g, "_") || `field_${i}`;
      insertField.run(
        id,
        key,
        f.label.trim(),
        f.type,
        f.type === "select" ? JSON.stringify(f.options) : null,
        f.required ? 1 : 0,
        i
      );
    });
    return id;
  })();

  const table = db.prepare("SELECT * FROM tables_def WHERE id = ?").get(tableId);
  res.status(201).json({ table: { ...table, fields: loadFields(tableId) } });
});

// Get one table with its field definitions
tablesRouter.get("/:slug", (req, res) => {
  const table = getTableOr404(req.params.slug, res);
  if (!table) return;
  res.json({ table: { ...table, fields: loadFields(table.id) } });
});

// Update table name/description
tablesRouter.put("/:slug", (req, res) => {
  const table = getTableOr404(req.params.slug, res);
  if (!table) return;
  const { name, description } = req.body || {};
  db.prepare("UPDATE tables_def SET name = COALESCE(?, name), description = COALESCE(?, description) WHERE id = ?")
    .run(name?.trim() || null, description ?? null, table.id);
  const updated = db.prepare("SELECT * FROM tables_def WHERE id = ?").get(table.id);
  res.json({ table: { ...updated, fields: loadFields(table.id) } });
});

// Delete a table (creator or admin only)
tablesRouter.delete("/:slug", (req, res) => {
  const table = getTableOr404(req.params.slug, res);
  if (!table) return;
  if (req.user.role !== "admin" && req.user.id !== table.created_by) {
    return res.status(403).json({ error: "Only the creator or an admin can delete this table" });
  }
  db.prepare("DELETE FROM tables_def WHERE id = ?").run(table.id);
  res.json({ ok: true });
});

// Add a field to an existing table
tablesRouter.post("/:slug/fields", (req, res) => {
  const table = getTableOr404(req.params.slug, res);
  if (!table) return;
  const f = req.body || {};
  const err = validateFieldInput(f);
  if (err) return res.status(400).json({ error: err });

  const maxOrder = db
    .prepare("SELECT COALESCE(MAX(sort_order), -1) AS m FROM fields_def WHERE table_id = ?")
    .get(table.id).m;

  let key = slugify(f.label).replace(/-/g, "_") || `field_${Date.now()}`;
  const clash = db
    .prepare("SELECT id FROM fields_def WHERE table_id = ? AND key = ?")
    .get(table.id, key);
  if (clash) key = `${key}_${Date.now().toString(36)}`;

  const result = db
    .prepare(
      "INSERT INTO fields_def (table_id, key, label, type, options, required, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)"
    )
    .run(
      table.id,
      key,
      f.label.trim(),
      f.type,
      f.type === "select" ? JSON.stringify(f.options) : null,
      f.required ? 1 : 0,
      maxOrder + 1
    );
  res.status(201).json({ fields: loadFields(table.id), fieldId: result.lastInsertRowid });
});

// Update a field
tablesRouter.put("/:slug/fields/:fieldId", (req, res) => {
  const table = getTableOr404(req.params.slug, res);
  if (!table) return;
  const field = db
    .prepare("SELECT * FROM fields_def WHERE id = ? AND table_id = ?")
    .get(req.params.fieldId, table.id);
  if (!field) return res.status(404).json({ error: "Field not found" });

  const f = req.body || {};
  const merged = { ...field, ...f, options: f.options ?? (field.options ? JSON.parse(field.options) : null) };
  const err = validateFieldInput({ label: merged.label, type: merged.type, options: merged.options });
  if (err) return res.status(400).json({ error: err });

  db.prepare(
    "UPDATE fields_def SET label = ?, type = ?, options = ?, required = ? WHERE id = ?"
  ).run(
    merged.label.trim(),
    merged.type,
    merged.type === "select" ? JSON.stringify(merged.options) : null,
    merged.required ? 1 : 0,
    field.id
  );
  res.json({ fields: loadFields(table.id) });
});

// Delete a field
tablesRouter.delete("/:slug/fields/:fieldId", (req, res) => {
  const table = getTableOr404(req.params.slug, res);
  if (!table) return;
  db.prepare("DELETE FROM fields_def WHERE id = ? AND table_id = ?").run(
    req.params.fieldId,
    table.id
  );
  res.json({ fields: loadFields(table.id) });
});

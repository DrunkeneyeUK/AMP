import { Router } from "express";
import { db } from "../db.js";
import { requireAuth } from "../auth.js";

export const recordsRouter = Router();
recordsRouter.use(requireAuth);

function getTableOr404(slug, res) {
  const table = db.prepare("SELECT * FROM tables_def WHERE slug = ?").get(slug);
  if (!table) {
    res.status(404).json({ error: "Table not found" });
    return null;
  }
  return table;
}

function loadFields(tableId) {
  return db
    .prepare("SELECT * FROM fields_def WHERE table_id = ? ORDER BY sort_order, id")
    .all(tableId);
}

function validateData(fields, data) {
  for (const f of fields) {
    const value = data[f.key];
    if (f.required && (value === undefined || value === null || value === "")) {
      return `"${f.label}" is required`;
    }
    if (f.type === "number" || f.type === "currency") {
      if (value !== undefined && value !== null && value !== "" && isNaN(Number(value))) {
        return `"${f.label}" must be a number`;
      }
    }
  }
  return null;
}

function shapeRecord(row) {
  return {
    id: row.id,
    data: JSON.parse(row.data),
    createdBy: row.createdByName,
    updatedBy: row.updatedByName,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

recordsRouter.get("/:slug/records", (req, res) => {
  const table = getTableOr404(req.params.slug, res);
  if (!table) return;
  const rows = db
    .prepare(
      `SELECT r.*, cu.username AS createdByName, uu.username AS updatedByName
       FROM records r
       LEFT JOIN users cu ON cu.id = r.created_by
       LEFT JOIN users uu ON uu.id = r.updated_by
       WHERE r.table_id = ?
       ORDER BY r.id DESC`
    )
    .all(table.id);
  res.json({ records: rows.map(shapeRecord) });
});

recordsRouter.post("/:slug/records", (req, res) => {
  const table = getTableOr404(req.params.slug, res);
  if (!table) return;
  const fields = loadFields(table.id);
  const data = (req.body && req.body.data) || {};
  const err = validateData(fields, data);
  if (err) return res.status(400).json({ error: err });

  const result = db
    .prepare(
      "INSERT INTO records (table_id, data, created_by, updated_by) VALUES (?, ?, ?, ?)"
    )
    .run(table.id, JSON.stringify(data), req.user.id, req.user.id);

  const row = db
    .prepare(
      `SELECT r.*, cu.username AS createdByName, uu.username AS updatedByName
       FROM records r
       LEFT JOIN users cu ON cu.id = r.created_by
       LEFT JOIN users uu ON uu.id = r.updated_by
       WHERE r.id = ?`
    )
    .get(result.lastInsertRowid);
  res.status(201).json({ record: shapeRecord(row) });
});

recordsRouter.put("/:slug/records/:id", (req, res) => {
  const table = getTableOr404(req.params.slug, res);
  if (!table) return;
  const existing = db
    .prepare("SELECT * FROM records WHERE id = ? AND table_id = ?")
    .get(req.params.id, table.id);
  if (!existing) return res.status(404).json({ error: "Record not found" });

  const fields = loadFields(table.id);
  const data = (req.body && req.body.data) || {};
  const err = validateData(fields, data);
  if (err) return res.status(400).json({ error: err });

  db.prepare(
    "UPDATE records SET data = ?, updated_by = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(JSON.stringify(data), req.user.id, existing.id);

  const row = db
    .prepare(
      `SELECT r.*, cu.username AS createdByName, uu.username AS updatedByName
       FROM records r
       LEFT JOIN users cu ON cu.id = r.created_by
       LEFT JOIN users uu ON uu.id = r.updated_by
       WHERE r.id = ?`
    )
    .get(existing.id);
  res.json({ record: shapeRecord(row) });
});

recordsRouter.delete("/:slug/records/:id", (req, res) => {
  const table = getTableOr404(req.params.slug, res);
  if (!table) return;
  db.prepare("DELETE FROM records WHERE id = ? AND table_id = ?").run(
    req.params.id,
    table.id
  );
  res.json({ ok: true });
});

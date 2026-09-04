import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "../db.js";
import { signToken, requireAuth } from "../auth.js";

export const authRouter = Router();

authRouter.post("/register", (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password || password.length < 8) {
    return res.status(400).json({
      error: "Username and a password of at least 8 characters are required",
    });
  }

  const existing = db
    .prepare("SELECT id FROM users WHERE username = ?")
    .get(username);
  if (existing) return res.status(409).json({ error: "Username already taken" });

  const userCount = db.prepare("SELECT COUNT(*) AS c FROM users").get().c;
  const role = userCount === 0 ? "admin" : "member";

  const password_hash = bcrypt.hashSync(password, 10);
  const result = db
    .prepare(
      "INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)"
    )
    .run(username, password_hash, role);

  const user = { id: result.lastInsertRowid, username, role };
  res.json({ token: signToken(user), user });
});

authRouter.post("/login", (req, res) => {
  const { username, password } = req.body || {};
  const row = db
    .prepare("SELECT * FROM users WHERE username = ?")
    .get(username || "");
  if (!row || !bcrypt.compareSync(password || "", row.password_hash)) {
    return res.status(401).json({ error: "Invalid username or password" });
  }
  const user = { id: row.id, username: row.username, role: row.role };
  res.json({ token: signToken(user), user });
});

authRouter.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

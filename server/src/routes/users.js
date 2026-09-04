import { Router } from "express";
import { db } from "../db.js";
import { requireAuth } from "../auth.js";

export const usersRouter = Router();
usersRouter.use(requireAuth);

usersRouter.get("/", (req, res) => {
  const users = db
    .prepare("SELECT id, username, role, created_at AS createdAt FROM users ORDER BY created_at")
    .all();
  res.json({ users });
});

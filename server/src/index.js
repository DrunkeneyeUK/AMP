import express from "express";
import cors from "cors";
import "./db.js";
import { authRouter } from "./routes/auth.js";
import { tablesRouter } from "./routes/tables.js";
import { recordsRouter } from "./routes/records.js";
import { usersRouter } from "./routes/users.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/tables", tablesRouter);
app.use("/api/tables", recordsRouter);
app.use("/api/users", usersRouter);

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Shared database server listening on port ${PORT}`);
});

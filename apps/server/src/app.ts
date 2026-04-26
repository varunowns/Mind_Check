import fs from "node:fs";
import path from "node:path";
import cors from "cors";
import express from "express";
import { config } from "./config.js";
import { runMigrations } from "./db/migrate.js";
import { authRouter } from "./routes/auth.js";
import { checkInRouter } from "./routes/checkins.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { eventRouter } from "./routes/events.js";
import { journalRouter } from "./routes/journal.js";
import { pulseRouter } from "./routes/pulse.js";
import { syncRouter } from "./routes/sync.js";

runMigrations();

export const app = express();

app.use(config.clientOrigin ? cors({ origin: config.clientOrigin }) : cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRouter);
app.use("/api/checkins", checkInRouter);
app.use("/api/events", eventRouter);
app.use("/api/pulse", pulseRouter);
app.use("/api/journal", journalRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/sync", syncRouter);

const publicIndexPath = path.resolve(process.cwd(), "public/index.html");

if (fs.existsSync(publicIndexPath)) {
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) {
      next();
      return;
    }

    if (path.extname(req.path)) {
      res.status(404).end();
      return;
    }

    res.sendFile(publicIndexPath);
  });
}

export default app;

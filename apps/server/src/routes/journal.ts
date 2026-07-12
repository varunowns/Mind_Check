import { Router } from "express";
import { journalSchema } from "@pebble/shared";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { journalRepository } from "../services/repositories.js";

export const journalRouter = Router();

journalRouter.use(requireAuth);

journalRouter.get("/today", (req: AuthenticatedRequest, res) => {
  const date = String(req.query.date ?? "");
  const entryType = String(req.query.entryType ?? "daily") as "daily" | "weekly_reflection";
  if (!date) {
    res.status(400).json({ message: "A date is required." });
    return;
  }

  res.json({ journal: journalRepository.getByDate(req.userId!, date, entryType) });
});

journalRouter.post("/", (req: AuthenticatedRequest, res) => {
  const parsed = journalSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Please review your journal entry and try again." });
    return;
  }

  const journal = journalRepository.upsert(req.userId!, parsed.data);
  res.status(201).json({ journal });
});

journalRouter.get("/history", (req: AuthenticatedRequest, res) => {
  res.json({ journals: journalRepository.listHistory(req.userId!) });
});

journalRouter.get("/reflections", (req: AuthenticatedRequest, res) => {
  res.json({ reflections: journalRepository.listReflections(req.userId!) });
});

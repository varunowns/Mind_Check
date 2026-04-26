import { Router } from "express";
import { checkInSchema, generateJournalPrompt, generateReliefSuggestions } from "@mindcheck/shared";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { checkInRepository, resultRepository, shieldRepository, userRepository } from "../services/repositories.js";

export const checkInRouter = Router();

checkInRouter.use(requireAuth);

checkInRouter.get("/today", (req: AuthenticatedRequest, res) => {
  const date = String(req.query.date ?? "");
  if (!req.userId || !date) {
    res.status(400).json({ message: "A date is required." });
    return;
  }

  const checkIns = checkInRepository.listByDate(req.userId, date);
  const latest = checkIns.at(-1) ?? null;
  const context = latest ? resultRepository.getContext(req.userId, latest) : null;
  res.json({
    checkIns,
    suggestions: latest ? generateReliefSuggestions(latest, {
      activeEvent: context?.activeEvent,
      sleepDebtHours: context?.sleepDebtHours,
      burnoutWarning: context?.burnout.active
    }) : [],
    context
  });
});

checkInRouter.post("/", (req: AuthenticatedRequest, res) => {
  const parsed = checkInSchema.safeParse(req.body);
  if (!parsed.success || !req.userId) {
    res.status(400).json({ message: "Please complete each step before saving your check-in." });
    return;
  }

  const record = checkInRepository.upsert(req.userId, parsed.data);
  userRepository.refreshWeeklyShield(req.userId);
  shieldRepository.consumeIfNeeded(req.userId, record.date);
  const context = resultRepository.getContext(req.userId, record);

  res.status(201).json({
    checkIn: record,
    prompt: generateJournalPrompt(record),
    suggestions: generateReliefSuggestions(record, {
      activeEvent: context.activeEvent,
      sleepDebtHours: context.sleepDebtHours,
      burnoutWarning: context.burnout.active
    }),
    context
  });
});

checkInRouter.get("/history", (req: AuthenticatedRequest, res) => {
  res.json({ checkIns: checkInRepository.listRecent(req.userId!, 180) });
});

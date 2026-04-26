import { Router } from "express";
import { pulseSchema } from "@mindcheck/shared";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { pulseRepository } from "../services/repositories.js";

export const pulseRouter = Router();
pulseRouter.use(requireAuth);

pulseRouter.get("/today", (req: AuthenticatedRequest, res) => {
  const date = String(req.query.date ?? "");
  if (!date) {
    res.status(400).json({ message: "A date is required." });
    return;
  }

  res.json({ pulses: pulseRepository.listByDate(req.userId!, date) });
});

pulseRouter.post("/", (req: AuthenticatedRequest, res) => {
  const parsed = pulseSchema.safeParse(req.body);
  if (!parsed.success || !req.userId) {
    res.status(400).json({ message: "Pulse check-in is incomplete." });
    return;
  }

  const pulse = pulseRepository.create(req.userId, parsed.data);
  res.status(201).json({ pulse });
});

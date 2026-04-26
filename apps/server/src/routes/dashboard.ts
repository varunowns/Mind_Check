import { Router } from "express";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { dashboardRepository } from "../services/repositories.js";

export const dashboardRouter = Router();
dashboardRouter.use(requireAuth);

dashboardRouter.get("/summary", (req: AuthenticatedRequest, res) => {
  res.json({ summary: dashboardRepository.getSummary(req.userId!) });
});

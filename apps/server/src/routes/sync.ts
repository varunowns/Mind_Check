import { Router } from "express";
import { syncSchema } from "@mindcheck/shared";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { syncRepository } from "../services/repositories.js";

export const syncRouter = Router();
syncRouter.use(requireAuth);

syncRouter.post("/local-data", (req: AuthenticatedRequest, res) => {
  const parsed = syncSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Local data could not be synced." });
    return;
  }

  syncRepository.syncLocalData(req.userId!, parsed.data);
  res.status(204).send();
});

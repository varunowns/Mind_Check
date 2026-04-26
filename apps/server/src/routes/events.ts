import { Router } from "express";
import { eventSchema } from "@mindcheck/shared";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { eventRepository } from "../services/repositories.js";

export const eventRouter = Router();
eventRouter.use(requireAuth);

eventRouter.get("/", (req: AuthenticatedRequest, res) => {
  res.json({ events: eventRepository.list(req.userId!) });
});

eventRouter.post("/", (req: AuthenticatedRequest, res) => {
  const parsed = eventSchema.safeParse(req.body);
  if (!parsed.success || !req.userId) {
    res.status(400).json({ message: "Event details look incomplete." });
    return;
  }

  const event = eventRepository.create(req.userId, parsed.data);
  res.status(201).json({ event });
});

eventRouter.delete("/:id", (req: AuthenticatedRequest, res) => {
  const deleted = eventRepository.delete(req.userId!, String(req.params.id));
  if (!deleted) {
    res.status(404).json({ message: "Event not found." });
    return;
  }

  res.status(204).send();
});

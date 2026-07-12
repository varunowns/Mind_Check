import { Router } from "express";
import { loginSchema, profileUpdateSchema, signupSchema, userSettingsSchema } from "@pebble/shared";
import { comparePassword, hashPassword, signToken } from "../utils/auth.js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { userRepository } from "../services/repositories.js";

export const authRouter = Router();

authRouter.post("/signup", async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Please check your details and try again." });
    return;
  }

  if (userRepository.findByEmail(parsed.data.email)) {
    res.status(409).json({ message: "An account with that email already exists." });
    return;
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const user = userRepository.create({ ...parsed.data, passwordHash });

  res.status(201).json({ token: signToken(user.id), user });
});

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Please check your details and try again." });
    return;
  }

  const user = userRepository.findByEmail(parsed.data.email);
  if (!user || !(await comparePassword(parsed.data.password, user.password_hash))) {
    res.status(401).json({ message: "That email and password combination did not match." });
    return;
  }

  res.json({
    token: signToken(user.id),
    user: userRepository.findById(user.id)!
  });
});

authRouter.get("/me", requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.userId ? userRepository.findById(req.userId) : null;
  if (!user) {
    res.status(404).json({ message: "User not found." });
    return;
  }

  res.json({ user });
});

authRouter.patch("/settings", requireAuth, (req: AuthenticatedRequest, res) => {
  const parsed = userSettingsSchema.safeParse(req.body);
  if (!parsed.success || !req.userId) {
    res.status(400).json({ message: "Settings could not be saved." });
    return;
  }

  const user = userRepository.updateSettings(req.userId, parsed.data);
  res.json({ user });
});

authRouter.patch("/profile", requireAuth, (req: AuthenticatedRequest, res) => {
  const parsed = profileUpdateSchema.safeParse(req.body);
  if (!parsed.success || !req.userId) {
    res.status(400).json({ message: "Profile could not be saved." });
    return;
  }

  const existing = userRepository.findByEmail(parsed.data.email);
  if (existing && existing.id !== req.userId) {
    res.status(409).json({ message: "That email is already linked to another account." });
    return;
  }

  const user = userRepository.updateProfile(req.userId, parsed.data);
  res.json({ user });
});

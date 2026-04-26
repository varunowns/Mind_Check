import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config.js";

export type AuthenticatedRequest = Request & { userId?: string };

export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ message: "Authentication required." });
    return;
  }

  try {
    const payload = jwt.verify(header.slice(7), config.jwtSecret) as { sub: string };
    req.userId = payload.sub;
    next();
  } catch {
    res.status(401).json({ message: "Session expired. Please sign in again." });
  }
};

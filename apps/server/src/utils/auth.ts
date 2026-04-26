import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../config.js";

export const hashPassword = (password: string) => bcrypt.hash(password, 10);
export const comparePassword = (password: string, hash: string) => bcrypt.compare(password, hash);

export const signToken = (userId: string) => jwt.sign({ sub: userId }, config.jwtSecret, { expiresIn: "7d" });

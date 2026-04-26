import dotenv from "dotenv";

dotenv.config();

const isVercel = Boolean(process.env.VERCEL);

export const config = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? "mindcheck-dev-secret",
  databasePath: process.env.DATABASE_PATH ?? (isVercel ? "/tmp/mindcheck.db" : "apps/server/data/mindcheck.db"),
  clientOrigin: process.env.CLIENT_ORIGIN ?? (isVercel ? undefined : "http://localhost:5173")
};

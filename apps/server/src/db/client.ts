import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { config } from "../config.js";

const resolvedPath = config.databasePath === ":memory:"
  ? ":memory:"
  : path.resolve(process.cwd(), config.databasePath);

if (resolvedPath !== ":memory:") {
  fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
}

export const database = new DatabaseSync(resolvedPath);
database.exec("PRAGMA journal_mode = WAL;");

import { database } from "./client.js";

const tableExists = (name: string) => {
  const row = database.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?").get(name) as { name: string } | undefined;
  return Boolean(row);
};

const columnExists = (table: string, column: string) => {
  const rows = database.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  return rows.some((row) => row.name === column);
};

const createBaseTables = () => {
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS check_ins (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      date TEXT NOT NULL,
      session TEXT NOT NULL DEFAULT 'full',
      sleep_hours REAL NOT NULL,
      sleep_quality INTEGER NOT NULL,
      meals TEXT NOT NULL,
      activity TEXT NOT NULL,
      social TEXT NOT NULL,
      workload TEXT NOT NULL,
      stressor TEXT NOT NULL,
      mood TEXT NOT NULL,
      energy INTEGER NOT NULL,
      meeting_count TEXT,
      submitted_at_local TEXT NOT NULL DEFAULT '',
      stress_score INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(user_id, date, session),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS journals (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      date TEXT NOT NULL,
      prompt TEXT NOT NULL,
      content TEXT NOT NULL,
      word_count INTEGER NOT NULL,
      entry_type TEXT NOT NULL DEFAULT 'daily',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(user_id, date, entry_type),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
};

const addColumnIfMissing = (table: string, column: string, definition: string) => {
  if (!columnExists(table, column)) {
    database.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
};

const migrateUsers = () => {
  addColumnIfMissing("users", "phone_number", "TEXT NOT NULL DEFAULT ''");
  addColumnIfMissing("users", "region", "TEXT NOT NULL DEFAULT ''");
  addColumnIfMissing("users", "city", "TEXT NOT NULL DEFAULT ''");
  addColumnIfMissing("users", "checkin_mode", "TEXT NOT NULL DEFAULT 'once'");
  addColumnIfMissing("users", "recommended_sleep_hours", "REAL NOT NULL DEFAULT 8");
  addColumnIfMissing("users", "late_threshold", "TEXT NOT NULL DEFAULT '21:00'");
  addColumnIfMissing("users", "streak_shields", "INTEGER NOT NULL DEFAULT 1 CHECK(streak_shields BETWEEN 0 AND 1)");
  addColumnIfMissing("users", "burnout_active", "INTEGER NOT NULL DEFAULT 0");
  addColumnIfMissing("users", "last_shield_reset_week", "TEXT NOT NULL DEFAULT ''");
};

const rebuildCheckInsIfNeeded = () => {
  if (!tableExists("check_ins")) return;

  if (
    columnExists("check_ins", "session")
    && columnExists("check_ins", "meeting_count")
    && columnExists("check_ins", "submitted_at_local")
  ) {
    return;
  }

  database.exec(`
    ALTER TABLE check_ins RENAME TO check_ins_legacy;

    CREATE TABLE check_ins (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      date TEXT NOT NULL,
      session TEXT NOT NULL DEFAULT 'full',
      sleep_hours REAL NOT NULL,
      sleep_quality INTEGER NOT NULL,
      meals TEXT NOT NULL,
      activity TEXT NOT NULL,
      social TEXT NOT NULL,
      workload TEXT NOT NULL,
      stressor TEXT NOT NULL,
      mood TEXT NOT NULL,
      energy INTEGER NOT NULL,
      meeting_count TEXT,
      submitted_at_local TEXT NOT NULL DEFAULT '',
      stress_score INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(user_id, date, session),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    INSERT INTO check_ins (
      id,
      user_id,
      date,
      session,
      sleep_hours,
      sleep_quality,
      meals,
      activity,
      social,
      workload,
      stressor,
      mood,
      energy,
      meeting_count,
      submitted_at_local,
      stress_score,
      created_at,
      updated_at
    )
    SELECT
      id,
      user_id,
      date,
      'full',
      sleep_hours,
      sleep_quality,
      meals,
      activity,
      social,
      workload,
      stressor,
      mood,
      energy,
      NULL,
      created_at,
      stress_score,
      created_at,
      updated_at
    FROM check_ins_legacy;

    DROP TABLE check_ins_legacy;
  `);
};

const rebuildJournalsIfNeeded = () => {
  if (!tableExists("journals")) return;
  if (columnExists("journals", "entry_type")) return;

  database.exec(`
    ALTER TABLE journals RENAME TO journals_legacy;

    CREATE TABLE journals (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      date TEXT NOT NULL,
      prompt TEXT NOT NULL,
      content TEXT NOT NULL,
      word_count INTEGER NOT NULL,
      entry_type TEXT NOT NULL DEFAULT 'daily',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(user_id, date, entry_type),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    INSERT INTO journals (
      id,
      user_id,
      date,
      prompt,
      content,
      word_count,
      entry_type,
      created_at,
      updated_at
    )
    SELECT
      id,
      user_id,
      date,
      prompt,
      content,
      word_count,
      'daily',
      created_at,
      updated_at
    FROM journals_legacy;

    DROP TABLE journals_legacy;
  `);
};

const createFeatureTables = () => {
  database.exec(`
    CREATE TABLE IF NOT EXISTS upcoming_events (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      type TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS pulses (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      date TEXT NOT NULL,
      mood INTEGER NOT NULL,
      focus INTEGER NOT NULL,
      created_at_local TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS burnout_warnings (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      triggered_at TEXT NOT NULL,
      avg_score INTEGER NOT NULL,
      days_count INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS streak_shield_usage (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      used_on TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
};

export const runMigrations = () => {
  createBaseTables();
  migrateUsers();
  rebuildCheckInsIfNeeded();
  rebuildJournalsIfNeeded();
  createFeatureTables();
};

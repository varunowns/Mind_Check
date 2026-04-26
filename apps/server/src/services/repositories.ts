import { nanoid } from "nanoid";
import {
  buildDashboardSummary,
  calculateBurnoutStatus,
  calculateSleepDebt,
  calculateStressScore,
  generateJournalPrompt,
  type BurnoutStatus,
  type BurnoutWarning,
  type CheckInInput,
  type CheckInRecord,
  type DashboardSummary,
  type JournalEntry,
  type LocalSyncPayload,
  type PulseInput,
  type PulseRecord,
  type ShieldUsage,
  type UpcomingEvent,
  type User,
  type UserProfileUpdate,
  type UserSettingsUpdate
} from "@mindcheck/shared";
import { database } from "../db/client.js";
import { getWordCount, toDateKey } from "../utils/date.js";

type UserRow = {
  id: string;
  name: string;
  email: string;
  phone_number: string;
  region: string;
  city: string;
  password_hash: string;
  created_at: string;
  checkin_mode: User["checkinMode"];
  recommended_sleep_hours: number;
  late_threshold: string;
  streak_shields: number;
  burnout_active: number;
  last_shield_reset_week: string;
};

type CheckInRow = {
  id: string;
  user_id: string;
  date: string;
  session: CheckInRecord["session"];
  sleep_hours: number;
  sleep_quality: number;
  meals: CheckInRecord["meals"];
  activity: CheckInRecord["activity"];
  social: CheckInRecord["social"];
  workload: CheckInRecord["workload"];
  stressor: string;
  mood: CheckInRecord["mood"];
  energy: number;
  meeting_count: CheckInRecord["meetingCount"];
  submitted_at_local: string;
  stress_score: number;
  created_at: string;
  updated_at: string;
};

type JournalRow = {
  id: string;
  user_id: string;
  date: string;
  prompt: string;
  content: string;
  word_count: number;
  entry_type: JournalEntry["entryType"];
  created_at: string;
  updated_at: string;
};

type EventRow = {
  id: string;
  user_id: string;
  title: string;
  date: string;
  type: UpcomingEvent["type"];
  created_at: string;
};

type PulseRow = {
  id: string;
  user_id: string;
  date: string;
  mood: number;
  focus: number;
  created_at_local: string;
  created_at: string;
};

type BurnoutWarningRow = {
  id: string;
  user_id: string;
  triggered_at: string;
  avg_score: number;
  days_count: number;
};

type ShieldUsageRow = {
  id: string;
  user_id: string;
  used_on: string;
  created_at: string;
};

const DAY = 86_400_000;

const parseDateKey = (value: string) => new Date(`${value}T00:00:00.000Z`);
const addDays = (value: string, amount: number) => toDateKey(new Date(parseDateKey(value).getTime() + (amount * DAY)));
const getWeekStartKey = (value = new Date()) => {
  const date = new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  const day = date.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setUTCDate(date.getUTCDate() + diff);
  return toDateKey(date);
};

const mapUser = (row: UserRow): User => ({
  id: row.id,
  name: row.name,
  email: row.email,
  phoneNumber: row.phone_number,
  region: row.region,
  city: row.city,
  createdAt: row.created_at,
  checkinMode: row.checkin_mode,
  recommendedSleepHours: row.recommended_sleep_hours,
  lateThreshold: row.late_threshold,
  streakShields: row.streak_shields,
  burnoutActive: Boolean(row.burnout_active)
});

const mapCheckIn = (row: CheckInRow): CheckInRecord => ({
  id: row.id,
  userId: row.user_id,
  date: row.date,
  session: row.session,
  sleepHours: row.sleep_hours,
  sleepQuality: row.sleep_quality,
  meals: row.meals,
  activity: row.activity,
  social: row.social,
  workload: row.workload,
  stressor: row.stressor,
  mood: row.mood,
  energy: row.energy,
  meetingCount: row.meeting_count,
  submittedAtLocal: row.submitted_at_local || row.created_at,
  stressScore: row.stress_score,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const mapJournal = (row: JournalRow): JournalEntry => ({
  id: row.id,
  userId: row.user_id,
  date: row.date,
  prompt: row.prompt,
  content: row.content,
  wordCount: row.word_count,
  entryType: row.entry_type,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const mapEvent = (row: EventRow): UpcomingEvent => ({
  id: row.id,
  userId: row.user_id,
  title: row.title,
  date: row.date,
  type: row.type,
  createdAt: row.created_at
});

const mapPulse = (row: PulseRow): PulseRecord => ({
  id: row.id,
  userId: row.user_id,
  date: row.date,
  mood: row.mood,
  focus: row.focus,
  createdAtLocal: row.created_at_local,
  createdAt: row.created_at
});

const mapBurnoutWarning = (row: BurnoutWarningRow): BurnoutWarning => ({
  id: row.id,
  userId: row.user_id,
  triggeredAt: row.triggered_at,
  avgScore: row.avg_score,
  daysCount: row.days_count
});

const mapShieldUsage = (row: ShieldUsageRow): ShieldUsage => ({
  id: row.id,
  userId: row.user_id,
  usedOn: row.used_on,
  createdAt: row.created_at
});

const getUserRowById = (id: string) => database.prepare("SELECT * FROM users WHERE id = ?").get(id) as UserRow | undefined;

const listCheckInDates = (userId: string) => (
  database.prepare("SELECT DISTINCT date FROM check_ins WHERE user_id = ? ORDER BY date DESC").all(userId) as Array<{ date: string }>
).map((row) => row.date);

const latestCheckInForDate = (userId: string, date: string) => {
  const row = database.prepare("SELECT * FROM check_ins WHERE user_id = ? AND date = ? ORDER BY updated_at DESC LIMIT 1").get(userId, date) as CheckInRow | undefined;
  return row ? mapCheckIn(row) : null;
};

export const userRepository = {
  create: (data: { name: string; email: string; passwordHash: string }) => {
    const id = nanoid();
    const createdAt = new Date().toISOString();
    database.prepare(`
      INSERT INTO users (
        id,
        name,
        email,
        phone_number,
        region,
        city,
        password_hash,
        created_at,
        checkin_mode,
        recommended_sleep_hours,
        late_threshold,
        streak_shields,
        burnout_active,
        last_shield_reset_week
      )
      VALUES (?, ?, ?, '', '', '', ?, ?, 'once', 8, '21:00', 1, 0, ?)
    `).run(id, data.name, data.email.toLowerCase(), data.passwordHash, createdAt, getWeekStartKey(new Date()));
    return userRepository.findById(id)!;
  },
  findByEmail: (email: string) => database.prepare("SELECT * FROM users WHERE email = ?").get(email.toLowerCase()) as UserRow | undefined,
  findById: (id: string) => {
    const row = getUserRowById(id);
    return row ? mapUser(row) : null;
  },
  updateSettings: (userId: string, settings: UserSettingsUpdate) => {
    database.prepare(`
      UPDATE users
      SET checkin_mode = ?, recommended_sleep_hours = ?, late_threshold = ?
      WHERE id = ?
    `).run(settings.checkinMode, settings.recommendedSleepHours, settings.lateThreshold, userId);

    return userRepository.findById(userId)!;
  },
  updateProfile: (userId: string, profile: UserProfileUpdate) => {
    database.prepare(`
      UPDATE users
      SET name = ?, email = ?, phone_number = ?, region = ?, city = ?
      WHERE id = ?
    `).run(profile.name, profile.email.toLowerCase(), profile.phoneNumber, profile.region, profile.city, userId);

    return userRepository.findById(userId)!;
  },
  setBurnoutActive: (userId: string, active: boolean) => {
    database.prepare("UPDATE users SET burnout_active = ? WHERE id = ?").run(active ? 1 : 0, userId);
  },
  setShieldState: (userId: string, streakShields: number, weekKey?: string) => {
    if (weekKey) {
      database.prepare("UPDATE users SET streak_shields = ?, last_shield_reset_week = ? WHERE id = ?").run(streakShields, weekKey, userId);
      return;
    }
    database.prepare("UPDATE users SET streak_shields = ? WHERE id = ?").run(streakShields, userId);
  },
  refreshWeeklyShield: (userId: string, now = new Date()) => {
    const row = getUserRowById(userId);
    if (!row) return null;

    const currentWeek = getWeekStartKey(now);
    if (row.last_shield_reset_week === currentWeek) {
      return mapUser(row);
    }

    const previousWeekStart = addDays(currentWeek, -7);
    const previousWeekEnd = addDays(currentWeek, -1);
    const countRow = database.prepare(`
      SELECT COUNT(DISTINCT date) AS count
      FROM check_ins
      WHERE user_id = ? AND date >= ? AND date <= ?
    `).get(userId, previousWeekStart, previousWeekEnd) as { count: number };
    const streakShields = countRow.count >= 4 ? 1 : 0;

    userRepository.setShieldState(userId, streakShields, currentWeek);
    return userRepository.findById(userId);
  }
};

export const shieldRepository = {
  listHistory: (userId: string) => {
    const rows = database.prepare("SELECT * FROM streak_shield_usage WHERE user_id = ? ORDER BY used_on DESC").all(userId) as ShieldUsageRow[];
    return rows.map(mapShieldUsage);
  },
  consumeIfNeeded: (userId: string, today = toDateKey()) => {
    const user = userRepository.findById(userId);
    if (!user || user.streakShields < 1) return null;

    const shieldHistory = shieldRepository.listHistory(userId);
    const checkInDates = new Set(listCheckInDates(userId));
    const coveredDates = new Set<string>([...checkInDates, ...shieldHistory.map((item) => item.usedOn)]);
    let gapDate = coveredDates.has(today) ? today : addDays(today, -1);

    while (coveredDates.has(gapDate)) {
      gapDate = addDays(gapDate, -1);
    }

    let priorCoveredDays = 0;
    let cursor = addDays(gapDate, -1);
    while (coveredDates.has(cursor)) {
      priorCoveredDays += 1;
      cursor = addDays(cursor, -1);
    }

    if (priorCoveredDays < 3) return null;

    const id = nanoid();
    const createdAt = new Date().toISOString();
    database.prepare("INSERT INTO streak_shield_usage (id, user_id, used_on, created_at) VALUES (?, ?, ?, ?)").run(id, userId, gapDate, createdAt);
    userRepository.setShieldState(userId, 0);
    return { id, userId, usedOn: gapDate, createdAt };
  }
};

export const checkInRepository = {
  upsert: (userId: string, input: CheckInInput) => {
    const now = new Date().toISOString();
    const existing = database.prepare("SELECT * FROM check_ins WHERE user_id = ? AND date = ? AND session = ?").get(userId, input.date, input.session) as CheckInRow | undefined;
    const { score } = calculateStressScore(input);
    const id = existing?.id ?? nanoid();

    database.prepare(`
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
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, date, session) DO UPDATE SET
        sleep_hours = excluded.sleep_hours,
        sleep_quality = excluded.sleep_quality,
        meals = excluded.meals,
        activity = excluded.activity,
        social = excluded.social,
        workload = excluded.workload,
        stressor = excluded.stressor,
        mood = excluded.mood,
        energy = excluded.energy,
        meeting_count = excluded.meeting_count,
        submitted_at_local = excluded.submitted_at_local,
        stress_score = excluded.stress_score,
        updated_at = excluded.updated_at
    `).run(
      id,
      userId,
      input.date,
      input.session,
      input.sleepHours,
      input.sleepQuality,
      input.meals,
      input.activity,
      input.social,
      input.workload,
      input.stressor,
      input.mood,
      input.energy,
      input.meetingCount,
      input.submittedAtLocal,
      score,
      existing?.created_at ?? now,
      now
    );

    return checkInRepository.getByDateAndSession(userId, input.date, input.session)!;
  },
  getByDateAndSession: (userId: string, date: string, session: CheckInRecord["session"]) => {
    const row = database.prepare("SELECT * FROM check_ins WHERE user_id = ? AND date = ? AND session = ?").get(userId, date, session) as CheckInRow | undefined;
    return row ? mapCheckIn(row) : null;
  },
  listByDate: (userId: string, date: string) => {
    const rows = database.prepare("SELECT * FROM check_ins WHERE user_id = ? AND date = ? ORDER BY created_at ASC").all(userId, date) as CheckInRow[];
    return rows.map(mapCheckIn);
  },
  listRecent: (userId: string, limit = 120) => {
    const rows = database.prepare("SELECT * FROM check_ins WHERE user_id = ? ORDER BY date DESC, created_at DESC LIMIT ?").all(userId, limit) as CheckInRow[];
    return rows.map(mapCheckIn);
  }
};

export const pulseRepository = {
  create: (userId: string, input: PulseInput) => {
    const id = nanoid();
    const createdAt = new Date().toISOString();
    database.prepare(`
      INSERT INTO pulses (id, user_id, date, mood, focus, created_at_local, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, userId, input.date, input.mood, input.focus, input.createdAtLocal, createdAt);

    return { id, userId, date: input.date, mood: input.mood, focus: input.focus, createdAtLocal: input.createdAtLocal, createdAt };
  },
  createIfMissing: (userId: string, input: PulseInput) => {
    const existing = database.prepare("SELECT * FROM pulses WHERE user_id = ? AND created_at_local = ?").get(userId, input.createdAtLocal) as PulseRow | undefined;
    return existing ? mapPulse(existing) : pulseRepository.create(userId, input);
  },
  listByDate: (userId: string, date: string) => {
    const rows = database.prepare("SELECT * FROM pulses WHERE user_id = ? AND date = ? ORDER BY created_at ASC").all(userId, date) as PulseRow[];
    return rows.map(mapPulse);
  },
  listRecent: (userId: string, limit = 200) => {
    const rows = database.prepare("SELECT * FROM pulses WHERE user_id = ? ORDER BY created_at DESC LIMIT ?").all(userId, limit) as PulseRow[];
    return rows.map(mapPulse);
  }
};

export const eventRepository = {
  create: (userId: string, data: Pick<UpcomingEvent, "title" | "date" | "type">) => {
    const id = nanoid();
    const createdAt = new Date().toISOString();
    database.prepare(`
      INSERT INTO upcoming_events (id, user_id, title, date, type, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, userId, data.title, data.date, data.type, createdAt);

    return { id, userId, title: data.title, date: data.date, type: data.type, createdAt };
  },
  createIfMissing: (userId: string, data: Pick<UpcomingEvent, "title" | "date" | "type">) => {
    const existing = database.prepare(`
      SELECT * FROM upcoming_events
      WHERE user_id = ? AND title = ? AND date = ? AND type = ?
      LIMIT 1
    `).get(userId, data.title, data.date, data.type) as EventRow | undefined;

    return existing ? mapEvent(existing) : eventRepository.create(userId, data);
  },
  list: (userId: string) => {
    const rows = database.prepare("SELECT * FROM upcoming_events WHERE user_id = ? ORDER BY date ASC, created_at ASC").all(userId) as EventRow[];
    return rows.map(mapEvent);
  },
  delete: (userId: string, id: string) => {
    const result = database.prepare("DELETE FROM upcoming_events WHERE id = ? AND user_id = ?").run(id, userId);
    return result.changes > 0;
  }
};

export const journalRepository = {
  upsert: (userId: string, data: { date: string; prompt?: string; content: string; entryType: JournalEntry["entryType"] }) => {
    const now = new Date().toISOString();
    const existing = database.prepare("SELECT * FROM journals WHERE user_id = ? AND date = ? AND entry_type = ?").get(userId, data.date, data.entryType) as JournalRow | undefined;
    const checkIn = latestCheckInForDate(userId, data.date);
    const prompt = data.prompt ?? (checkIn ? generateJournalPrompt(checkIn) : "What felt important today, and what support do you want to give yourself tonight?");
    const id = existing?.id ?? nanoid();
    const wordCount = getWordCount(data.content);

    database.prepare(`
      INSERT INTO journals (id, user_id, date, prompt, content, word_count, entry_type, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, date, entry_type) DO UPDATE SET
        prompt = excluded.prompt,
        content = excluded.content,
        word_count = excluded.word_count,
        updated_at = excluded.updated_at
    `).run(id, userId, data.date, prompt, data.content, wordCount, data.entryType, existing?.created_at ?? now, now);

    return journalRepository.getByDate(userId, data.date, data.entryType)!;
  },
  getByDate: (userId: string, date: string, entryType: JournalEntry["entryType"] = "daily") => {
    const row = database.prepare("SELECT * FROM journals WHERE user_id = ? AND date = ? AND entry_type = ?").get(userId, date, entryType) as JournalRow | undefined;
    return row ? mapJournal(row) : null;
  },
  listHistory: (userId: string) => {
    const rows = database.prepare("SELECT * FROM journals WHERE user_id = ? AND entry_type = 'daily' ORDER BY date DESC").all(userId) as JournalRow[];
    return rows.map(mapJournal);
  },
  listReflections: (userId: string) => {
    const rows = database.prepare("SELECT * FROM journals WHERE user_id = ? AND entry_type = 'weekly_reflection' ORDER BY date DESC").all(userId) as JournalRow[];
    return rows.map(mapJournal);
  },
  listAll: (userId: string) => {
    const rows = database.prepare("SELECT * FROM journals WHERE user_id = ? ORDER BY date DESC, created_at DESC").all(userId) as JournalRow[];
    return rows.map(mapJournal);
  }
};

export const burnoutRepository = {
  listHistory: (userId: string) => {
    const rows = database.prepare("SELECT * FROM burnout_warnings WHERE user_id = ? ORDER BY triggered_at DESC").all(userId) as BurnoutWarningRow[];
    return rows.map(mapBurnoutWarning);
  },
  refreshState: (userId: string, checkIns: CheckInRecord[]): BurnoutStatus => {
    const user = userRepository.findById(userId);
    if (!user) return { active: false, avgScore: 0, daysCount: 0 };

    const evaluation = calculateBurnoutStatus(checkIns, user.burnoutActive);

    if (!user.burnoutActive && evaluation.shouldTrigger) {
      const id = nanoid();
      const triggeredAt = new Date().toISOString();
      database.prepare(`
        INSERT INTO burnout_warnings (id, user_id, triggered_at, avg_score, days_count)
        VALUES (?, ?, ?, ?, ?)
      `).run(id, userId, triggeredAt, evaluation.avgScore, evaluation.daysCount);
      userRepository.setBurnoutActive(userId, true);
      return { active: true, avgScore: evaluation.avgScore, daysCount: evaluation.daysCount };
    }

    if (user.burnoutActive && evaluation.shouldClear) {
      userRepository.setBurnoutActive(userId, false);
      return { active: false, avgScore: 0, daysCount: 0 };
    }

    return { active: evaluation.active, avgScore: evaluation.avgScore, daysCount: evaluation.daysCount };
  }
};

export const dashboardRepository = {
  getSummary: (userId: string): DashboardSummary => {
    userRepository.refreshWeeklyShield(userId);
    shieldRepository.consumeIfNeeded(userId);

    const checkIns = checkInRepository.listRecent(userId, 180);
    const burnout = burnoutRepository.refreshState(userId, checkIns);
    const user = userRepository.findById(userId)!;

    return buildDashboardSummary({
      checkIns,
      pulses: pulseRepository.listRecent(userId, 200),
      events: eventRepository.list(userId),
      journals: journalRepository.listAll(userId),
      burnoutWarnings: burnoutRepository.listHistory(userId),
      shieldHistory: shieldRepository.listHistory(userId),
      recommendedSleepHours: user.recommendedSleepHours,
      lateThreshold: user.lateThreshold,
      shieldAvailable: user.streakShields > 0,
      burnoutActive: burnout.active
    });
  }
};

export const resultRepository = {
  getContext: (userId: string, checkIn: CheckInRecord) => {
    const user = userRepository.findById(userId)!;
    const checkIns = checkInRepository.listRecent(userId, 120);
    const burnout = burnoutRepository.refreshState(userId, checkIns);
    const events = eventRepository.list(userId);
    const activeEvent = events.find((event) => event.date >= checkIn.date && event.date <= addDays(checkIn.date, 7)) ?? null;
    const sleepDebtHours = calculateSleepDebt(checkIns, user.recommendedSleepHours, checkIn.date).currentDebtHours;

    return {
      activeEvent,
      sleepDebtHours,
      burnout
    };
  }
};

export const syncRepository = {
  syncLocalData: (userId: string, payload: LocalSyncPayload) => {
    payload.checkIns.forEach((checkIn) => {
      if (!checkInRepository.getByDateAndSession(userId, checkIn.date, checkIn.session)) {
        checkInRepository.upsert(userId, checkIn);
      }
    });

    payload.journals.forEach((journal) => {
      if (!journalRepository.getByDate(userId, journal.date, journal.entryType)) {
        journalRepository.upsert(userId, {
          date: journal.date,
          prompt: journal.prompt,
          content: journal.content,
          entryType: journal.entryType
        });
      }
    });

    payload.pulses.forEach((pulse) => {
      pulseRepository.createIfMissing(userId, pulse);
    });

    payload.events.forEach((event) => {
      eventRepository.createIfMissing(userId, event);
    });
  }
};

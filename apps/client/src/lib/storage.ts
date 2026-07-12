import type { CheckInInput, JournalEntry, LocalSyncPayload, PulseInput, UpcomingEvent, User } from "@pebble/shared";

import type { BreathingSession } from "./breathing";

const guestCheckInsKey = "pebble.guest.checkins";
const guestJournalsKey = "pebble.guest.journals";
const guestPulsesKey = "pebble.guest.pulses";
const guestEventsKey = "pebble.guest.events";
const guestSettingsKey = "pebble.guest.settings";
const breathingSessionsKey = "pebble.breathing.sessions";
const draftKey = "pebble.draft.checkin";
const tokenKey = "pebble.auth.token";
const themeKey = "pebble-theme";
const legacyThemeKey = "pebble.theme";
const reminderKey = "pebble.reminder";
const shieldToastKey = "pebble.shield-toast";

export const guestSettingsDefaults: Pick<User, "checkinMode" | "recommendedSleepHours" | "lateThreshold"> = {
  checkinMode: "once",
  recommendedSleepHours: 8,
  lateThreshold: "21:00"
};

const readJson = <T,>(key: string, fallback: T): T => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
};

export const storage = {
  saveGuestCheckIn: (checkIn: CheckInInput) => {
    const current = readJson<CheckInInput[]>(guestCheckInsKey, []).filter((item) => !(item.date === checkIn.date && item.session === checkIn.session));
    localStorage.setItem(guestCheckInsKey, JSON.stringify([...current, checkIn]));
  },
  getGuestCheckIns: () => readJson<CheckInInput[]>(guestCheckInsKey, []),
  saveGuestJournal: (journal: Pick<JournalEntry, "date" | "prompt" | "content" | "wordCount" | "entryType">) => {
    const current = readJson<Array<Pick<JournalEntry, "date" | "prompt" | "content" | "wordCount" | "entryType">>>(guestJournalsKey, [])
      .filter((item) => !(item.date === journal.date && item.entryType === journal.entryType));
    localStorage.setItem(guestJournalsKey, JSON.stringify([...current, journal]));
  },
  getGuestJournals: () => readJson<Array<Pick<JournalEntry, "date" | "prompt" | "content" | "wordCount" | "entryType">>>(guestJournalsKey, []),
  saveGuestPulse: (pulse: PulseInput) => {
    const current = readJson<PulseInput[]>(guestPulsesKey, []);
    localStorage.setItem(guestPulsesKey, JSON.stringify([...current, pulse]));
  },
  getGuestPulses: () => readJson<PulseInput[]>(guestPulsesKey, []),
  saveBreathingSession: (session: BreathingSession) => {
    const next = [...readJson<BreathingSession[]>(breathingSessionsKey, []), session].sort((left, right) => left.completedAt.localeCompare(right.completedAt));
    localStorage.setItem(breathingSessionsKey, JSON.stringify(next));
    return next;
  },
  getBreathingSessions: () => readJson<BreathingSession[]>(breathingSessionsKey, []),
  saveGuestEvent: (event: UpcomingEvent) => {
    const current = readJson<UpcomingEvent[]>(guestEventsKey, []).filter((item) => item.id !== event.id);
    localStorage.setItem(guestEventsKey, JSON.stringify([...current, event]));
  },
  deleteGuestEvent: (id: string) => {
    const current = readJson<UpcomingEvent[]>(guestEventsKey, []).filter((item) => item.id !== id);
    localStorage.setItem(guestEventsKey, JSON.stringify(current));
  },
  getGuestEvents: () => readJson<UpcomingEvent[]>(guestEventsKey, []),
  saveGuestSettings: (settings: Pick<User, "checkinMode" | "recommendedSleepHours" | "lateThreshold">) => {
    localStorage.setItem(guestSettingsKey, JSON.stringify(settings));
  },
  getGuestSettings: () => ({
    ...guestSettingsDefaults,
    ...readJson<Partial<Pick<User, "checkinMode" | "recommendedSleepHours" | "lateThreshold">>>(guestSettingsKey, {})
  }),
  clearGuestData: () => {
    localStorage.removeItem(guestCheckInsKey);
    localStorage.removeItem(guestJournalsKey);
    localStorage.removeItem(guestPulsesKey);
    localStorage.removeItem(guestEventsKey);
    localStorage.removeItem(breathingSessionsKey);
  },
  getSyncPayload: (): LocalSyncPayload => ({
    checkIns: storage.getGuestCheckIns(),
    journals: storage.getGuestJournals(),
    pulses: storage.getGuestPulses(),
    events: storage.getGuestEvents().map((item) => ({ title: item.title, date: item.date, type: item.type }))
  }),
  saveDraftCheckIn: (checkIn: Partial<CheckInInput>) => localStorage.setItem(draftKey, JSON.stringify(checkIn)),
  getDraftCheckIn: () => readJson<Partial<CheckInInput>>(draftKey, {}),
  clearDraftCheckIn: () => localStorage.removeItem(draftKey),
  setToken: (token: string | null) => token ? localStorage.setItem(tokenKey, token) : localStorage.removeItem(tokenKey),
  getToken: () => localStorage.getItem(tokenKey),
  setTheme: (theme: "light" | "dark") => {
    localStorage.setItem(themeKey, theme);
    localStorage.removeItem(legacyThemeKey);
  },
  getTheme: () => {
    const storedTheme = localStorage.getItem(themeKey) ?? localStorage.getItem(legacyThemeKey);
    return storedTheme === "dark" || storedTheme === "light" ? storedTheme : null;
  },
  markReminderSent: (dateKey: string) => localStorage.setItem(reminderKey, dateKey),
  getReminderSent: () => localStorage.getItem(reminderKey),
  setSeenShieldUsage: (id: string) => localStorage.setItem(shieldToastKey, id),
  getSeenShieldUsage: () => localStorage.getItem(shieldToastKey)
};

import type { CheckInInput, JournalEntry, LocalSyncPayload, PulseInput, UpcomingEvent, User } from "@mindcheck/shared";

import type { BreathingSession } from "./breathing";

const guestCheckInsKey = "mindcheck.guest.checkins";
const guestJournalsKey = "mindcheck.guest.journals";
const guestPulsesKey = "mindcheck.guest.pulses";
const guestEventsKey = "mindcheck.guest.events";
const guestSettingsKey = "mindcheck.guest.settings";
const breathingSessionsKey = "mindcheck.breathing.sessions";
const draftKey = "mindcheck.draft.checkin";
const tokenKey = "mindcheck.auth.token";
const themeKey = "mindcheck-theme";
const legacyThemeKey = "mindcheck.theme";
const reminderKey = "mindcheck.reminder";
const shieldToastKey = "mindcheck.shield-toast";

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

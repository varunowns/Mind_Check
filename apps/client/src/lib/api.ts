import type {
  AuthResponse,
  CheckInInput,
  CheckInRecord,
  CheckInResultContext,
  DashboardSummary,
  JournalEntry,
  LocalSyncPayload,
  PulseInput,
  PulseRecord,
  ReliefSuggestion,
  UpcomingEvent,
  User,
  UserProfileUpdate,
  UserSettingsUpdate
} from "@mindcheck/shared";
import { storage } from "./storage";

const API_URL = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? "http://localhost:4000/api" : "/api");

const request = async <T,>(path: string, init?: RequestInit): Promise<T> => {
  const token = storage.getToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({ message: "Something went wrong." }));
    throw new Error(data.message ?? "Something went wrong.");
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
};

export const api = {
  signup: (payload: { name: string; email: string; password: string }) => request<AuthResponse>("/auth/signup", { method: "POST", body: JSON.stringify(payload) }),
  login: (payload: { email: string; password: string }) => request<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  me: () => request<{ user: User }>("/auth/me"),
  saveProfile: (payload: UserProfileUpdate) => request<{ user: User }>("/auth/profile", { method: "PATCH", body: JSON.stringify(payload) }),
  saveSettings: (payload: UserSettingsUpdate) => request<{ user: User }>("/auth/settings", { method: "PATCH", body: JSON.stringify(payload) }),
  saveCheckIn: (payload: CheckInInput) => request<{
    checkIn: CheckInRecord;
    prompt: string;
    suggestions: ReliefSuggestion[];
    context: CheckInResultContext;
  }>("/checkins", { method: "POST", body: JSON.stringify(payload) }),
  getTodayCheckIn: (date: string) => request<{
    checkIns: CheckInRecord[];
    suggestions: ReliefSuggestion[];
    context: CheckInResultContext | null;
  }>(`/checkins/today?date=${date}`),
  getCheckInHistory: () => request<{ checkIns: CheckInRecord[] }>("/checkins/history"),
  getDashboardSummary: () => request<{ summary: DashboardSummary }>("/dashboard/summary"),
  getTodayJournal: (date: string, entryType: JournalEntry["entryType"] = "daily") => request<{ journal: JournalEntry | null }>(`/journal/today?date=${date}&entryType=${entryType}`),
  saveJournal: (payload: { date: string; prompt: string; content: string; entryType: JournalEntry["entryType"] }) => request<{ journal: JournalEntry }>("/journal", { method: "POST", body: JSON.stringify(payload) }),
  getJournalHistory: () => request<{ journals: JournalEntry[] }>("/journal/history"),
  getWeeklyReflections: () => request<{ reflections: JournalEntry[] }>("/journal/reflections"),
  savePulse: (payload: PulseInput) => request<{ pulse: PulseRecord }>("/pulse", { method: "POST", body: JSON.stringify(payload) }),
  getTodayPulse: (date: string) => request<{ pulses: PulseRecord[] }>(`/pulse/today?date=${date}`),
  getEvents: () => request<{ events: UpcomingEvent[] }>("/events"),
  saveEvent: (payload: Pick<UpcomingEvent, "title" | "date" | "type">) => request<{ event: UpcomingEvent }>("/events", { method: "POST", body: JSON.stringify(payload) }),
  deleteEvent: (id: string) => request<void>(`/events/${id}`, { method: "DELETE" }),
  syncLocalData: (payload: LocalSyncPayload) => request<void>("/sync/local-data", { method: "POST", body: JSON.stringify(payload) })
};

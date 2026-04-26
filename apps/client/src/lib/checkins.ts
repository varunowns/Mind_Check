import type { CheckInInput } from "@mindcheck/shared";
import { toLocalTimestamp, todayKey } from "./date";

export const createDefaultCheckIn = (value = new Date()): CheckInInput => ({
  date: todayKey(value),
  session: "full",
  sleepHours: 8,
  sleepQuality: 7,
  meals: "balanced",
  activity: "moderate",
  social: "normal",
  workload: "moderate",
  stressor: "",
  mood: "okay",
  energy: 6,
  meetingCount: null,
  submittedAtLocal: toLocalTimestamp(value)
});

export const hydrateCheckInDraft = (draft: Partial<CheckInInput>, value = new Date()): CheckInInput => {
  const defaults = createDefaultCheckIn(value);

  return {
    ...defaults,
    ...draft,
    date: todayKey(value),
    session: draft.session ?? defaults.session,
    meetingCount: draft.meetingCount ?? defaults.meetingCount,
    submittedAtLocal: draft.submittedAtLocal ?? defaults.submittedAtLocal
  };
};

export const finalizeCheckIn = (form: CheckInInput, value = new Date()): CheckInInput => ({
  ...form,
  date: todayKey(value),
  session: form.session,
  meetingCount: form.meetingCount ?? null,
  submittedAtLocal: toLocalTimestamp(value)
});

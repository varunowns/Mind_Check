import type { CheckInRecord } from "@pebble/shared";
import { getStressBand } from "@pebble/shared";

export type ScoreTone = "low" | "mid" | "high";

export const moodPickerOptions = [
  { value: "sad", emoji: "😞", label: "Drained", detail: "Tender and low" },
  { value: "uneasy", emoji: "😟", label: "Uneasy", detail: "A bit on edge" },
  { value: "neutral", emoji: "😐", label: "Neutral", detail: "Holding steady" },
  { value: "okay", emoji: "🙂", label: "Okay", detail: "Managing well" },
  { value: "happy", emoji: "🌤", label: "Bright", detail: "More ease today" }
] as const;

export const stressorOptions = [
  "Deadlines",
  "Meetings",
  "Sleep debt",
  "Finances",
  "Family",
  "Health",
  "Commute",
  "Burnout",
  "Social energy",
  "Uncertainty"
] as const;

export const journalPromptOptions = [
  "What felt heavier than expected today?",
  "What protected even a small pocket of calm?",
  "What do you want tomorrow to hold a little more of?"
] as const;

export const tipOfDayOptions = [
  {
    title: "Protect one quiet pocket",
    copy: "Schedule even ten minutes with no tabs, notifications, or decisions. Small pauses count."
  },
  {
    title: "Name the loudest thought",
    copy: "Writing one sentence about the main pressure point can make it feel less foggy."
  },
  {
    title: "Reset with temperature",
    copy: "A cool glass of water, fresh air, or a quick face rinse can help your body downshift."
  },
  {
    title: "Shrink the next step",
    copy: "Ask what the kindest five-minute version of progress looks like, then do only that."
  }
] as const;

export const quickReliefOptions = [
  {
    title: "Box Breathing",
    copy: "Four counts in, hold, out, and hold again to soften urgency."
  },
  {
    title: "Drop your shoulders",
    copy: "Unclench your jaw, lower your shoulders, and let your exhale run long."
  },
  {
    title: "One-line journal",
    copy: "Finish this sentence: Right now I need a little more..."
  }
] as const;

export const notificationPreferenceKey = "mindcheck-notifications-enabled";

export const getScoreTone = (score: number | null | undefined): ScoreTone => {
  if (score == null) return "mid";

  const band = getStressBand(score);
  if (band === "low") return "low";
  if (band === "moderate") return "mid";
  return "high";
};

export const getScoreToneVar = (tone: ScoreTone) => `var(--score-${tone})`;

export const getScoreToneLabel = (tone: ScoreTone) => {
  if (tone === "low") return "Steadier day";
  if (tone === "mid") return "Mixed load";
  return "Needs gentleness";
};

export const getScoreDescriptor = (score: number) => {
  const tone = getScoreTone(score);
  if (tone === "low") return "Your signals look relatively grounded today.";
  if (tone === "mid") return "There is some strain showing up, but also room to recover.";
  return "Your system looks stretched. Keep the next step small and supportive.";
};

export const getEmpathyMessage = (score: number) => {
  const tone = getScoreTone(score);
  if (tone === "low") return "You are carrying yourself with a little more steadiness today.";
  if (tone === "mid") return "A few things are pulling on you today, and that is worth noticing gently.";
  return "Today looks heavy. Let this be information, not a judgment.";
};

export const getGreeting = (value = new Date()) => {
  const hour = value.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

export const getInitials = (name: string | null | undefined) => {
  const value = name?.trim();
  if (!value) return "MC";
  return value
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

export const getTipOfTheDay = (value = new Date()) => tipOfDayOptions[value.getDate() % tipOfDayOptions.length];

export const buildStoredStressor = (chips: string[], reflection: string) => {
  const lines: string[] = [];

  if (chips.length) {
    lines.push(`Stressors: ${chips.join(", ")}`);
  }

  if (reflection.trim()) {
    lines.push(`Reflection: ${reflection.trim()}`);
  }

  return lines.join("\n");
};

export const splitStoredStressor = (value: string) => {
  const lines = value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const stressorLine = lines.find((line) => line.startsWith("Stressors:"));
  const reflectionLine = lines.find((line) => line.startsWith("Reflection:"));

  const chips = stressorLine
    ? stressorLine
      .replace("Stressors:", "")
      .split(",")
      .map((chip) => chip.trim())
      .filter(Boolean)
    : [];

  if (stressorLine || reflectionLine) {
    return {
      chips,
      reflection: reflectionLine ? reflectionLine.replace("Reflection:", "").trim() : ""
    };
  }

  return {
    chips: [],
    reflection: value
  };
};

export const getJournalToneMap = (records: CheckInRecord[]) => {
  const entries = [...records].sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  return new Map(entries.map((record) => [record.date, getScoreTone(record.stressScore)]));
};

export const getLatestRecord = (records: CheckInRecord[]) => {
  if (!records.length) return null;
  return [...records].sort((left, right) => left.createdAt.localeCompare(right.createdAt)).at(-1) ?? null;
};

export const getHeatmapTone = (score: number, completed: boolean): ScoreTone => {
  if (!completed) return "mid";
  return getScoreTone(score);
};

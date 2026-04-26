import { describe, expect, it } from "vitest";
import { generateJournalPrompt, generateReliefSuggestions } from "./suggestions";
import type { CheckInInput } from "../types";

const input: CheckInInput = {
  date: "2026-03-28",
  session: "full",
  sleepHours: 5,
  sleepQuality: 4,
  meals: "skipped",
  activity: "none",
  social: "isolated",
  workload: "heavy",
  stressor: "upcoming exams",
  mood: "uneasy",
  energy: 3,
  meetingCount: "6+",
  submittedAtLocal: "2026-03-28T22:15:00+05:30"
};

describe("suggestions", () => {
  it("creates a personalized journal prompt", () => {
    expect(generateJournalPrompt(input)).toContain("upcoming exams");
  });

  it("returns at least three contextual suggestions", () => {
    const suggestions = generateReliefSuggestions(input);
    expect(suggestions.length).toBeGreaterThanOrEqual(3);
    expect(suggestions.some((item) => item.category === "breathing")).toBe(true);
  });

  it("prioritizes exam-mode suggestions", () => {
    const suggestions = generateReliefSuggestions(input, {
      activeEvent: {
        id: "event-1",
        userId: "user-1",
        title: "Organic chemistry final",
        date: "2026-03-31",
        type: "exam",
        createdAt: "2026-03-20T10:00:00Z"
      }
    });

    expect(suggestions.some((item) => item.id === "pomodoro-reset")).toBe(true);
    expect(suggestions.some((item) => item.id === "pre-exam-calm")).toBe(true);
  });

  it("replaces the normal mix when burnout warning is active", () => {
    const suggestions = generateReliefSuggestions(input, { burnoutWarning: true });
    expect(suggestions.map((item) => item.id)).toContain("burnout-pause");
    expect(suggestions.map((item) => item.id)).toContain("professional-support");
  });
});

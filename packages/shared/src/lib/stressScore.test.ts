import { describe, expect, it } from "vitest";
import { calculateStressScore, getStressBand } from "./stressScore";
import type { CheckInInput } from "../types";

const baseInput: CheckInInput = {
  date: "2026-03-28",
  session: "full",
  sleepHours: 8,
  sleepQuality: 8,
  meals: "balanced",
  activity: "moderate",
  social: "social",
  workload: "light",
  stressor: "",
  mood: "happy",
  energy: 8,
  meetingCount: null,
  submittedAtLocal: "2026-03-28T08:00:00+05:30"
};

describe("stress score engine", () => {
  it("keeps a healthy day in the low band", () => {
    expect(calculateStressScore(baseInput).score).toBeLessThanOrEqual(30);
  });

  it("pushes an intense day into the critical band", () => {
    const result = calculateStressScore({
      ...baseInput,
      sleepHours: 4,
      sleepQuality: 2,
      meals: "skipped",
      activity: "none",
      social: "isolated",
      workload: "overwhelming",
      mood: "sad"
    });

    expect(result.score).toBeGreaterThan(80);
    expect(result.band).toBe("critical");
  });

  it("maps boundaries correctly", () => {
    expect(getStressBand(30)).toBe("low");
    expect(getStressBand(31)).toBe("moderate");
    expect(getStressBand(61)).toBe("high");
    expect(getStressBand(81)).toBe("critical");
  });
});

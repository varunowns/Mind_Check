import { describe, expect, it } from "vitest";
import { calculateBoundaryScore, calculateBurnoutStatus, calculateInsights, calculateSleepDebt } from "./analytics";
import type { CheckInRecord } from "../types";

const makeCheckIn = (overrides: Partial<CheckInRecord>): CheckInRecord => ({
  id: overrides.id ?? `${overrides.date}-${overrides.session ?? "full"}`,
  userId: overrides.userId ?? "user-1",
  date: overrides.date ?? "2026-03-28",
  session: overrides.session ?? "full",
  sleepHours: overrides.sleepHours ?? 8,
  sleepQuality: overrides.sleepQuality ?? 8,
  meals: overrides.meals ?? "balanced",
  activity: overrides.activity ?? "moderate",
  social: overrides.social ?? "normal",
  workload: overrides.workload ?? "moderate",
  stressor: overrides.stressor ?? "",
  mood: overrides.mood ?? "okay",
  energy: overrides.energy ?? 6,
  meetingCount: overrides.meetingCount ?? null,
  submittedAtLocal: overrides.submittedAtLocal ?? "2026-03-28T20:00:00+05:30",
  stressScore: overrides.stressScore ?? 50,
  createdAt: overrides.createdAt ?? "2026-03-28T14:30:00.000Z",
  updatedAt: overrides.updatedAt ?? "2026-03-28T14:30:00.000Z"
});

describe("analytics", () => {
  it("calculates rolling sleep debt", () => {
    const checkIns = [
      makeCheckIn({ date: "2026-03-22", sleepHours: 6 }),
      makeCheckIn({ date: "2026-03-23", sleepHours: 7 }),
      makeCheckIn({ date: "2026-03-24", sleepHours: 5.5 }),
      makeCheckIn({ date: "2026-03-25", sleepHours: 8 }),
      makeCheckIn({ date: "2026-03-26", sleepHours: 6 }),
      makeCheckIn({ date: "2026-03-27", sleepHours: 7 }),
      makeCheckIn({ date: "2026-03-28", sleepHours: 6.5 })
    ];

    const result = calculateSleepDebt(checkIns, 8, "2026-03-28");
    expect(result.currentDebtHours).toBe(10);
    expect(result.severity).toBe("critical");
  });

  it("detects late-night boundary risk", () => {
    const checkIns = [
      makeCheckIn({ date: "2026-03-20", submittedAtLocal: "2026-03-20T22:10:00+05:30" }),
      makeCheckIn({ date: "2026-03-21", submittedAtLocal: "2026-03-21T21:30:00+05:30" }),
      makeCheckIn({ date: "2026-03-22", submittedAtLocal: "2026-03-22T20:15:00+05:30" }),
      makeCheckIn({ date: "2026-03-23", submittedAtLocal: "2026-03-23T22:45:00+05:30" })
    ];

    const result = calculateBoundaryScore(checkIns, "21:00", "2026-03-23");
    expect(result.score).toBe(75);
    expect(result.label).toBe("Concerning");
  });

  it("triggers burnout after five elevated days", () => {
    const checkIns = [
      makeCheckIn({ date: "2026-03-24", stressScore: 70 }),
      makeCheckIn({ date: "2026-03-25", stressScore: 72 }),
      makeCheckIn({ date: "2026-03-26", stressScore: 68 }),
      makeCheckIn({ date: "2026-03-27", stressScore: 75 }),
      makeCheckIn({ date: "2026-03-28", stressScore: 73 })
    ];

    const result = calculateBurnoutStatus(checkIns, false);
    expect(result.active).toBe(true);
    expect(result.shouldTrigger).toBe(true);
  });

  it("finds positive correlations after enough history", () => {
    const checkIns = Array.from({ length: 30 }, (_value, index) => makeCheckIn({
      date: `2026-02-${String(index + 1).padStart(2, "0")}`,
      sleepHours: index % 2 === 0 ? 8.5 : 5.5,
      activity: index % 2 === 0 ? "moderate" : "none",
      social: index % 2 === 0 ? "social" : "isolated",
      meals: index % 2 === 0 ? "balanced" : "skipped",
      meetingCount: index % 2 === 0 ? "1-2" : "6+",
      stressScore: index % 2 === 0 ? 32 : 71
    }));

    const insights = calculateInsights(checkIns);
    expect(insights.unlocked).toBe(true);
    expect(insights.topInsights.length).toBeGreaterThan(0);
    expect(insights.topInsights[0].improvementPercent).toBeGreaterThan(0);
  });
});

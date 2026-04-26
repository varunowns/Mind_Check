import { describe, expect, it } from "vitest";
import { buildBreathingInsights, formatDuration, getBreathingPhase, type BreathingSession } from "./breathing";

describe("breathing helpers", () => {
  it("derives the correct breathing phase from elapsed seconds", () => {
    expect(getBreathingPhase(0, "box")).toBe("inhale");
    expect(getBreathingPhase(4, "box")).toBe("hold");
    expect(getBreathingPhase(8, "box")).toBe("exhale");
  });

  it("formats duration for the timer display", () => {
    expect(formatDuration(5)).toBe("0:05");
    expect(formatDuration(125)).toBe("2:05");
  });

  it("summarizes completed sessions for the graph and leaderboard", () => {
    const sessions: BreathingSession[] = [
      { technique: "box", duration: 120, completedAt: "2026-03-25T09:00:00.000Z", dateKey: "2026-03-25" },
      { technique: "box", duration: 120, completedAt: "2026-03-27T09:00:00.000Z", dateKey: "2026-03-27" },
      { technique: "4-7-8", duration: 300, completedAt: "2026-03-28T08:30:00.000Z", dateKey: "2026-03-28" },
      { technique: "deep", duration: 420, completedAt: "2026-03-28T11:00:00.000Z", dateKey: "2026-03-28" }
    ];

    const insights = buildBreathingInsights(sessions, new Date(2026, 2, 28, 12, 0, 0));

    expect(insights.todayCount).toBe(2);
    expect(insights.weekCount).toBe(4);
    expect(insights.totalMinutes).toBe(16);
    expect(insights.favoriteTechnique?.label).toBe("Box Breathing");
    expect(insights.dailyTrend.find((point) => point.date === "2026-03-28")?.sessions).toBe(2);
    expect(insights.breakdown[0]).toMatchObject({ key: "box", count: 2, weekCount: 2 });
  });
});

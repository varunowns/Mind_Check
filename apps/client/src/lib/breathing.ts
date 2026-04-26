import { techniques } from "./content";
import { addDays, dateKeyFromDate } from "./date";

export type TechniqueKey = keyof typeof techniques;
export type BreathingPhase = "inhale" | "hold" | "exhale";

export type BreathingSession = {
  technique: TechniqueKey;
  duration: number;
  completedAt: string;
  dateKey: string;
};

export type BreathingInsight = {
  todayCount: number;
  weekCount: number;
  totalSessions: number;
  totalMinutes: number;
  favoriteTechnique: { key: TechniqueKey; label: string; count: number } | null;
  dailyTrend: Array<{ date: string; label: string; sessions: number }>;
  breakdown: Array<{ key: TechniqueKey; label: string; count: number; weekCount: number; share: number }>;
};

export const getBreathingPhase = (elapsed: number, technique: TechniqueKey): BreathingPhase => {
  const config = techniques[technique];
  const cycle = config.inhale + config.hold + config.exhale;
  const position = elapsed % cycle;

  if (position < config.inhale) return "inhale";
  if (position < config.inhale + config.hold) return "hold";
  return "exhale";
};

export const formatDuration = (seconds: number) => `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, "0")}`;

export const buildBreathingInsights = (sessions: BreathingSession[], now = new Date()): BreathingInsight => {
  const today = dateKeyFromDate(now);
  const dailyTrend = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(now, index - 6);
    return {
      date: dateKeyFromDate(date),
      label: date.toLocaleDateString(undefined, { weekday: "short" }),
      sessions: 0
    };
  });

  const trendIndex = new Map(dailyTrend.map((point, index) => [point.date, index]));
  const weekKeys = new Set(dailyTrend.map((point) => point.date));
  const countsByTechnique = new Map<TechniqueKey, { count: number; weekCount: number }>();

  for (const session of sessions) {
    const currentTechnique = countsByTechnique.get(session.technique) ?? { count: 0, weekCount: 0 };
    currentTechnique.count += 1;
    if (weekKeys.has(session.dateKey)) currentTechnique.weekCount += 1;
    countsByTechnique.set(session.technique, currentTechnique);

    const pointIndex = trendIndex.get(session.dateKey);
    if (pointIndex !== undefined) dailyTrend[pointIndex].sessions += 1;
  }

  const breakdown = (Object.keys(techniques) as TechniqueKey[])
    .map((key) => {
      const counts = countsByTechnique.get(key) ?? { count: 0, weekCount: 0 };
      return {
        key,
        label: techniques[key].label,
        count: counts.count,
        weekCount: counts.weekCount,
        share: sessions.length ? counts.count / sessions.length : 0
      };
    })
    .sort((left, right) => right.count - left.count || right.weekCount - left.weekCount || left.label.localeCompare(right.label));

  const favorite = breakdown.find((item) => item.count > 0);

  return {
    todayCount: sessions.filter((session) => session.dateKey === today).length,
    weekCount: dailyTrend.reduce((sum, point) => sum + point.sessions, 0),
    totalSessions: sessions.length,
    totalMinutes: Math.round(sessions.reduce((sum, session) => sum + session.duration / 60, 0)),
    favoriteTechnique: favorite ? { key: favorite.key, label: favorite.label, count: favorite.count } : null,
    dailyTrend,
    breakdown
  };
};

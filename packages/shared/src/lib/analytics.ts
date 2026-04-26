import {
  type Badge,
  type BoundarySummary,
  type BurnoutStatus,
  type BurnoutWarning,
  type CheckInInput,
  type CheckInRecord,
  type DashboardSummary,
  type HeatmapDay,
  type InsightComparison,
  type InsightsSummary,
  type JournalEntry,
  type MeetingCount,
  type MeetingStressPoint,
  type PreExamStressPattern,
  type PulseRecord,
  type ShieldUsage,
  type SleepDebtSummary,
  type TrendPoint,
  type UpcomingEvent
} from "../types.js";
import { calculateStressScore } from "./stressScore.js";

type CheckInLike = CheckInInput | CheckInRecord;

type DailyAggregate = {
  date: string;
  stressScore: number;
  sleepHours: number;
  activityLevel: number;
  socialLevel: number;
  mealLevel: number;
  meetingLevel: number | null;
  sessionCount: number;
};

const DAY = 86_400_000;
const activityRank = { none: 0, light: 1, moderate: 2, intense: 3 } as const;
const socialRank = { isolated: 0, normal: 1, social: 2 } as const;
const mealRank = { skipped: 0, mixed: 1, balanced: 2 } as const;
const meetingRank: Record<MeetingCount, number> = { "0": 0, "1-2": 1, "3-5": 2, "6+": 3 };
const meetingBuckets: MeetingCount[] = ["0", "1-2", "3-5", "6+"];

const average = (values: number[]) => values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
const preciseAverage = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
const roundToOne = (value: number) => Math.round(value * 10) / 10;
const toDateKey = (value = new Date()) => value.toISOString().slice(0, 10);
const parseDateKey = (value: string) => new Date(`${value}T00:00:00.000Z`);
const addDays = (value: string, amount: number) => toDateKey(new Date(parseDateKey(value).getTime() + (amount * DAY)));
const formatRangeLabel = (start: string, end: string) => `${start.slice(5)}-${end.slice(5)}`;
const sortDateAsc = (left: string, right: string) => left.localeCompare(right);
const sortDateDesc = (left: string, right: string) => right.localeCompare(left);
const getStressScore = (checkIn: CheckInLike) => "stressScore" in checkIn ? checkIn.stressScore : calculateStressScore(checkIn).score;

const getSubmittedTime = (checkIn: CheckInRecord) => {
  const value = checkIn.submittedAtLocal || checkIn.createdAt;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { hours: 0, minutes: 0 };
  return { hours: date.getHours(), minutes: date.getMinutes() };
};

const timeToMinutes = (value: string) => {
  const [hours, minutes] = value.split(":").map(Number);
  return (hours * 60) + minutes;
};

const percentileMedian = (values: number[]) => {
  const sorted = [...values].sort((left, right) => left - right);
  if (!sorted.length) return 0;
  const midpoint = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[midpoint - 1] + sorted[midpoint]) / 2 : sorted[midpoint];
};

export const aggregateDailyCheckIns = (checkIns: CheckInLike[]) => {
  const grouped = new Map<string, DailyAggregate>();

  checkIns.forEach((checkIn) => {
    const current = grouped.get(checkIn.date);
    const stressScore = getStressScore(checkIn);
    const meetingLevel = checkIn.meetingCount ? meetingRank[checkIn.meetingCount] : null;

    if (!current) {
      grouped.set(checkIn.date, {
        date: checkIn.date,
        stressScore,
        sleepHours: checkIn.sleepHours,
        activityLevel: activityRank[checkIn.activity],
        socialLevel: socialRank[checkIn.social],
        mealLevel: mealRank[checkIn.meals],
        meetingLevel,
        sessionCount: 1
      });
      return;
    }

    const sessionCount = current.sessionCount + 1;
    current.stressScore = Math.round(((current.stressScore * current.sessionCount) + stressScore) / sessionCount);
    current.sleepHours = roundToOne(((current.sleepHours * current.sessionCount) + checkIn.sleepHours) / sessionCount);
    current.activityLevel = ((current.activityLevel * current.sessionCount) + activityRank[checkIn.activity]) / sessionCount;
    current.socialLevel = ((current.socialLevel * current.sessionCount) + socialRank[checkIn.social]) / sessionCount;
    current.mealLevel = ((current.mealLevel * current.sessionCount) + mealRank[checkIn.meals]) / sessionCount;
    current.meetingLevel = meetingLevel === null
      ? current.meetingLevel
      : current.meetingLevel === null
        ? meetingLevel
        : Math.max(current.meetingLevel, meetingLevel);
    current.sessionCount = sessionCount;
  });

  return Array.from(grouped.values()).sort((left, right) => sortDateAsc(left.date, right.date));
};

const getCoveredDates = (checkIns: CheckInLike[], shieldHistory: ShieldUsage[]) => {
  const covered = new Set(checkIns.map((item) => item.date));
  shieldHistory.forEach((item) => covered.add(item.usedOn));
  return covered;
};

export const calculateCurrentStreak = (checkIns: CheckInLike[], shieldHistory: ShieldUsage[], today = toDateKey()) => {
  const covered = getCoveredDates(checkIns, shieldHistory);
  let cursor = covered.has(today) ? today : addDays(today, -1);
  let streak = 0;

  while (covered.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
};

export const calculateSleepDebt = (checkIns: CheckInLike[], recommendedSleepHours: number, today = toDateKey()): SleepDebtSummary => {
  const daily = aggregateDailyCheckIns(checkIns);
  const dailyMap = new Map(daily.map((item) => [item.date, item]));

  let currentDebt = 0;
  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = addDays(today, -offset);
    const item = dailyMap.get(date);
    if (!item) continue;
    currentDebt += Math.max(recommendedSleepHours - item.sleepHours, 0);
  }

  const trend = Array.from({ length: 4 }, (_value, index) => {
    const end = addDays(today, -(7 * (3 - index)));
    const start = addDays(end, -6);
    let debt = 0;

    for (let cursor = start; cursor <= end; cursor = addDays(cursor, 1)) {
      const item = dailyMap.get(cursor);
      if (!item) continue;
      debt += Math.max(recommendedSleepHours - item.sleepHours, 0);
    }

    return {
      label: formatRangeLabel(start, end),
      debtHours: roundToOne(debt)
    };
  });

  return {
    currentDebtHours: roundToOne(Math.max(currentDebt, 0)),
    severity: currentDebt > 5 ? "critical" : currentDebt > 2 ? "warning" : "safe",
    trend
  };
};

export const calculateBoundaryScore = (checkIns: CheckInRecord[], lateThreshold: string, today = toDateKey()): BoundarySummary => {
  const start = addDays(today, -13);
  const thresholdMinutes = timeToMinutes(lateThreshold);
  const recent = checkIns.filter((item) => item.date >= start && item.date <= today);
  const lateCheckIns = recent.filter((item) => {
    const time = getSubmittedTime(item);
    return ((time.hours * 60) + time.minutes) >= thresholdMinutes;
  }).length;
  const score = recent.length ? Math.round((lateCheckIns / recent.length) * 100) : 0;

  return {
    score,
    label: score > 50 ? "Concerning" : score > 25 ? "At Risk" : "Healthy",
    lateCheckIns,
    totalCheckIns: recent.length,
    threshold: lateThreshold
  };
};

export const calculateMeetingsVsStress = (checkIns: CheckInRecord[]): MeetingStressPoint[] => {
  return meetingBuckets.map((bucket) => {
    const matches = checkIns.filter((item) => item.meetingCount === bucket);
    return {
      bucket,
      averageStress: matches.length ? average(matches.map((item) => item.stressScore)) : 0,
      count: matches.length
    };
  });
};

export const getActiveEvent = (events: UpcomingEvent[], today = toDateKey()) => {
  return [...events]
    .filter((event) => event.date >= today && event.date <= addDays(today, 7))
    .sort((left, right) => sortDateAsc(left.date, right.date))[0] ?? null;
};

export const calculatePreExamStressPatterns = (checkIns: CheckInLike[], events: UpcomingEvent[], today = toDateKey()): PreExamStressPattern[] => {
  const daily = aggregateDailyCheckIns(checkIns);

  return [...events]
    .filter((event) => event.date < today)
    .sort((left, right) => sortDateDesc(left.date, right.date))
    .flatMap((event) => {
      const start = addDays(event.date, -7);
      const end = addDays(event.date, -1);
      const trend = daily
        .filter((item) => item.date >= start && item.date <= end)
        .map((item) => ({ date: item.date, stressScore: item.stressScore }));

      if (!trend.length) return [];

      return [{
        eventId: event.id,
        title: event.title,
        type: event.type,
        date: event.date,
        averageStress: average(trend.map((item) => item.stressScore)),
        peakStress: Math.max(...trend.map((item) => item.stressScore)),
        trend
      }];
    });
};

export const calculateBurnoutStatus = (checkIns: CheckInLike[], burnoutActive = false): BurnoutStatus & { shouldTrigger: boolean; shouldClear: boolean } => {
  const daily = aggregateDailyCheckIns(checkIns);
  if (!daily.length) {
    return { active: false, avgScore: 0, daysCount: 0, shouldTrigger: false, shouldClear: false };
  }

  let highStreak: DailyAggregate[] = [];
  let lowStreak: DailyAggregate[] = [];

  for (let index = daily.length - 1; index >= 0; index -= 1) {
    const current = daily[index];
    const previous = daily[index - 1];
    const isConsecutive = !previous || addDays(previous.date, 1) === current.date;

    if (!isConsecutive && highStreak.length) break;
    if (current.stressScore > 60) {
      highStreak = [current, ...highStreak];
    } else if (highStreak.length) {
      break;
    }
  }

  for (let index = daily.length - 1; index >= 0; index -= 1) {
    const current = daily[index];
    const previous = daily[index - 1];
    const isConsecutive = !previous || addDays(previous.date, 1) === current.date;

    if (!isConsecutive && lowStreak.length) break;
    if (current.stressScore < 45) {
      lowStreak = [current, ...lowStreak];
    } else if (lowStreak.length) {
      break;
    }
  }

  const shouldTrigger = highStreak.length >= 5;
  const shouldClear = lowStreak.length >= 3;
  const active = burnoutActive ? !shouldClear : shouldTrigger;

  return {
    active,
    avgScore: shouldTrigger ? average(highStreak.map((item) => item.stressScore)) : 0,
    daysCount: highStreak.length,
    shouldTrigger,
    shouldClear
  };
};

const getBadges = (checkIns: CheckInRecord[], streakCount: number): Badge[] => {
  const daily = aggregateDailyCheckIns(checkIns);
  const earlyBirdDays = new Set(
    checkIns
      .filter((item) => {
        const time = getSubmittedTime(item);
        return time.hours < 9;
      })
      .map((item) => item.date)
  ).size;

  let lowStressStreak = 0;
  let stressBuster = false;

  daily.forEach((item) => {
    if (item.stressScore < 40) {
      lowStressStreak += 1;
      if (lowStressStreak >= 3) stressBuster = true;
      return;
    }
    lowStressStreak = 0;
  });

  return [
    {
      id: "seven-day-streak",
      title: "7-day streak",
      description: "Checked in for seven days in a row.",
      earned: streakCount >= 7
    },
    {
      id: "stress-buster",
      title: "Stress Buster",
      description: "Stayed below a stress score of 40 for three days in a row.",
      earned: stressBuster
    },
    {
      id: "early-bird",
      title: "Early Bird",
      description: "Checked in before 9:00 AM on three different days.",
      earned: earlyBirdDays >= 3
    }
  ];
};

const buildHeatmap = (checkIns: CheckInLike[], today = toDateKey()): HeatmapDay[] => {
  const daily = aggregateDailyCheckIns(checkIns);
  const dailyMap = new Map(daily.map((item) => [item.date, item]));

  return Array.from({ length: 30 }, (_value, index) => {
    const date = addDays(today, -(29 - index));
    const day = dailyMap.get(date);
    return {
      date,
      score: day?.stressScore ?? 0,
      completed: Boolean(day)
    };
  });
};

const buildTrend = (checkIns: CheckInLike[], pulses: PulseRecord[], today = toDateKey()): TrendPoint[] => {
  const daily = aggregateDailyCheckIns(checkIns);
  const dailyMap = new Map(daily.map((item) => [item.date, item]));
  const pulseMap = new Map<string, { mood: number | null; focus: number | null }>();

  pulses.forEach((pulse) => {
    const current = pulseMap.get(pulse.date);
    if (!current) {
      pulseMap.set(pulse.date, { mood: pulse.mood, focus: pulse.focus });
      return;
    }

    pulseMap.set(pulse.date, {
      mood: Math.round(((current.mood ?? 0) + pulse.mood) / 2),
      focus: Math.round(((current.focus ?? 0) + pulse.focus) / 2)
    });
  });

  return Array.from({ length: 7 }, (_value, index) => {
    const date = addDays(today, -(6 - index));
    const day = dailyMap.get(date);
    const pulse = pulseMap.get(date);
    return {
      date,
      stressScore: day?.stressScore ?? null,
      pulseMood: pulse?.mood ?? null,
      pulseFocus: pulse?.focus ?? null
    };
  });
};

const buildWeeklyAverages = (checkIns: CheckInLike[], today = toDateKey()) => {
  const daily = aggregateDailyCheckIns(checkIns);
  const thisWeekStart = addDays(today, -6);
  const lastWeekStart = addDays(today, -13);
  const lastWeekEnd = addDays(today, -7);

  return {
    averageThisWeek: average(daily.filter((item) => item.date >= thisWeekStart && item.date <= today).map((item) => item.stressScore)),
    averageLastWeek: average(daily.filter((item) => item.date >= lastWeekStart && item.date <= lastWeekEnd).map((item) => item.stressScore))
  };
};

const numericMeeting = (value: number | null) => value ?? 0;

const buildInsight = (
  key: InsightComparison["key"],
  label: string,
  messageLabel: string,
  values: Array<{ metric: number | null; stressScore: number }>
): InsightComparison | null => {
  const filtered = values.filter((item) => item.metric !== null) as Array<{ metric: number; stressScore: number }>;
  if (filtered.length < 6) return null;

  const median = percentileMedian(filtered.map((item) => item.metric));
  const high = filtered.filter((item) => item.metric >= median);
  const low = filtered.filter((item) => item.metric < median);

  if (!high.length || !low.length) return null;

  const highAverage = average(high.map((item) => item.stressScore));
  const lowAverage = average(low.map((item) => item.stressScore));
  const improvementPercent = lowAverage > 0 ? Math.round(((lowAverage - highAverage) / lowAverage) * 100) : 0;

  return {
    key,
    label,
    highAverage,
    lowAverage,
    improvementPercent,
    sampleSize: filtered.length,
    message: `On days with higher ${messageLabel}, your stress was ${Math.abs(improvementPercent)}% ${improvementPercent >= 0 ? "lower" : "higher"} on average.`
  };
};

export const calculateInsights = (checkIns: CheckInLike[]): InsightsSummary => {
  const daily = aggregateDailyCheckIns(checkIns);
  const threshold = 30;

  const comparisons = [
    buildInsight("sleepHours", "Sleep hours", "sleep", daily.map((item) => ({ metric: item.sleepHours, stressScore: item.stressScore }))),
    buildInsight("activity", "Physical activity", "movement", daily.map((item) => ({ metric: item.activityLevel, stressScore: item.stressScore }))),
    buildInsight("social", "Social interaction", "social connection", daily.map((item) => ({ metric: item.socialLevel, stressScore: item.stressScore }))),
    buildInsight("meals", "Meals", "meal consistency", daily.map((item) => ({ metric: item.mealLevel, stressScore: item.stressScore }))),
    buildInsight("meetingCount", "Meeting load", "meeting load", daily.map((item) => ({ metric: numericMeeting(item.meetingLevel), stressScore: item.stressScore })))
  ].filter((item): item is InsightComparison => Boolean(item)).sort((left, right) => right.improvementPercent - left.improvementPercent);

  return {
    unlocked: daily.length >= threshold,
    progress: Math.min(daily.length, threshold),
    threshold,
    topInsights: comparisons.filter((item) => item.improvementPercent > 0).slice(0, 2),
    comparisons
  };
};

export const buildDashboardSummary = (input: {
  checkIns: CheckInRecord[];
  pulses: PulseRecord[];
  events: UpcomingEvent[];
  journals: JournalEntry[];
  burnoutWarnings: BurnoutWarning[];
  shieldHistory: ShieldUsage[];
  recommendedSleepHours: number;
  lateThreshold: string;
  shieldAvailable: boolean;
  burnoutActive: boolean;
  today?: string;
}): DashboardSummary => {
  const today = input.today ?? toDateKey();
  const weeklyAverages = buildWeeklyAverages(input.checkIns, today);
  const streakCount = calculateCurrentStreak(input.checkIns, input.shieldHistory, today);
  const burnout = calculateBurnoutStatus(input.checkIns, input.burnoutActive);

  return {
    streakCount,
    averageThisWeek: weeklyAverages.averageThisWeek,
    averageLastWeek: weeklyAverages.averageLastWeek,
    trend: buildTrend(input.checkIns, input.pulses, today),
    heatmap: buildHeatmap(input.checkIns, today),
    badges: getBadges(input.checkIns, streakCount),
    upcomingEvents: [...input.events].filter((item) => item.date >= today).sort((left, right) => sortDateAsc(left.date, right.date)),
    preExamStressPatterns: calculatePreExamStressPatterns(input.checkIns, input.events, today),
    meetingsCorrelation: calculateMeetingsVsStress(input.checkIns),
    sleepDebt: calculateSleepDebt(input.checkIns, input.recommendedSleepHours, today),
    boundary: calculateBoundaryScore(input.checkIns, input.lateThreshold, today),
    burnout: {
      active: burnout.active,
      avgScore: burnout.avgScore,
      daysCount: burnout.daysCount,
      history: [...input.burnoutWarnings].sort((left, right) => sortDateDesc(left.triggeredAt, right.triggeredAt))
    },
    shield: {
      available: input.shieldAvailable,
      history: [...input.shieldHistory].sort((left, right) => sortDateDesc(left.usedOn, right.usedOn))
    },
    weeklyReflectionPending: new Date(`${today}T00:00:00`).getUTCDay() === 0 && !input.journals.some((item) => item.date === today && item.entryType === "weekly_reflection"),
    weeklyReflectionPrompt: "What was the hardest moment this week, and what helped?",
    todayCheckIns: input.checkIns.filter((item) => item.date === today).sort((left, right) => sortDateAsc(left.createdAt, right.createdAt)),
    todayPulse: input.pulses.filter((item) => item.date === today).sort((left, right) => sortDateAsc(left.createdAtLocal || left.createdAt, right.createdAtLocal || right.createdAt)),
    activeEvent: getActiveEvent(input.events, today)
  };
};

export const summarizePulseDay = (pulses: PulseRecord[]) => {
  return {
    moodAverage: roundToOne(preciseAverage(pulses.map((item) => item.mood))),
    focusAverage: roundToOne(preciseAverage(pulses.map((item) => item.focus)))
  };
};

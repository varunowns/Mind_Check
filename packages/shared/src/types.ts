export const moodValues = ["sad", "uneasy", "neutral", "okay", "happy"] as const;
export const mealValues = ["skipped", "mixed", "balanced"] as const;
export const activityValues = ["none", "light", "moderate", "intense"] as const;
export const socialValues = ["isolated", "normal", "social"] as const;
export const workloadValues = ["light", "moderate", "heavy", "overwhelming"] as const;
export const stressBands = ["low", "moderate", "high", "critical"] as const;
export const suggestionCategories = [
  "breathing",
  "stretch",
  "journal",
  "music",
  "microHabit",
  "talkItOut",
  "sleep",
  "focus",
  "anxiety",
  "rest",
  "support",
  "boundary",
  "planning"
] as const;
export const checkInSessionValues = ["full", "morning", "afternoon", "evening"] as const;
export const checkInModeValues = ["once", "thrice"] as const;
export const eventTypeValues = ["exam", "deadline", "presentation"] as const;
export const meetingCountValues = ["0", "1-2", "3-5", "6+"] as const;
export const journalEntryTypeValues = ["daily", "weekly_reflection"] as const;

export type MoodValue = (typeof moodValues)[number];
export type MealValue = (typeof mealValues)[number];
export type ActivityValue = (typeof activityValues)[number];
export type SocialValue = (typeof socialValues)[number];
export type WorkloadValue = (typeof workloadValues)[number];
export type StressBand = (typeof stressBands)[number];
export type SuggestionCategory = (typeof suggestionCategories)[number];
export type CheckInSession = (typeof checkInSessionValues)[number];
export type CheckInMode = (typeof checkInModeValues)[number];
export type EventType = (typeof eventTypeValues)[number];
export type MeetingCount = (typeof meetingCountValues)[number];
export type JournalEntryType = (typeof journalEntryTypeValues)[number];

export type CheckInInput = {
  date: string;
  session: CheckInSession;
  sleepHours: number;
  sleepQuality: number;
  meals: MealValue;
  activity: ActivityValue;
  social: SocialValue;
  workload: WorkloadValue;
  stressor: string;
  mood: MoodValue;
  energy: number;
  meetingCount: MeetingCount | null;
  submittedAtLocal: string;
};

export type CheckInRecord = CheckInInput & {
  id: string;
  userId: string;
  stressScore: number;
  createdAt: string;
  updatedAt: string;
};

export type PulseInput = {
  date: string;
  mood: number;
  focus: number;
  createdAtLocal: string;
};

export type PulseRecord = PulseInput & {
  id: string;
  userId: string;
  createdAt: string;
};

export type UpcomingEvent = {
  id: string;
  userId: string;
  title: string;
  date: string;
  type: EventType;
  createdAt: string;
};

export type BurnoutWarning = {
  id: string;
  userId: string;
  triggeredAt: string;
  avgScore: number;
  daysCount: number;
};

export type ShieldUsage = {
  id: string;
  userId: string;
  usedOn: string;
  createdAt: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  region: string;
  city: string;
  createdAt: string;
  checkinMode: CheckInMode;
  recommendedSleepHours: number;
  lateThreshold: string;
  streakShields: number;
  burnoutActive: boolean;
};

export type UserProfileUpdate = Pick<User, "name" | "email" | "phoneNumber" | "region" | "city">;
export type UserSettingsUpdate = Pick<User, "checkinMode" | "recommendedSleepHours" | "lateThreshold">;

export type AuthResponse = {
  token: string;
  user: User;
};

export type JournalEntry = {
  id: string;
  userId: string;
  date: string;
  prompt: string;
  content: string;
  wordCount: number;
  entryType: JournalEntryType;
  createdAt: string;
  updatedAt: string;
};

export type ReliefSuggestion = {
  id: string;
  category: SuggestionCategory;
  title: string;
  description: string;
  actionLabel: string;
  href?: string;
  durationMinutes?: number;
  steps?: string[];
};

export type SuggestionContext = {
  activeEvent?: UpcomingEvent | null;
  sleepDebtHours?: number;
  burnoutWarning?: boolean;
};

export type CheckInResultContext = {
  activeEvent: UpcomingEvent | null;
  sleepDebtHours: number;
  burnout: {
    active: boolean;
    avgScore: number;
    daysCount: number;
  };
};

export type Badge = {
  id: "seven-day-streak" | "stress-buster" | "early-bird";
  title: string;
  description: string;
  earned: boolean;
};

export type HeatmapDay = {
  date: string;
  score: number;
  completed: boolean;
};

export type TrendPoint = {
  date: string;
  stressScore: number | null;
  pulseMood: number | null;
  pulseFocus: number | null;
};

export type MeetingStressPoint = {
  bucket: MeetingCount;
  averageStress: number;
  count: number;
};

export type SleepDebtWeek = {
  label: string;
  debtHours: number;
};

export type SleepDebtSummary = {
  currentDebtHours: number;
  severity: "safe" | "warning" | "critical";
  trend: SleepDebtWeek[];
};

export type BoundarySummary = {
  score: number;
  label: "Healthy" | "At Risk" | "Concerning";
  lateCheckIns: number;
  totalCheckIns: number;
  threshold: string;
};

export type PreExamStressPattern = {
  eventId: string;
  title: string;
  type: EventType;
  date: string;
  averageStress: number;
  peakStress: number;
  trend: Array<{ date: string; stressScore: number }>;
};

export type BurnoutStatus = {
  active: boolean;
  avgScore: number;
  daysCount: number;
};

export type DashboardSummary = {
  streakCount: number;
  averageThisWeek: number;
  averageLastWeek: number;
  trend: TrendPoint[];
  heatmap: HeatmapDay[];
  badges: Badge[];
  upcomingEvents: UpcomingEvent[];
  preExamStressPatterns: PreExamStressPattern[];
  meetingsCorrelation: MeetingStressPoint[];
  sleepDebt: SleepDebtSummary;
  boundary: BoundarySummary;
  burnout: {
    active: boolean;
    avgScore: number;
    daysCount: number;
    history: BurnoutWarning[];
  };
  shield: {
    available: boolean;
    history: ShieldUsage[];
  };
  weeklyReflectionPending: boolean;
  weeklyReflectionPrompt: string;
  todayCheckIns: CheckInRecord[];
  todayPulse: PulseRecord[];
  activeEvent: UpcomingEvent | null;
};

export type InsightComparison = {
  key: "sleepHours" | "activity" | "social" | "meals" | "meetingCount";
  label: string;
  highAverage: number;
  lowAverage: number;
  improvementPercent: number;
  sampleSize: number;
  message: string;
};

export type InsightsSummary = {
  unlocked: boolean;
  progress: number;
  threshold: number;
  topInsights: InsightComparison[];
  comparisons: InsightComparison[];
};

export type LocalSyncPayload = {
  checkIns: CheckInInput[];
  journals: Array<Pick<JournalEntry, "date" | "prompt" | "content" | "wordCount" | "entryType">>;
  pulses: PulseInput[];
  events: Array<Pick<UpcomingEvent, "title" | "date" | "type">>;
};

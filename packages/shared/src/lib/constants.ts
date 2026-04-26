import type { ActivityValue, MealValue, MoodValue, SocialValue, WorkloadValue } from "../types.js";

export const moodStressMap: Record<MoodValue, number> = {
  sad: 100,
  uneasy: 75,
  neutral: 50,
  okay: 20,
  happy: 0
};

export const mealStressMap: Record<MealValue, number> = {
  skipped: 100,
  mixed: 45,
  balanced: 0
};

export const activityStressMap: Record<ActivityValue, number> = {
  none: 100,
  light: 60,
  moderate: 20,
  intense: 5
};

export const socialStressMap: Record<SocialValue, number> = {
  isolated: 100,
  normal: 35,
  social: 0
};

export const workloadStressMap: Record<WorkloadValue, number> = {
  light: 10,
  moderate: 40,
  heavy: 75,
  overwhelming: 100
};

export const bandConfig = {
  low: { label: "Low stress", color: "#1f8f61", badgeBg: "#d8f5e8", badgeText: "#0d5136" },
  moderate: { label: "Moderate stress", color: "#c88a12", badgeBg: "#fff0c7", badgeText: "#704c00" },
  high: { label: "High stress", color: "#cd6b1d", badgeBg: "#ffe2ca", badgeText: "#763300" },
  critical: { label: "Critical stress", color: "#cf4e53", badgeBg: "#ffd8dc", badgeText: "#6e1520" }
} as const;

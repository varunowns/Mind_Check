import { activityStressMap, bandConfig, mealStressMap, moodStressMap, socialStressMap, workloadStressMap } from "./constants.js";
import type { CheckInInput, StressBand } from "../types.js";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const getSleepStress = (sleepHours: number, sleepQuality: number) => {
  const hoursPenalty = sleepHours <= 4 ? 100 : sleepHours <= 5 ? 80 : sleepHours <= 6 ? 60 : sleepHours <= 7 ? 35 : sleepHours <= 9 ? 10 : 25;
  const qualityPenalty = clamp(100 - sleepQuality * 10, 0, 100);
  return Math.round((hoursPenalty * 0.55) + (qualityPenalty * 0.45));
};

export const getStressBand = (score: number): StressBand => {
  if (score <= 30) return "low";
  if (score <= 60) return "moderate";
  if (score <= 80) return "high";
  return "critical";
};

export const calculateStressScore = (input: CheckInInput) => {
  const sleep = getSleepStress(input.sleepHours, input.sleepQuality);
  const workload = workloadStressMap[input.workload];
  const mood = moodStressMap[input.mood];
  const activity = activityStressMap[input.activity];
  const meals = mealStressMap[input.meals];
  const social = socialStressMap[input.social];

  const score = Math.round(
    (sleep * 0.25) +
    (workload * 0.25) +
    (mood * 0.2) +
    (activity * 0.15) +
    (meals * 0.1) +
    (social * 0.05)
  );

  return {
    score,
    band: getStressBand(score),
    bandMeta: bandConfig[getStressBand(score)],
    breakdown: { sleep, workload, mood, activity, meals, social }
  };
};

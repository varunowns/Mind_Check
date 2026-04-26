import { z } from "zod";
import {
  activityValues,
  checkInModeValues,
  checkInSessionValues,
  eventTypeValues,
  journalEntryTypeValues,
  mealValues,
  meetingCountValues,
  moodValues,
  socialValues,
  workloadValues
} from "../types.js";

export const checkInSchema = z.object({
  date: z.string().min(1),
  session: z.enum(checkInSessionValues),
  sleepHours: z.number().min(0).max(24),
  sleepQuality: z.number().min(1).max(10),
  meals: z.enum(mealValues),
  activity: z.enum(activityValues),
  social: z.enum(socialValues),
  workload: z.enum(workloadValues),
  stressor: z.string().max(500),
  mood: z.enum(moodValues),
  energy: z.number().min(1).max(10),
  meetingCount: z.enum(meetingCountValues).nullable(),
  submittedAtLocal: z.string().min(1)
});

export const pulseSchema = z.object({
  date: z.string().min(1),
  mood: z.number().min(1).max(5),
  focus: z.number().min(1).max(5),
  createdAtLocal: z.string().min(1)
});

export const eventSchema = z.object({
  title: z.string().min(1).max(120),
  date: z.string().min(1),
  type: z.enum(eventTypeValues)
});

export const signupSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(100)
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100)
});

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email(),
  phoneNumber: z.string().trim().max(30),
  region: z.string().trim().max(80),
  city: z.string().trim().max(120)
});

export const userSettingsSchema = z.object({
  checkinMode: z.enum(checkInModeValues),
  recommendedSleepHours: z.number().min(4).max(12),
  lateThreshold: z.string().regex(/^\d{2}:\d{2}$/)
});

export const journalSchema = z.object({
  date: z.string().min(1),
  prompt: z.string().min(1).max(300),
  content: z.string().max(5000),
  entryType: z.enum(journalEntryTypeValues).default("daily")
});

export const syncSchema = z.object({
  checkIns: z.array(checkInSchema),
  journals: z.array(
    z.object({
      date: z.string().min(1),
      prompt: z.string().min(1).max(300),
      content: z.string().max(5000),
      wordCount: z.number().min(0),
      entryType: z.enum(journalEntryTypeValues)
    })
  ),
  pulses: z.array(pulseSchema),
  events: z.array(eventSchema)
});

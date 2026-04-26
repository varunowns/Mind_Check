import {
  buildDashboardSummary,
  calculateBurnoutStatus,
  calculateSleepDebt,
  calculateStressScore,
  generateJournalPrompt,
  generateReliefSuggestions,
  getActiveEvent,
  type CheckInInput,
  type CheckInRecord,
  type CheckInResultContext,
  type JournalEntry,
  type PulseInput,
  type PulseRecord,
  type UpcomingEvent
} from "@mindcheck/shared";
import { storage } from "./storage";

const mapGuestCheckIn = (checkIn: CheckInInput): CheckInRecord => ({
  id: `${checkIn.date}-${checkIn.session}`,
  userId: "guest",
  ...checkIn,
  stressScore: calculateStressScore(checkIn).score,
  createdAt: checkIn.submittedAtLocal,
  updatedAt: checkIn.submittedAtLocal
});

const mapGuestPulse = (pulse: PulseInput, index: number): PulseRecord => ({
  id: `guest-pulse-${index}-${pulse.createdAtLocal}`,
  userId: "guest",
  ...pulse,
  createdAt: pulse.createdAtLocal
});

const mapGuestJournal = (journal: Pick<JournalEntry, "date" | "prompt" | "content" | "wordCount" | "entryType">, index: number): JournalEntry => ({
  id: `guest-journal-${index}-${journal.date}-${journal.entryType}`,
  userId: "guest",
  ...journal,
  createdAt: journal.date,
  updatedAt: journal.date
});

export const getGuestCheckInRecords = () => storage.getGuestCheckIns().map(mapGuestCheckIn);

export const getGuestPulseRecords = () => storage.getGuestPulses().map(mapGuestPulse);

export const getGuestJournalRecords = () => storage.getGuestJournals().map(mapGuestJournal);

export const getGuestDashboardSummary = () => {
  const settings = storage.getGuestSettings();
  return buildDashboardSummary({
    checkIns: getGuestCheckInRecords(),
    pulses: getGuestPulseRecords(),
    events: storage.getGuestEvents(),
    journals: getGuestJournalRecords(),
    burnoutWarnings: [],
    shieldHistory: [],
    recommendedSleepHours: settings.recommendedSleepHours,
    lateThreshold: settings.lateThreshold,
    shieldAvailable: false,
    burnoutActive: false
  });
};

export const buildGuestResultState = (checkIn: CheckInInput) => {
  const settings = storage.getGuestSettings();
  const allCheckIns = [...storage.getGuestCheckIns().filter((item) => !(item.date === checkIn.date && item.session === checkIn.session)), checkIn];
  const records = allCheckIns.map(mapGuestCheckIn);
  const activeEvent = getActiveEvent(storage.getGuestEvents(), checkIn.date);
  const burnout = calculateBurnoutStatus(records, false);
  const sleepDebtHours = calculateSleepDebt(records, settings.recommendedSleepHours, checkIn.date).currentDebtHours;
  const context: CheckInResultContext = {
    activeEvent,
    sleepDebtHours,
    burnout: {
      active: burnout.active,
      avgScore: burnout.avgScore,
      daysCount: burnout.daysCount
    }
  };

  return {
    checkIn: mapGuestCheckIn(checkIn),
    prompt: generateJournalPrompt(checkIn),
    suggestions: generateReliefSuggestions(checkIn, {
      activeEvent,
      sleepDebtHours,
      burnoutWarning: burnout.active
    }),
    context
  };
};

export const createGuestEvent = (event: Pick<UpcomingEvent, "title" | "date" | "type">): UpcomingEvent => ({
  id: `guest-event-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  userId: "guest",
  createdAt: new Date().toISOString(),
  ...event
});

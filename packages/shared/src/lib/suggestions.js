import { reliefLibrary } from "../content/relief";
import { calculateStressScore } from "./stressScore";
const getSuggestionById = (id) => reliefLibrary.find((item) => item.id === id);
export const generateJournalPrompt = (input) => {
    const stressor = input.stressor.trim();
    if (stressor) {
        return `What about "${stressor}" feels most pressing right now, and what would support look like tonight?`;
    }
    if (input.workload === "heavy" || input.workload === "overwhelming") {
        return "What is one task you can shrink, delay, or ask for help with so tonight feels lighter?";
    }
    if (input.mood === "sad" || input.mood === "uneasy") {
        return "What happened today, what feeling is strongest, and what do you need most from yourself right now?";
    }
    return "What took energy today, what gave some back, and what would make tomorrow feel kinder?";
};
const dedupeSuggestions = (ids) => {
    const seen = new Set();
    const picks = [];
    ids.forEach((id) => {
        if (seen.has(id))
            return;
        const suggestion = getSuggestionById(id);
        if (!suggestion)
            return;
        seen.add(id);
        picks.push(suggestion);
    });
    return picks;
};
export const generateReliefSuggestions = (input, context = {}) => {
    const { score, band } = calculateStressScore(input);
    if (context.burnoutWarning) {
        return dedupeSuggestions([
            "burnout-pause",
            "share-the-load",
            "focus-block",
            "professional-support",
            "sleep-protect"
        ]);
    }
    const examMode = Boolean(context.activeEvent);
    const picks = [];
    if (examMode) {
        picks.push("pomodoro-reset", "pre-exam-calm", "sleep-protect", "focus-block");
    }
    if (score >= 60)
        picks.push("box-breathing");
    if (input.activity === "none" || input.activity === "light")
        picks.push("stretch-neck-shoulders");
    if (input.stressor || input.mood === "sad" || input.mood === "uneasy")
        picks.push("journal-reframe");
    if (input.workload === "heavy" || input.workload === "overwhelming")
        picks.push("tiny-next-step");
    if (input.social === "isolated")
        picks.push("talk-it-out");
    if (band === "moderate" || band === "high" || band === "critical")
        picks.push("lofi-focus");
    if ((context.sleepDebtHours ?? 0) > 5)
        picks.push("sleep-protect");
    if (input.meetingCount === "6+" && score > 60)
        picks.push("meeting-focus-time");
    reliefLibrary.forEach((item) => {
        if (picks.length < 5)
            picks.push(item.id);
    });
    return dedupeSuggestions(picks).slice(0, examMode ? 5 : 5);
};

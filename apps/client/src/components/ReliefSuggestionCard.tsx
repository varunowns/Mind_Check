import { motion } from "framer-motion";
import type { ReliefSuggestion } from "@pebble/shared";

const categoryIcons: Record<string, string> = {
  breathing: "🌬️",
  stretch: "🧘",
  journal: "✍️",
  music: "🎵",
  microHabit: "⚡",
  talkItOut: "💬",
  sleep: "😴",
  focus: "🎯",
  anxiety: "🛡️",
  rest: "🌙",
  support: "🤝",
  boundary: "🚪",
  planning: "📋"
};

export const ReliefSuggestionCard = ({
  suggestion,
  onAction,
  index = 0
}: {
  suggestion: ReliefSuggestion;
  onAction: (suggestion: ReliefSuggestion) => void;
  index?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.08, duration: 0.4, ease: "easeOut" }}
    className="relief-card"
    role="article"
  >
    <div className="relief-card__header">
      <div className="relief-card__icon" aria-hidden="true">
        {categoryIcons[suggestion.category] || "💡"}
      </div>
      <div className="relief-card__meta">
        <h3 className="relief-card__title">{suggestion.title}</h3>
        {suggestion.durationMinutes && (
          <span className="relief-card__duration" aria-label={`Duration: ${suggestion.durationMinutes} minutes`}>
            {suggestion.durationMinutes}m
          </span>
        )}
      </div>
    </div>

    <p className="relief-card__description">{suggestion.description}</p>

    {suggestion.steps && suggestion.steps.length > 0 && (
      <ol className="relief-card__steps">
        {suggestion.steps.map((step, i) => (
          <li key={i} className="relief-card__step">
            {step}
          </li>
        ))}
      </ol>
    )}

    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onAction(suggestion)}
      className="relief-card__action button-secondary"
      aria-label={`${suggestion.actionLabel}: ${suggestion.title}`}
    >
      {suggestion.actionLabel}
    </motion.button>
  </motion.div>
);

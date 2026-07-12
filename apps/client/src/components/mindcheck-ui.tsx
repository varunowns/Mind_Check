import type { ReactNode } from "react";
import { motion } from "framer-motion";
import type { Badge } from "@pebble/shared";
import {
  getScoreDescriptor,
  getScoreTone,
  getScoreToneLabel,
  getScoreToneVar,
  moodPickerOptions,
  type ScoreTone
} from "../lib/design-system";

const joinClasses = (...values: Array<string | false | null | undefined>) => values.filter(Boolean).join(" ");

export const StaggerItem = ({
  children,
  className,
  delay = 0
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) => (
  <div className={joinClasses("stagger-in", className)} style={{ animationDelay: `${delay}ms` }}>
    {children}
  </div>
);

export const MetricCard = ({
  label,
  value,
  detail,
  accent
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  accent?: ReactNode;
}) => (
  <div className="surface-card metric-card">
    <div className="metric-card__label-row">
      <p className="eyebrow eyebrow--soft">{label}</p>
      {accent}
    </div>
    <p className="metric-card__value">{value}</p>
    {detail ? <div className="metric-card__detail">{detail}</div> : null}
  </div>
);

/** Figma: MindCheck / Components / ThemeToggle — Light + Dark */
// TODO: Figma frame missing or unavailable in this session — built from design language, needs Figma sync.
export const ThemeToggle = ({
  theme,
  onToggle
}: {
  theme: "light" | "dark";
  onToggle: () => void;
}) => (
  <button
    type="button"
    onClick={onToggle}
    className="icon-button theme-toggle"
    aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
  >
    <span className="theme-toggle__icon" aria-hidden="true">
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </span>
    <span>{theme === "dark" ? "Light" : "Dark"}</span>
  </button>
);

/** Figma: MindCheck / Components / StressRing — Light + Dark */
// TODO: Figma frame missing or unavailable in this session — built from design language, needs Figma sync.
export const StressRing = ({
  score,
  size = 220,
  title = "Stress score",
  caption
}: {
  score: number;
  size?: number;
  title?: string;
  caption?: string;
}) => {
  const tone = getScoreTone(score);
  const radius = size * 0.36;
  const circumference = 2 * Math.PI * radius;
  const progress = circumference - (Math.min(Math.max(score, 0), 100) / 100) * circumference;

  return (
    <div className="stress-ring">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`${title}: ${score} out of 100`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--bg-elevated)"
          strokeWidth={size * 0.075}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getScoreToneVar(tone)}
          strokeWidth={size * 0.075}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: progress }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      </svg>
      <div className="stress-ring__content">
        <p className="eyebrow eyebrow--soft">{title}</p>
        <p className="stress-ring__score">{score}</p>
        <p className="score-chip" data-tone={tone}>{getScoreToneLabel(tone)}</p>
        <p className="stress-ring__caption">{caption ?? getScoreDescriptor(score)}</p>
      </div>
    </div>
  );
};

/** Figma: MindCheck / Components / CheckinProgressBar — Light + Dark */
// TODO: Figma frame missing or unavailable in this session — built from design language, needs Figma sync.
export const CheckinProgressBar = ({
  currentStep,
  totalSteps,
  label
}: {
  currentStep: number;
  totalSteps: number;
  label: string;
}) => {
  const progress = Math.round((currentStep / totalSteps) * 100);

  return (
    <div className="progress-shell">
      <div className="progress-shell__meta">
        <span>Step {currentStep} of {totalSteps}</span>
        <span>{label}</span>
      </div>
      <div className="progress-track" aria-hidden="true">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
};

/** Figma: MindCheck / Components / MoodPicker — Light + Dark */
// TODO: Figma frame missing or unavailable in this session — built from design language, needs Figma sync.
export const MoodPicker = ({
  value,
  onChange
}: {
  value: string;
  onChange: (value: string) => void;
}) => (
  <div className="mood-grid" role="list" aria-label="Mood choices">
    {moodPickerOptions.map((option) => (
      <button
        key={option.value}
        type="button"
        className="mood-card"
        data-selected={value === option.value}
        onClick={() => onChange(option.value)}
      >
        <span className="mood-card__emoji" aria-hidden="true">{option.emoji}</span>
        <span className="mood-card__label">{option.label}</span>
        <span className="mood-card__detail">{option.detail}</span>
      </button>
    ))}
  </div>
);

/** Figma: MindCheck / Components / StressorChips — Light + Dark */
// TODO: Figma frame missing or unavailable in this session — built from design language, needs Figma sync.
export const StressorChips = ({
  options,
  value,
  onToggle
}: {
  options: readonly string[];
  value: string[];
  onToggle: (value: string) => void;
}) => (
  <div className="chip-row" role="list" aria-label="Stressors">
    {options.map((option) => {
      const selected = value.includes(option);
      return (
        <button
          key={option}
          type="button"
          className="chip-button"
          data-selected={selected}
          onClick={() => onToggle(option)}
        >
          {option}
        </button>
      );
    })}
  </div>
);

/** Figma: MindCheck / Components / JournalCard — Light + Dark */
// TODO: Figma frame missing or unavailable in this session — built from design language, needs Figma sync.
export const JournalCard = ({
  dateLabel,
  preview,
  active,
  tone,
  onClick
}: {
  dateLabel: string;
  preview: string;
  active?: boolean;
  tone: ScoreTone;
  onClick: () => void;
}) => (
  <button type="button" className="journal-card" data-active={active} onClick={onClick}>
    <div className="journal-card__meta">
      <p className="journal-card__date">{dateLabel}</p>
      <span className="score-chip" data-tone={tone}>{getScoreToneLabel(tone)}</span>
    </div>
    <p className="journal-card__preview">{preview}</p>
  </button>
);

/** Figma: MindCheck / Components / BreathingCircle — Light + Dark */
// TODO: Figma frame missing or unavailable in this session — built from design language, needs Figma sync.
export const BreathingCircle = ({
  phase,
  progress,
  label
}: {
  phase: "inhale" | "hold" | "exhale";
  progress: number;
  label: string;
}) => {
  const size = 240;
  const radius = 76;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - progress * circumference;
  const scale = phase === "inhale" ? 1.06 : phase === "hold" ? 1.06 : 0.94;

  return (
    <div className="breathing-circle">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--bg-elevated)"
          strokeWidth="18"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--accent-primary)"
          strokeWidth="18"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference, scale: 1 }}
          animate={{ strokeDashoffset: offset, scale }}
          transition={{ duration: 0.9, ease: "easeInOut" }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="breathing-circle__content">
        <p className="eyebrow eyebrow--soft">Breathing guide</p>
        <p className="breathing-circle__label">{label}</p>
        <p className="breathing-circle__phase">{phase}</p>
      </div>
    </div>
  );
};

/** Figma: MindCheck / Components / BadgeCard — Light + Dark */
// TODO: Figma frame missing or unavailable in this session — built from design language, needs Figma sync.
export const BadgeCard = ({ badge }: { badge: Badge }) => (
  <div className="badge-card" data-locked={!badge.earned}>
    <div className="badge-card__icon" aria-hidden="true">
      {badge.earned ? <LeafIcon /> : <LockIcon />}
    </div>
    <div>
      <p className="badge-card__title">{badge.title}</p>
      <p className="badge-card__copy">{badge.description}</p>
    </div>
  </div>
);

/** Figma: MindCheck / Components / TipCard — Light + Dark */
// TODO: Figma frame missing or unavailable in this session — built from design language, needs Figma sync.
export const TipCard = ({
  title,
  copy,
  icon
}: {
  title: string;
  copy: string;
  icon?: ReactNode;
}) => (
  <div className="tip-card">
    <div className="tip-card__icon" aria-hidden="true">
      {icon ?? <SparkleIcon />}
    </div>
    <div>
      <p className="tip-card__title">{title}</p>
      <p className="tip-card__copy">{copy}</p>
    </div>
  </div>
);

export const EmptyState = ({
  title,
  copy,
  action
}: {
  title: string;
  copy: string;
  action?: ReactNode;
}) => (
  <div className="empty-state">
    <div className="empty-state__art" aria-hidden="true">
      <svg viewBox="0 0 120 120">
        <path d="M31 76c7-25 20-37 39-37 14 0 24 7 30 20" />
        <path d="M41 81c7-9 15-14 26-14 12 0 22 6 31 18" />
        <path d="M58 53c0-9 6-15 14-15 8 0 13 5 13 13 0 9-6 15-14 15-7 0-13-5-13-13Z" />
      </svg>
    </div>
    <div>
      <p className="empty-state__title">{title}</p>
      <p className="empty-state__copy">{copy}</p>
      {action ? <div className="empty-state__action">{action}</div> : null}
    </div>
  </div>
);

export const ToastPill = ({ message }: { message: string }) => (
  <div className="toast-pill" role="status" aria-live="polite">
    {message}
  </div>
);

export const FlameIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M13.5 2.5c1.2 3.7-1.4 5.2-1.4 7.8 0 1.7 1.1 2.9 2.8 2.9 2.6 0 4.3-2.6 3.6-5.6 2.2 1.9 3.5 4.6 3.5 7.4 0 4.6-3.5 7.5-8.4 7.5S5.2 19.5 5.2 15.2c0-4 2.5-6.7 5.5-9.5.8 1.3 1.5 2.7 1.5 4.1 0 1 .2 1.8.8 2.4.7-.7 1.3-1.8 1.3-3.3 0-1.5-.3-3.5-.8-6.4Z" />
  </svg>
);

export const LeafIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M19.8 3.5c-6.1.4-10.2 2.1-12.4 5-2.5 3.3-2.1 7.8-.3 11 2.9-1.6 5.1-3.8 6.5-6.8 1.3-2.8 1.6-5.5 1.6-5.5-.7 1.7-1.7 3.1-3.1 4.3-2.2 1.8-4.7 2.9-7.7 3.3" />
  </svg>
);

export const SparkleIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M12 2.8 14.2 9l6.2 2.2-6.2 2.2L12 19.6l-2.2-6.2L3.6 11.2 9.8 9 12 2.8Z" />
  </svg>
);

const SunIcon = () => (
  <svg viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="4.4" />
    <path d="M12 2.7v3.1M12 18.2v3.1M21.3 12h-3.1M5.8 12H2.7M18.6 5.4l-2.2 2.2M7.6 16.4l-2.2 2.2M18.6 18.6l-2.2-2.2M7.6 7.6 5.4 5.4" />
  </svg>
);

const MoonIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M18 14.3a6.8 6.8 0 0 1-8.3-8.3A8.3 8.3 0 1 0 18 14.3Z" />
  </svg>
);

const LockIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M8 10.3V7.9a4 4 0 1 1 8 0v2.4M7.2 10.3h9.6c.7 0 1.2.5 1.2 1.2v7c0 .7-.5 1.2-1.2 1.2H7.2c-.7 0-1.2-.5-1.2-1.2v-7c0-.7.5-1.2 1.2-1.2Z" />
  </svg>
);

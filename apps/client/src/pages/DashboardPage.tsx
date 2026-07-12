import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  calculateInsights,
  generateJournalPrompt,
  type CheckInRecord,
  type DashboardSummary,
  type JournalEntry
} from "@pebble/shared";
import {
  EmptyState,
  FlameIcon,
  MetricCard,
  SparkleIcon,
  StaggerItem,
  StressRing,
  TipCard,
  ToastPill
} from "../components/mindcheck-ui";
import { api } from "../lib/api";
import { formatTimeLabel, prettyDate } from "../lib/date";
import { getGuestCheckInRecords, getGuestDashboardSummary, getGuestJournalRecords } from "../lib/guest";
import { getGreeting, getLatestRecord, getTipOfTheDay } from "../lib/design-system";
import { storage } from "../lib/storage";
import { useAuth } from "../store/auth";

const dashboardSkeleton = (
  <div className="page-stack">
    <div className="hero-split">
      <div className="surface-panel surface-section">
        <div className="skeleton-block h-4 w-32" />
        <div className="skeleton-block mt-4 h-16 w-full max-w-xl" />
        <div className="skeleton-block mt-4 h-5 w-full max-w-lg" />
      </div>
      <div className="surface-card surface-section">
        <div className="skeleton-block h-72 w-full" />
      </div>
    </div>
    <div className="metric-grid">
      <div className="skeleton-block h-32 w-full" />
      <div className="skeleton-block h-32 w-full" />
      <div className="skeleton-block h-32 w-full" />
    </div>
  </div>
);

export const DashboardPage = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary>(getGuestDashboardSummary());
  const [history, setHistory] = useState<CheckInRecord[]>(getGuestCheckInRecords());
  const [journalPreview, setJournalPreview] = useState<JournalEntry | null>(() => getGuestJournalRecords().sort((a, b) => b.date.localeCompare(a.date))[0] ?? null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(Boolean(user));
  const [toast, setToast] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      if (!user) {
        setSummary(getGuestDashboardSummary());
        setHistory(getGuestCheckInRecords());
        setJournalPreview(getGuestJournalRecords().sort((a, b) => b.date.localeCompare(a.date))[0] ?? null);
        setError("Guest data stays on this device until you log in.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const [summaryResponse, historyResponse, journalResponse] = await Promise.all([
          api.getDashboardSummary(),
          api.getCheckInHistory(),
          api.getJournalHistory()
        ]);

        setSummary(summaryResponse.summary);
        setHistory(historyResponse.checkIns);
        setJournalPreview(journalResponse.journals.sort((a, b) => b.date.localeCompare(a.date))[0] ?? null);
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : "Dashboard data could not be loaded.");
      } finally {
        setLoading(false);
      }
    };

    void loadDashboard();
  }, [user?.id]);

  useEffect(() => {
    const latestShield = summary.shield.history[0];
    if (!latestShield) return;
    if (storage.getSeenShieldUsage() === latestShield.id) return;

    storage.setSeenShieldUsage(latestShield.id);
    setToast("Shield used. Your streak is protected.");
    const timeout = window.setTimeout(() => setToast(""), 3000);
    return () => window.clearTimeout(timeout);
  }, [summary.shield.history]);

  const latestRecord = useMemo(
    () => getLatestRecord(summary.todayCheckIns.length ? summary.todayCheckIns : history),
    [history, summary.todayCheckIns]
  );
  const insights = useMemo(() => calculateInsights(history), [history]);
  const tip = getTipOfTheDay();
  const greeting = `${getGreeting()}, ${user?.name?.split(" ")[0] ?? "there"} 🌿`;
  const currentScore = latestRecord?.stressScore ?? Math.max(summary.averageThisWeek, 18);
  const journalPrompt = summary.weeklyReflectionPending
    ? summary.weeklyReflectionPrompt
    : latestRecord
      ? generateJournalPrompt(latestRecord)
      : "What would help tomorrow feel 5% kinder?";

  if (loading) {
    return dashboardSkeleton;
  }

  return (
    <div className="page-stack">
      {toast ? <ToastPill message={toast} /> : null}

      <section className="hero-split">
        <StaggerItem className="surface-panel surface-section" delay={0}>
          <p className="eyebrow eyebrow--soft">Dashboard / Home</p>
          <h1 className="headline mt-4">{greeting}</h1>
          <p className="body-copy mt-4 max-w-2xl">
            {error || "A calm read of how today is feeling, what patterns are showing up, and where to begin if you need a reset."}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/checkin" className="button-primary">
              <SparkleIcon />
              <span>Start today&apos;s check-in</span>
            </Link>
            <Link to="/journal" className="button-secondary">Open journal</Link>
          </div>
          {summary.activeEvent ? (
            <div className="mt-6 surface-card p-4">
              <p className="font-semibold">{summary.activeEvent.title}</p>
              <p className="body-copy mt-2 text-sm">Upcoming {summary.activeEvent.type} on {prettyDate(summary.activeEvent.date)}. We&apos;ll keep suggestions gentle around it.</p>
            </div>
          ) : null}
        </StaggerItem>

        <StaggerItem className="surface-card surface-section" delay={150}>
          <StressRing score={currentScore} title="Today&apos;s stress score" />
        </StaggerItem>
      </section>

      <section className="metric-grid">
        <StaggerItem delay={300}>
          <MetricCard
            label="Streak"
            value={`${summary.streakCount} days`}
            detail="Small consistency still counts."
            accent={<span className="metric-accent inline-flex h-5 w-5 text-[var(--accent-secondary)]"><FlameIcon /></span>}
          />
        </StaggerItem>
        <StaggerItem delay={450}>
          <MetricCard
            label="Last check-in"
            value={latestRecord ? formatTimeLabel(latestRecord.submittedAtLocal || latestRecord.createdAt) : "Not yet"}
            detail={latestRecord ? prettyDate(latestRecord.date) : "There is room to start softly."}
          />
        </StaggerItem>
        <StaggerItem delay={600}>
          <MetricCard
            label="Weekly average"
            value={`${summary.averageThisWeek}`}
            detail="A steadier read than any single day."
          />
        </StaggerItem>
      </section>

      <section className="content-split">
        <StaggerItem className="surface-card surface-section" delay={750}>
          <p className="eyebrow eyebrow--soft">Today&apos;s next step</p>
          <h2 className="section-title mt-3">Start today&apos;s check-in</h2>
          <p className="body-copy mt-3">
            Sleep, mood, energy, stressors, and reflection come together into one calm score reveal with gentle suggestions.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/checkin" className="button-primary">Begin check-in</Link>
            <Link to="/pulse" className="button-secondary">Log quick pulse</Link>
          </div>
        </StaggerItem>

        <StaggerItem className="surface-card surface-section" delay={900}>
          <p className="eyebrow eyebrow--soft">Recent journal preview</p>
          <h2 className="section-title mt-3">Your words, without pressure</h2>
          {journalPreview ? (
            <div className="surface-muted p-4 mt-5">
              <p className="font-semibold">{prettyDate(journalPreview.date)}</p>
              <p className="body-copy mt-3">
                {journalPreview.content || journalPreview.prompt}
              </p>
            </div>
          ) : (
            <div className="mt-5">
              <EmptyState
                title="No journal entry yet"
                copy="When you want a little more room than the check-in gives, your journal will be here."
                action={<Link to="/journal" className="button-secondary">Open journal</Link>}
              />
            </div>
          )}
        </StaggerItem>
      </section>

      <section className="content-split">
        <StaggerItem className="surface-card surface-section" delay={1050}>
          <p className="eyebrow eyebrow--soft">Tip of the day</p>
          <h2 className="section-title mt-3">A softer reset</h2>
          <div className="mt-5">
            <TipCard title={tip.title} copy={tip.copy} />
          </div>
        </StaggerItem>

        <StaggerItem className="surface-card surface-section" delay={1200}>
          <p className="eyebrow eyebrow--soft">Pattern glimpse</p>
          <h2 className="section-title mt-3">What your week is showing</h2>
          {insights.unlocked && insights.topInsights.length ? (
            <div className="mt-5 grid gap-3">
              {insights.topInsights.slice(0, 2).map((item) => (
                <div key={item.key} className="surface-muted p-4">
                  <p className="font-semibold">{item.label}</p>
                  <p className="mt-2 text-2xl font-semibold">{item.improvementPercent}% lower</p>
                  <p className="body-copy mt-2 text-sm">{item.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5">
              <TipCard title="Journal prompt" copy={journalPrompt} />
            </div>
          )}
          <div className="mt-5">
            <Link to="/insights" className="button-secondary">Open full insights</Link>
          </div>
        </StaggerItem>
      </section>
    </div>
  );
};

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { CheckInRecord, DashboardSummary } from "@pebble/shared";
import { calculateInsights } from "@pebble/shared";
import { EmptyState, MetricCard, StaggerItem, StressRing, TipCard } from "../components/mindcheck-ui";
import { api } from "../lib/api";
import { getHeatmapTone, getLatestRecord } from "../lib/design-system";
import { getGuestCheckInRecords, getGuestDashboardSummary } from "../lib/guest";
import { useAuth } from "../store/auth";

const tooltipStyle = {
  borderRadius: "1rem",
  border: "1px solid var(--border-subtle)",
  background: "color-mix(in srgb, var(--bg-surface) 94%, transparent)",
  boxShadow: "var(--shadow)"
};

export const InsightsPage = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<CheckInRecord[]>(user ? [] : getGuestCheckInRecords());
  const [summary, setSummary] = useState<DashboardSummary>(getGuestDashboardSummary());
  const [loading, setLoading] = useState(Boolean(user));
  const insights = useMemo(() => calculateInsights(history), [history]);
  const latest = useMemo(() => getLatestRecord(history), [history]);

  useEffect(() => {
    if (!user) {
      setHistory(getGuestCheckInRecords());
      setSummary(getGuestDashboardSummary());
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all([api.getCheckInHistory(), api.getDashboardSummary()])
      .then(([historyResponse, summaryResponse]) => {
        setHistory(historyResponse.checkIns);
        setSummary(summaryResponse.summary);
      })
      .finally(() => setLoading(false));
  }, [user?.id]);

  const comparisonChart = insights.comparisons.map((item) => ({
    name: item.label,
    lowerStressDays: item.lowAverage,
    higherStressDays: item.highAverage
  }));

  if (loading) {
    return (
      <div className="page-stack">
        <div className="hero-split">
          <div className="surface-panel surface-section">
            <div className="skeleton-block h-4 w-24" />
            <div className="skeleton-block mt-4 h-16 w-full max-w-xl" />
          </div>
          <div className="surface-card surface-section">
            <div className="skeleton-block h-72 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <section className="hero-split">
        <StaggerItem className="surface-panel surface-section" delay={0}>
          <p className="eyebrow eyebrow--soft">Stress score & insights</p>
          <h1 className="headline mt-4">Patterns worth noticing, not judging.</h1>
          <p className="body-copy mt-4 max-w-2xl">
            Your weekly trend, the support habits that correlate with lower stress, and a mood heatmap that stays readable in both themes.
          </p>
          <div className="mt-6 grid gap-3">
            <MetricCard label="Check-ins completed" value={history.length} detail={`${insights.progress} of ${insights.threshold} needed to unlock stronger pattern calls.`} />
          </div>
        </StaggerItem>

        <StaggerItem className="surface-card surface-section" delay={150}>
          <StressRing score={latest?.stressScore ?? Math.max(summary.averageThisWeek, 18)} title="Latest score" />
        </StaggerItem>
      </section>

      <StaggerItem className="surface-card surface-section" delay={300}>
        <p className="eyebrow eyebrow--soft">Weekly trend chart</p>
        <h2 className="section-title mt-3">Stress and pulse across the week</h2>
        <div className="chart-shell mt-6">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={summary.trend}>
              <CartesianGrid strokeDasharray="4 4" stroke="var(--chart-grid)" />
              <XAxis dataKey="date" tickFormatter={(value) => value.slice(5)} stroke="var(--text-muted)" />
              <YAxis domain={[0, 100]} stroke="var(--text-muted)" />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="stressScore" stroke="var(--score-high)" strokeWidth={3} connectNulls />
              <Line type="monotone" dataKey="pulseMood" stroke="var(--score-low)" strokeWidth={2.5} strokeDasharray="6 4" connectNulls />
              <Line type="monotone" dataKey="pulseFocus" stroke="var(--score-mid)" strokeWidth={2.5} strokeDasharray="3 3" connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </StaggerItem>

      <section className="insight-grid">
        {insights.unlocked && insights.topInsights.length ? insights.topInsights.map((item, index) => (
          <StaggerItem key={item.key} className="surface-card surface-section" delay={450 + index * 150}>
            <p className="eyebrow eyebrow--soft">Pattern insight</p>
            <h2 className="section-title mt-3">{item.label}</h2>
            <p className="mt-4 text-3xl font-semibold">{item.improvementPercent}% lower stress</p>
            <p className="body-copy mt-3">{item.message}</p>
          </StaggerItem>
        )) : (
          <StaggerItem className="surface-card surface-section" delay={450}>
            <EmptyState
              title="More data unlocks stronger pattern calls"
              copy="Keep checking in for a few more days and the comparison cards will start to clarify what supports you best."
            />
          </StaggerItem>
        )}
      </section>

      <section className="content-split">
        <StaggerItem className="surface-card surface-section" delay={900}>
          <p className="eyebrow eyebrow--soft">High vs lower stress days</p>
          <h2 className="section-title mt-3">Comparison view</h2>
          {insights.unlocked ? (
            <div className="chart-shell mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonChart}>
                  <CartesianGrid strokeDasharray="4 4" stroke="var(--chart-grid)" />
                  <XAxis dataKey="name" stroke="var(--text-muted)" />
                  <YAxis domain={[0, 100]} stroke="var(--text-muted)" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="lowerStressDays" fill="var(--score-low)" radius={[16, 16, 0, 0]} />
                  <Bar dataKey="higherStressDays" fill="var(--score-high)" radius={[16, 16, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="mt-5">
              <TipCard title="Comparison view pending" copy="Once you have enough check-ins, this chart will compare what tends to happen on steadier versus heavier days." />
            </div>
          )}
        </StaggerItem>

        <StaggerItem className="surface-card surface-section" delay={1050}>
          <p className="eyebrow eyebrow--soft">Mood heatmap</p>
          <h2 className="section-title mt-3">Completion and intensity</h2>
          <div className="heatmap-grid mt-6">
            {summary.heatmap.map((day) => (
              <div
                key={day.date}
                className="heatmap-cell"
                data-tone={getHeatmapTone(day.score, day.completed)}
                data-empty={!day.completed}
                title={`${day.date}${day.completed ? ` • score ${day.score}` : " • no check-in"}`}
              >
                {day.date.slice(8)}
              </div>
            ))}
          </div>
        </StaggerItem>
      </section>
    </div>
  );
};

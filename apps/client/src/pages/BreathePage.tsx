import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BreathingCircle, EmptyState, MetricCard, StaggerItem, TipCard } from "../components/mindcheck-ui";
import { buildBreathingInsights, formatDuration, getBreathingPhase, type BreathingSession, type TechniqueKey } from "../lib/breathing";
import { quickReliefOptions } from "../lib/design-system";
import { techniques } from "../lib/content";
import { todayKey } from "../lib/date";
import { storage } from "../lib/storage";

const tooltipStyle = {
  borderRadius: "1rem",
  border: "1px solid var(--border-subtle)",
  background: "color-mix(in srgb, var(--bg-surface) 94%, transparent)",
  boxShadow: "var(--shadow)"
};

export const BreathePage = () => {
  const [technique, setTechnique] = useState<TechniqueKey>("box");
  const [duration, setDuration] = useState(120);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [sessions, setSessions] = useState<BreathingSession[]>(() => storage.getBreathingSessions());
  const [status, setStatus] = useState("");
  const config = useMemo(() => techniques[technique], [technique]);
  const phase = useMemo(() => getBreathingPhase(elapsed, technique), [elapsed, technique]);
  const insights = useMemo(() => buildBreathingInsights(sessions), [sessions]);
  const progress = useMemo(() => Math.min(elapsed / duration, 1), [duration, elapsed]);

  useEffect(() => {
    if (!running) return;
    const interval = window.setInterval(() => setElapsed((current) => current + 1), 1000);
    return () => window.clearInterval(interval);
  }, [running]);

  useEffect(() => {
    if (!running || elapsed < duration) return;

    const completedSession = {
      technique,
      duration,
      completedAt: new Date().toISOString(),
      dateKey: todayKey()
    } satisfies BreathingSession;

    setSessions(storage.saveBreathingSession(completedSession));
    setStatus(`${techniques[technique].label} completed and added to your history.`);
    setRunning(false);
    setElapsed(0);
  }, [duration, elapsed, running, technique]);

  const resetSession = (nextStatus = "") => {
    setRunning(false);
    setElapsed(0);
    setStatus(nextStatus);
  };

  const handleTechniqueChange = (nextTechnique: TechniqueKey) => {
    if (nextTechnique === technique) return;
    const wasActive = running || elapsed > 0;
    setTechnique(nextTechnique);
    resetSession(wasActive ? "Session reset for the new exercise." : "");
  };

  const handleDurationChange = (nextDuration: number) => {
    if (nextDuration === duration) return;
    const wasActive = running || elapsed > 0;
    setDuration(nextDuration);
    resetSession(wasActive ? "Timer reset for the new duration." : "");
  };

  const toggleRunning = () => {
    setStatus("");
    setRunning((current) => !current);
  };

  return (
    <div className="page-stack">
      <section className="hero-split">
        <StaggerItem className="surface-panel surface-section" delay={0}>
          <p className="eyebrow eyebrow--soft">Breathing & relief tools</p>
          <h1 className="headline mt-4">{config.label}</h1>
          <p className="body-copy mt-4">Use one paced exercise, then choose a quick relief card if you need the landing to feel softer.</p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm text-muted">
            <span>{formatDuration(elapsed)} elapsed</span>
            <span>{formatDuration(duration)} target</span>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={toggleRunning} className="button-primary">
              {running ? "Pause session" : elapsed > 0 ? "Resume session" : "Start session"}
            </button>
            <button onClick={() => resetSession()} disabled={!running && elapsed === 0} className="button-secondary">
              Reset timer
            </button>
          </div>
          <p className="mt-4 text-sm text-muted">{status || "Finish the timer to count a breathing session in your history."}</p>
        </StaggerItem>

        <StaggerItem className="surface-card surface-section" delay={150}>
          <BreathingCircle phase={phase} progress={progress} label={config.label} />
        </StaggerItem>
      </section>

      <section className="metric-grid">
        <StaggerItem delay={300}>
          <MetricCard label="Completed today" value={insights.todayCount} detail="Finished sessions logged on this device today." />
        </StaggerItem>
        <StaggerItem delay={450}>
          <MetricCard label="Last 7 days" value={insights.weekCount} detail={`${insights.totalMinutes} total minutes completed.`} />
        </StaggerItem>
        <StaggerItem delay={600}>
          <MetricCard
            label="Most practiced"
            value={insights.favoriteTechnique?.label ?? "No data yet"}
            detail={insights.favoriteTechnique ? `${insights.favoriteTechnique.count} completed sessions so far.` : "Complete a session to start your rhythm."}
          />
        </StaggerItem>
      </section>

      <section className="content-split">
        <StaggerItem className="surface-card surface-section" delay={750}>
          <p className="eyebrow eyebrow--soft">Preset breathing</p>
          <h2 className="section-title mt-3">Choose a pace</h2>
          <div className="inline-option-grid mt-5">
            {(Object.keys(techniques) as TechniqueKey[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => handleTechniqueChange(key)}
                className="session-card"
                data-active={technique === key}
                aria-pressed={technique === key}
              >
                <p className="font-semibold">{techniques[key].label}</p>
                <p className="body-copy mt-2 text-sm">
                  Inhale {techniques[key].inhale}s • Hold {techniques[key].hold}s • Exhale {techniques[key].exhale}s
                </p>
              </button>
            ))}
          </div>

          <p className="font-semibold mt-6">Session length</p>
          <div className="inline-option-grid mt-3">
            {[120, 300, 420].map((seconds) => (
              <button
                key={seconds}
                type="button"
                onClick={() => handleDurationChange(seconds)}
                className="session-card"
                data-active={duration === seconds}
                aria-pressed={duration === seconds}
              >
                {seconds / 60} min
              </button>
            ))}
          </div>
        </StaggerItem>

        <StaggerItem className="surface-card surface-section" delay={900}>
          <p className="eyebrow eyebrow--soft">Quick relief cards</p>
          <h2 className="section-title mt-3">Small resets that still count</h2>
          <div className="mt-5 grid gap-3">
            {quickReliefOptions.map((item) => (
              <TipCard key={item.title} title={item.title} copy={item.copy} />
            ))}
          </div>
        </StaggerItem>
      </section>

      <section className="content-split">
        <StaggerItem className="surface-card surface-section" delay={1050}>
          <p className="eyebrow eyebrow--soft">Activity chart</p>
          <h2 className="section-title mt-3">7-day breathing activity</h2>
          <div className="chart-shell mt-6">
            {insights.totalSessions ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={insights.dailyTrend}>
                  <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="var(--chart-grid)" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} stroke="var(--text-muted)" />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} stroke="var(--text-muted)" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="sessions" name="Completed sessions" radius={[16, 16, 0, 0]} fill="var(--accent-primary)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="No sessions yet" copy="Start and finish a breathing session to unlock your activity graph." />
            )}
          </div>
        </StaggerItem>

        <StaggerItem className="surface-card surface-section" delay={1200}>
          <p className="eyebrow eyebrow--soft">Exercise mix</p>
          <h2 className="section-title mt-3">What you return to most</h2>
          <div className="mt-5 grid gap-3">
            {insights.breakdown.some((item) => item.count > 0) ? insights.breakdown.filter((item) => item.count > 0).map((item) => (
              <TipCard
                key={item.key}
                title={item.label}
                copy={`${item.count} total sessions • ${item.weekCount} this week • ${Math.round(item.share * 100)}% share`}
              />
            )) : (
              <TipCard title="Exercise mix pending" copy="Your most-used breathing exercises will appear here after your first completed session." />
            )}
          </div>
        </StaggerItem>
      </section>
    </div>
  );
};

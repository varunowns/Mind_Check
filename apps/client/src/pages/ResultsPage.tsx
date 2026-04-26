import { Link } from "react-router-dom";
import type { CheckInRecord, CheckInResultContext, ReliefSuggestion } from "@mindcheck/shared";
import { EmptyState, SparkleIcon, StaggerItem, StressRing, TipCard } from "../components/mindcheck-ui";
import { getEmpathyMessage, getScoreTone, getScoreToneLabel } from "../lib/design-system";
import { formatTimeLabel } from "../lib/date";

type SessionResult = {
  checkIn: CheckInRecord;
  suggestions: ReliefSuggestion[];
  prompt: string;
  context: CheckInResultContext;
};

export const ResultsPage = () => {
  const raw = sessionStorage.getItem("mindcheck.latest-result");
  const result = raw ? JSON.parse(raw) as SessionResult : null;

  if (!result) {
    return (
      <EmptyState
        title="No fresh results yet"
        copy="A new check-in will bring this page to life."
        action={<Link to="/checkin" className="button-primary">Start a check-in</Link>}
      />
    );
  }

  const tone = getScoreTone(result.checkIn.stressScore);

  return (
    <div className="page-stack">
      <section className="hero-split">
        <StaggerItem className="surface-panel surface-section" delay={0}>
          <p className="eyebrow eyebrow--soft">Today&apos;s reveal</p>
          <h1 className="section-title mt-3">{getEmpathyMessage(result.checkIn.stressScore)}</h1>
          <p className="body-copy mt-4">
            Logged {result.checkIn.session === "full" ? "as your full daily check-in" : `for your ${result.checkIn.session} session`} at {formatTimeLabel(result.checkIn.submittedAtLocal || result.checkIn.createdAt)}.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/journal" className="button-primary">
              <SparkleIcon />
              <span>Journal from this</span>
            </Link>
            <Link to="/dashboard" className="button-secondary">Back to dashboard</Link>
          </div>
        </StaggerItem>

        <StaggerItem className="surface-card surface-section" delay={150}>
          <StressRing score={result.checkIn.stressScore} title="Stress score" caption={getScoreToneLabel(tone)} />
        </StaggerItem>
      </section>

      {result.context.activeEvent ? (
        <StaggerItem className="surface-card surface-section" delay={300}>
          <TipCard
            title="Exam mode active"
            copy={`Suggestions are tuned around your upcoming ${result.context.activeEvent.title}.`}
          />
        </StaggerItem>
      ) : null}

      {result.context.burnout.active ? (
        <StaggerItem className="surface-card surface-section" delay={450}>
          <TipCard
            title="A longer stretch of strain is showing up"
            copy={`Recent average: ${result.context.burnout.avgScore} across ${result.context.burnout.daysCount} days. Keep the next step protective, not ambitious.`}
          />
        </StaggerItem>
      ) : null}

      <section className="insight-grid">
        {result.suggestions.map((suggestion, index) => (
          <StaggerItem key={suggestion.id} className="surface-card surface-section" delay={600 + index * 150}>
            <p className="eyebrow eyebrow--soft">{suggestion.category}</p>
            <h2 className="section-title mt-3">{suggestion.title}</h2>
            <p className="body-copy mt-3">{suggestion.description}</p>
            {suggestion.steps?.length ? (
              <div className="mt-4 grid gap-2">
                {suggestion.steps.map((step) => (
                  <div key={step} className="surface-muted p-3 text-sm">{step}</div>
                ))}
              </div>
            ) : null}
            <div className="mt-5">
              {suggestion.href ? (
                <a href={suggestion.href} target="_blank" rel="noreferrer" className="button-secondary">{suggestion.actionLabel}</a>
              ) : suggestion.category === "breathing" ? (
                <Link to="/breathe" className="button-primary">{suggestion.actionLabel}</Link>
              ) : suggestion.category === "journal" ? (
                <Link to="/journal" className="button-primary">{suggestion.actionLabel}</Link>
              ) : (
                <span className="score-chip" data-tone={tone}>{suggestion.actionLabel}</span>
              )}
            </div>
          </StaggerItem>
        ))}
      </section>

      <StaggerItem className="surface-card surface-section" delay={1200}>
        <p className="eyebrow eyebrow--soft">Reflection prompt</p>
        <h2 className="section-title mt-3">Bring this into words</h2>
        <p className="body-copy mt-4">{result.prompt}</p>
      </StaggerItem>
    </div>
  );
};

import { Link } from "react-router-dom";
import type { CheckInRecord, CheckInResultContext, ReliefSuggestion } from "@mindcheck/shared";
import { EmptyState, SparkleIcon, StaggerItem, StressRing, TipCard } from "../components/mindcheck-ui";
import { ReliefSuggestionCard } from "../components/ReliefSuggestionCard";
import { getEmpathyMessage, getScoreTone, getScoreToneLabel } from "../lib/design-system";
import { formatTimeLabel } from "../lib/date";

type SessionResult = {
  checkIn: CheckInRecord;
  suggestions: ReliefSuggestion[];
  prompt: string;
  context: CheckInResultContext;
};

const handleSuggestionAction = (suggestion: ReliefSuggestion) => {
  if (suggestion.href) {
    window.open(suggestion.href, "_blank");
  } else if (suggestion.category === "breathing") {
    window.location.href = "/breathe";
  } else if (suggestion.category === "journal") {
    window.location.href = "/journal";
  }
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

      <section className="relief-grid">
        <h2 className="relief-grid__title">Relief suggestions tailored for you</h2>
        <div className="relief-grid__content">
          {result.suggestions.map((suggestion, index) => (
            <ReliefSuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              onAction={handleSuggestionAction}
              index={index}
            />
          ))}
        </div>
      </section>

      <StaggerItem className="surface-card surface-section" delay={1200}>
        <p className="eyebrow eyebrow--soft">Reflection prompt</p>
        <h2 className="section-title mt-3">Bring this into words</h2>
        <p className="body-copy mt-4">{result.prompt}</p>
      </StaggerItem>
    </div>
  );
};

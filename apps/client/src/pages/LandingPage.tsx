import { Link } from "react-router-dom";
import { MetricCard, SparkleIcon, StaggerItem, StressRing, TipCard } from "../components/mindcheck-ui";
import { getTipOfTheDay } from "../lib/design-system";

export const LandingPage = () => {
  const tip = getTipOfTheDay();

  return (
    <div className="page-stack">
      <section className="hero-split">
        <StaggerItem className="surface-panel surface-section" delay={0}>
          <p className="eyebrow eyebrow--soft">Daily stress tracker and relief companion</p>
          <h1 className="headline mt-4 max-w-3xl">Meet yourself where you are, then take one gentle next step.</h1>
          <p className="body-copy mt-5 max-w-2xl text-lg">
            MindCheck helps students and busy humans track daily stress, spot patterns, and try small relief tools that feel supportive instead of overwhelming.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/checkin" className="button-primary">
              <SparkleIcon />
              <span>Start today&apos;s check-in</span>
            </Link>
            <Link to="/signup" className="button-secondary">Create account</Link>
          </div>
        </StaggerItem>

        <StaggerItem className="surface-card surface-section" delay={150}>
          <div className="grid gap-4">
            <div className="surface-muted p-4">
              <StressRing score={38} size={220} title="Sample score" caption="MindCheck turns daily signals into a gentle, readable snapshot." />
            </div>
            <TipCard title={tip.title} copy={tip.copy} />
          </div>
        </StaggerItem>
      </section>

      <section className="metric-grid">
        <StaggerItem delay={300}>
          <MetricCard label="Check in" value="2 minutes" detail="A guided flow for sleep, mood, energy, stressors, and reflection." />
        </StaggerItem>
        <StaggerItem delay={450}>
          <MetricCard label="Understand patterns" value="Weekly insight" detail="Spot what lowers pressure and which days ask for gentler pacing." />
        </StaggerItem>
        <StaggerItem delay={600}>
          <MetricCard label="Reset softly" value="Breath + journal" detail="Try one relief tool instead of a whole self-improvement plan." />
        </StaggerItem>
      </section>
    </div>
  );
};

import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  calculateStressScore,
  type CheckInInput,
  type CheckInMode,
  type CheckInRecord
} from "@pebble/shared";
import {
  EmptyState,
  MoodPicker,
  StaggerItem,
  StressorChips,
  TipCard
} from "../components/mindcheck-ui";
import { ProgressIndicator, FormSection } from "../components/FormComponents";
import { api } from "../lib/api";
import { buildStoredStressor, splitStoredStressor, stressorOptions } from "../lib/design-system";
import { buildGuestResultState } from "../lib/guest";
import { toLocalTimestamp, todayKey } from "../lib/date";
import { storage } from "../lib/storage";
import { useAuth } from "../store/auth";

const steps = ["Sleep", "Mood", "Energy", "Stressors", "Reflection"] as const;

const baseState = (): CheckInInput => ({
  date: todayKey(),
  session: "full",
  sleepHours: 8,
  sleepQuality: 7,
  meals: "balanced",
  activity: "moderate",
  social: "normal",
  workload: "moderate",
  stressor: "",
  mood: "okay",
  energy: 6,
  meetingCount: null,
  submittedAtLocal: toLocalTimestamp()
});

const getStepTitle = (step: number): string => {
  const titles = [
    "How did sleep treat you?",
    "What mood feels closest?",
    "How's your energy?",
    "What's weighing on you?",
    "Bring this into words"
  ];
  return titles[step] || "";
};

const getStepDescription = (step: number, _mode: CheckInMode, _session: string): string => {
  const descriptions = [
    "We'll start with rest, since it changes how every other signal feels.",
    "There's no perfect label here, just the one that feels nearest.",
    "Energy often tracks with stress and sleep.",
    "Name what's on your plate — work, people, deadlines, anything.",
    "A sentence or two can help you reflect later on what mattered most."
  ];
  return descriptions[step] || "";
};

const draft = storage.getDraftCheckIn();
const parsedDraft = splitStoredStressor(draft.stressor ?? "");

export const CheckInPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const mode: CheckInMode = user?.checkinMode ?? storage.getGuestSettings().checkinMode;
  const [todaySessions, setTodaySessions] = useState<CheckInRecord[]>([]);
  const [loadingToday, setLoadingToday] = useState(Boolean(user));
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<CheckInInput>({ ...baseState(), ...draft, date: todayKey(), stressor: "" });
  const [selectedStressors, setSelectedStressors] = useState<string[]>(parsedDraft.chips);
  const [reflection, setReflection] = useState(parsedDraft.reflection);
  const [error, setError] = useState("");
  const [sessionSelected, setSessionSelected] = useState(mode === "once");

  useEffect(() => {
    if (!user) {
      setTodaySessions(storage.getGuestCheckIns().filter((item) => item.date === todayKey()).map((item) => ({
        id: `${item.date}-${item.session}`,
        userId: "guest",
        ...item,
        stressScore: calculateStressScore(item).score,
        createdAt: item.submittedAtLocal,
        updatedAt: item.submittedAtLocal
      })));
      setLoadingToday(false);
      return;
    }

    api.getTodayCheckIn(todayKey())
      .then((response) => setTodaySessions(response.checkIns))
      .finally(() => setLoadingToday(false));
  }, [user?.id]);

  const availableSessions = useMemo<CheckInInput["session"][]>(() => {
    const completed = new Set(todaySessions.map((item) => item.session));
    if (mode === "once") return completed.has("full") ? [] : ["full"];
    return (["morning", "afternoon", "evening"] as CheckInInput["session"][]).filter((session) => !completed.has(session));
  }, [mode, todaySessions]);

  useEffect(() => {
    const fallbackSession: CheckInInput["session"] = availableSessions[0] ?? (mode === "once" ? "full" : "morning");
    setForm((current) => ({
      ...baseState(),
      ...current,
      date: todayKey(),
      session: availableSessions.includes(current.session) ? current.session : fallbackSession
    }));

    if (mode === "once") {
      setSessionSelected(true);
    }
  }, [availableSessions, mode]);

  const persistDraft = (nextForm = form, nextStressors = selectedStressors, nextReflection = reflection) => {
    storage.saveDraftCheckIn({
      ...nextForm,
      stressor: buildStoredStressor(nextStressors, nextReflection)
    });
  };

  const submit = async () => {
    const payload: CheckInInput = {
      ...form,
      date: todayKey(),
      session: mode === "once" ? "full" : form.session,
      stressor: buildStoredStressor(selectedStressors, reflection),
      submittedAtLocal: toLocalTimestamp()
    };

    setSubmitting(true);
    setError("");

    try {
      if (user) {
        const response = await api.saveCheckIn(payload);
        sessionStorage.setItem("pebble.latest-result", JSON.stringify(response));
      } else {
        const response = buildGuestResultState(payload);
        storage.saveGuestCheckIn(payload);
        storage.saveGuestJournal({ date: payload.date, prompt: response.prompt, content: "", wordCount: 0, entryType: "daily" });
        sessionStorage.setItem("pebble.latest-result", JSON.stringify(response));
      }

      storage.clearDraftCheckIn();
      navigate("/results");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const next = async () => {
    persistDraft();

    if (step < steps.length - 1) {
      setStep((current) => current + 1);
      return;
    }

    await submit();
  };

  if (loadingToday) {
    return (
      <div className="surface-panel surface-section">
        <div className="skeleton-block h-4 w-36" />
        <div className="skeleton-block mt-4 h-64 w-full" />
      </div>
    );
  }

  if (!availableSessions.length) {
    return (
      <EmptyState
        title="Today is already covered"
        copy="You&apos;ve already completed every available session for today. If you want a lighter touchpoint, you can still log a quick pulse."
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/pulse" className="button-primary">Open quick pulse</Link>
            <Link to="/dashboard" className="button-secondary">Back to dashboard</Link>
          </div>
        }
      />
    );
  }

  if (mode === "thrice" && !sessionSelected) {
    return (
      <div className="page-stack mx-auto max-w-4xl">
        <StaggerItem className="surface-panel surface-section" delay={0}>
          <p className="eyebrow eyebrow--soft">Choose a session</p>
          <h1 className="section-title mt-3">Which check-in are you doing right now?</h1>
          <p className="body-copy mt-3">Only sessions you haven&apos;t completed yet today are shown here.</p>
        </StaggerItem>

        <div className="inline-option-grid">
          {availableSessions.map((session, index) => (
            <StaggerItem key={session} delay={150 * (index + 1)}>
              <button
                type="button"
                onClick={() => {
                  setForm((current) => ({ ...current, session }));
                  setSessionSelected(true);
                  persistDraft({ ...form, session });
                }}
                className="session-card w-full"
              >
                <p className="font-semibold capitalize">{session}</p>
                <p className="body-copy mt-2 text-sm">Start your {session} check-in.</p>
              </button>
            </StaggerItem>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page-stack mx-auto max-w-4xl">
      <StaggerItem className="surface-panel surface-section" delay={0}>
        <ProgressIndicator
          current={step + 1}
          total={steps.length}
          label={`${steps[step]}${mode === "thrice" ? ` • ${form.session}` : ""}`}
        />
      </StaggerItem>

      <FormSection
        title={getStepTitle(step)}
        description={getStepDescription(step, mode, form.session)}
      >
        <StaggerItem delay={150}>
          {step === 0 ? <SleepStep form={form} setForm={setForm} /> : null}
          {step === 1 ? <MoodStep form={form} setForm={setForm} /> : null}
          {step === 2 ? <EnergyStep form={form} setForm={setForm} /> : null}
          {step === 3 ? (
            <StressorsStep
              form={form}
              setForm={setForm}
              selectedStressors={selectedStressors}
              setSelectedStressors={setSelectedStressors}
            />
          ) : null}
          {step === 4 ? (
            <ReflectionStep
              reflection={reflection}
              setReflection={setReflection}
              sessionLabel={mode === "thrice" ? form.session : "daily"}
              selectedStressors={selectedStressors}
            />
          ) : null}

          {error ? (
            <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
              <p className="text-sm" style={{ color: "var(--danger)" }}>
                ⚠️ {error}
              </p>
            </div>
          ) : null}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                persistDraft();
                setStep((current) => Math.max(current - 1, 0));
              }}
              disabled={step === 0}
              className="button-secondary"
            >
              ← Back
            </button>
            <button type="button" onClick={next} disabled={submitting} className="button-primary">
              {submitting ? "Saving..." : step === steps.length - 1 ? "Reveal my score →" : "Next →"}
            </button>
          </div>
        </StaggerItem>
      </FormSection>

      <StaggerItem delay={300}>
        <TipCard title="Saved as you go" copy="We keep a local draft of this check-in in case you step away before finishing." />
      </StaggerItem>
    </div>
  );
};

const SleepStep = ({
  form,
  setForm
}: {
  form: CheckInInput;
  setForm: (value: CheckInInput) => void;
}) => (
  <div className="space-y-6">
    <div>
      <p className="eyebrow eyebrow--soft">Step 1</p>
      <h1 className="section-title mt-3">How did sleep treat you?</h1>
      <p className="body-copy mt-3">We&apos;ll start with rest, since it changes how every other signal feels.</p>
    </div>

    <label className="range-row">
      <span className="font-semibold">Hours slept</span>
      <div className="range-shell">
        <span>0h</span>
        <input type="range" min="0" max="12" value={form.sleepHours} onChange={(event) => setForm({ ...form, sleepHours: Number(event.target.value) })} className="range-input" />
        <span>{form.sleepHours}h</span>
      </div>
    </label>

    <label className="range-row">
      <span className="font-semibold">How rested do you feel? ({form.sleepQuality}/10)</span>
      <div className="range-shell">
        <span>Low</span>
        <input type="range" min="1" max="10" value={form.sleepQuality} onChange={(event) => setForm({ ...form, sleepQuality: Number(event.target.value) })} className="range-input" />
        <span>Rested</span>
      </div>
    </label>

    <div>
      <p className="font-semibold">Nourishment today</p>
      <div className="inline-option-grid mt-3">
        {[
          { value: "skipped", label: "Skipped meals" },
          { value: "mixed", label: "Mixed rhythm" },
          { value: "balanced", label: "Balanced meals" }
        ].map((option) => (
          <button
            key={option.value}
            type="button"
            className="preference-card"
            data-active={form.meals === option.value}
            onClick={() => setForm({ ...form, meals: option.value as CheckInInput["meals"] })}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  </div>
);

const MoodStep = ({
  form,
  setForm
}: {
  form: CheckInInput;
  setForm: (value: CheckInInput) => void;
}) => (
  <div className="space-y-6">
    <div>
      <p className="eyebrow eyebrow--soft">Step 2</p>
      <h1 className="section-title mt-3">What mood feels closest?</h1>
      <p className="body-copy mt-3">There&apos;s no perfect label here, just the one that feels nearest.</p>
    </div>

    <MoodPicker value={form.mood} onChange={(value) => setForm({ ...form, mood: value as CheckInInput["mood"] })} />

    <div>
      <p className="font-semibold">How connected did you feel?</p>
      <div className="inline-option-grid mt-3">
        {[
          { value: "isolated", label: "Quite isolated" },
          { value: "normal", label: "A usual amount" },
          { value: "social", label: "Well connected" }
        ].map((option) => (
          <button
            key={option.value}
            type="button"
            className="preference-card"
            data-active={form.social === option.value}
            onClick={() => setForm({ ...form, social: option.value as CheckInInput["social"] })}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  </div>
);

const EnergyStep = ({
  form,
  setForm
}: {
  form: CheckInInput;
  setForm: (value: CheckInInput) => void;
}) => (
  <div className="space-y-6">
    <div>
      <p className="eyebrow eyebrow--soft">Step 3</p>
      <h1 className="section-title mt-3">How much energy do you have left?</h1>
      <p className="body-copy mt-3">This gives us a read on recovery, motion, and how heavy the day has felt.</p>
    </div>

    <label className="range-row">
      <span className="font-semibold">Energy ({form.energy}/10)</span>
      <div className="range-shell">
        <span>Spent</span>
        <input type="range" min="1" max="10" value={form.energy} onChange={(event) => setForm({ ...form, energy: Number(event.target.value) })} className="range-input" />
        <span>Full</span>
      </div>
    </label>

    <div>
      <p className="font-semibold">Movement</p>
      <div className="inline-option-grid mt-3">
        {[
          { value: "none", label: "Very little" },
          { value: "light", label: "Light movement" },
          { value: "moderate", label: "Moderate movement" },
          { value: "intense", label: "A lot of movement" }
        ].map((option) => (
          <button
            key={option.value}
            type="button"
            className="preference-card"
            data-active={form.activity === option.value}
            onClick={() => setForm({ ...form, activity: option.value as CheckInInput["activity"] })}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>

    <div>
      <p className="font-semibold">Workload</p>
      <div className="inline-option-grid mt-3">
        {[
          { value: "light", label: "Light" },
          { value: "moderate", label: "Manageable" },
          { value: "heavy", label: "Heavy" },
          { value: "overwhelming", label: "Overwhelming" }
        ].map((option) => (
          <button
            key={option.value}
            type="button"
            className="preference-card"
            data-active={form.workload === option.value}
            onClick={() => setForm({ ...form, workload: option.value as CheckInInput["workload"] })}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  </div>
);

const StressorsStep = ({
  form,
  setForm,
  selectedStressors,
  setSelectedStressors
}: {
  form: CheckInInput;
  setForm: (value: CheckInInput) => void;
  selectedStressors: string[];
  setSelectedStressors: (value: string[]) => void;
}) => (
  <div className="space-y-6">
    <div>
      <p className="eyebrow eyebrow--soft">Step 4</p>
      <h1 className="section-title mt-3">What is asking the most from you?</h1>
      <p className="body-copy mt-3">Pick any themes that feel present. You can add nuance on the next step.</p>
    </div>

    <StressorChips
      options={stressorOptions}
      value={selectedStressors}
      onToggle={(value) => setSelectedStressors(
        selectedStressors.includes(value)
          ? selectedStressors.filter((item) => item !== value)
          : [...selectedStressors, value]
      )}
    />

    <div>
      <p className="font-semibold">How many meetings did you have?</p>
      <div className="inline-option-grid mt-3">
        {[
          { value: "0", label: "0" },
          { value: "1-2", label: "1-2" },
          { value: "3-5", label: "3-5" },
          { value: "6+", label: "6+" }
        ].map((option) => (
          <button
            key={option.value}
            type="button"
            className="preference-card"
            data-active={form.meetingCount === option.value}
            onClick={() => setForm({ ...form, meetingCount: option.value as NonNullable<CheckInInput["meetingCount"]> })}
          >
            {option.label}
          </button>
        ))}
      </div>
      <button type="button" onClick={() => setForm({ ...form, meetingCount: null })} className="mt-3 text-sm font-semibold underline">
        Skip meetings for now
      </button>
    </div>
  </div>
);

const ReflectionStep = ({
  reflection,
  setReflection,
  sessionLabel,
  selectedStressors
}: {
  reflection: string;
  setReflection: (value: string) => void;
  sessionLabel: string;
  selectedStressors: string[];
}) => (
  <div className="space-y-6">
    <div>
      <p className="eyebrow eyebrow--soft">Step 5</p>
      <h1 className="section-title mt-3">What feels most important to name?</h1>
      <p className="body-copy mt-3">A few honest lines can make the score feel more like context than a verdict.</p>
    </div>

    <textarea
      className="textarea-field"
      placeholder="What happened, what landed hardest, or what would help after this?"
      value={reflection}
      onChange={(event) => setReflection(event.target.value)}
    />

    <TipCard
      title={`${sessionLabel.charAt(0).toUpperCase()}${sessionLabel.slice(1)} check-in summary`}
      copy={selectedStressors.length ? `Stressors noted: ${selectedStressors.join(", ")}.` : "No stressors selected yet. That is okay too."}
    />
  </div>
);

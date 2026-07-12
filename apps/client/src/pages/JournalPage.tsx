import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import type { CheckInRecord, JournalEntry } from "@pebble/shared";
import { EmptyState, JournalCard, SparkleIcon, StaggerItem, TipCard } from "../components/mindcheck-ui";
import { api } from "../lib/api";
import { prettyDate, todayKey } from "../lib/date";
import { getGuestCheckInRecords, getGuestJournalRecords } from "../lib/guest";
import { getJournalToneMap, journalPromptOptions } from "../lib/design-system";
import { storage } from "../lib/storage";
import { useAuth } from "../store/auth";

const weeklyPrompt = "What was the hardest moment this week, and what helped?";

const getLatestPrompt = () => {
  const raw = sessionStorage.getItem("pebble.latest-result");
  if (!raw) return "What feels most important to name tonight?";

  try {
    return (JSON.parse(raw) as { prompt?: string }).prompt ?? "What feels most important to name tonight?";
  } catch {
    return "What feels most important to name tonight?";
  }
};

const guestHistory = (entryType: JournalEntry["entryType"]) => getGuestJournalRecords()
  .filter((item) => item.entryType === entryType)
  .sort((a, b) => b.date.localeCompare(a.date));

export const JournalPage = () => {
  const [searchParams] = useSearchParams();
  const entryType = (searchParams.get("entryType") === "weekly_reflection" ? "weekly_reflection" : "daily") as JournalEntry["entryType"];
  const { user } = useAuth();
  const initialGuestHistory = useMemo(() => guestHistory(entryType), [entryType]);
  const [history, setHistory] = useState<JournalEntry[]>(initialGuestHistory);
  const [checkInHistory, setCheckInHistory] = useState<CheckInRecord[]>(user ? [] : getGuestCheckInRecords());
  const [entry, setEntry] = useState<JournalEntry | null>(initialGuestHistory.find((item) => item.date === todayKey()) ?? null);
  const [activeDate, setActiveDate] = useState(todayKey());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      const nextHistory = guestHistory(entryType);
      setHistory(nextHistory);
      setCheckInHistory(getGuestCheckInRecords());
      setEntry(nextHistory.find((item) => item.date === todayKey()) ?? null);
      return;
    }

    const load = async () => {
      const checkinRequest = api.getCheckInHistory();
      if (entryType === "weekly_reflection") {
        const [historyResponse, todayResponse, checkinResponse] = await Promise.all([
          api.getWeeklyReflections(),
          api.getTodayJournal(todayKey(), "weekly_reflection"),
          checkinRequest
        ]);
        setHistory(historyResponse.reflections);
        setCheckInHistory(checkinResponse.checkIns);
        setEntry(todayResponse.journal);
        return;
      }

      const [historyResponse, todayResponse, checkinResponse] = await Promise.all([
        api.getJournalHistory(),
        api.getTodayJournal(todayKey(), "daily"),
        checkinRequest
      ]);
      setHistory(historyResponse.journals);
      setCheckInHistory(checkinResponse.checkIns);
      setEntry(todayResponse.journal);
    };

    void load();
  }, [entryType, user?.id]);

  const fallbackPrompt = entryType === "weekly_reflection" ? weeklyPrompt : getLatestPrompt();
  const toneMap = useMemo(() => getJournalToneMap(checkInHistory), [checkInHistory]);

  const createEntry = (prompt = fallbackPrompt) => ({
    id: `${entryType}-${todayKey()}`,
    userId: user?.id ?? "guest",
    date: todayKey(),
    prompt,
    content: "",
    wordCount: 0,
    entryType,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  } satisfies JournalEntry);

  const openFreshEntry = () => {
    const todayEntry = history.find((item) => item.date === todayKey()) ?? entry;
    setActiveDate(todayKey());
    setEntry(todayEntry ?? createEntry());
  };

  const save = async () => {
    if (!entry) return;
    setSaving(true);
    setError("");

    try {
      if (user) {
        const response = await api.saveJournal({ date: entry.date, prompt: entry.prompt, content: entry.content, entryType });
        setEntry(response.journal);
        setHistory((current) => [response.journal, ...current.filter((item) => item.id !== response.journal.id)]);
        setActiveDate(response.journal.date);
      } else {
        const wordCount = entry.content.trim() ? entry.content.trim().split(/\s+/).length : 0;
        storage.saveGuestJournal({ date: entry.date, prompt: entry.prompt, content: entry.content, wordCount, entryType });
        const nextHistory = guestHistory(entryType);
        setHistory(nextHistory);
        setEntry(nextHistory.find((item) => item.date === entry.date) ?? { ...entry, wordCount });
        setActiveDate(entry.date);
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Journal could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const promptOptions = [entry?.prompt ?? fallbackPrompt, ...journalPromptOptions].filter((value, index, values) => values.indexOf(value) === index).slice(0, 3);

  return (
    <div className="page-stack">
      <section className="content-split">
        <StaggerItem className="surface-panel surface-section" delay={0}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow eyebrow--soft">{entryType === "weekly_reflection" ? "Weekly reflection" : "Journal"}</p>
              <h1 className="section-title mt-3">{entryType === "weekly_reflection" ? "Reflection timeline" : "Entry cards"}</h1>
            </div>
            {entryType === "weekly_reflection" ? <Link to="/reflections" className="button-secondary">Timeline</Link> : null}
          </div>

          <div className="mt-6 grid gap-3">
            {history.length ? history.map((item) => (
              <JournalCard
                key={item.id}
                dateLabel={prettyDate(item.date)}
                preview={item.content || item.prompt}
                active={item.date === activeDate}
                tone={toneMap.get(item.date) ?? "mid"}
                onClick={() => {
                  setActiveDate(item.date);
                  setEntry(item);
                }}
              />
            )) : (
              <EmptyState
                title="No entries yet"
                copy="Your first entry can be short. A sentence is enough."
                action={<button type="button" onClick={openFreshEntry} className="button-secondary">Start writing</button>}
              />
            )}
          </div>
        </StaggerItem>

        <StaggerItem className="surface-card surface-section" delay={150}>
          <p className="eyebrow eyebrow--soft">{entryType === "weekly_reflection" ? "Reflection editor" : "Journal editor"}</p>
          <h2 className="section-title mt-3">{entryType === "weekly_reflection" ? "Hold the week in one place" : "Write what feels true right now"}</h2>

          <div className="mt-5 grid gap-3">
            {promptOptions.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="preference-card"
                data-active={(entry?.prompt ?? fallbackPrompt) === prompt}
                onClick={() => setEntry((current) => current ? { ...current, prompt } : createEntry(prompt))}
              >
                {prompt}
              </button>
            ))}
          </div>

          <div className="mt-5">
            <TipCard title="Prompt in focus" copy={entry?.prompt ?? fallbackPrompt} />
          </div>

          <textarea
            className="textarea-field mt-5"
            placeholder={entryType === "weekly_reflection" ? "Name the moment that felt hardest, then what helped you through it." : "Write whatever feels true right now."}
            value={entry?.content ?? ""}
            onChange={(event) => setEntry((current) => {
              const content = event.target.value;
              const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
              return current ? {
                ...current,
                content,
                wordCount
              } : {
                ...createEntry(),
                content,
                wordCount
              };
            })}
          />

          {error ? <p className="mt-4 text-sm" style={{ color: "var(--danger)" }}>{error}</p> : null}

          <div className="mt-4 flex items-center justify-between gap-3 text-sm text-muted">
            <span>{entry?.wordCount ?? 0} words</span>
            <button onClick={save} disabled={saving || !entry} className="button-primary">
              {saving ? "Saving..." : entryType === "weekly_reflection" ? "Save reflection" : "Save journal"}
            </button>
          </div>
        </StaggerItem>
      </section>

      <button type="button" className="fab-button" onClick={openFreshEntry} aria-label="Create a new journal entry">
        <SparkleIcon />
        <span>New entry</span>
      </button>
    </div>
  );
};

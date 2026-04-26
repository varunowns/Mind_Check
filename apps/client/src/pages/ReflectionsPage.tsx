import { useEffect, useState } from "react";
import type { JournalEntry } from "@mindcheck/shared";
import { EmptyState, StaggerItem, TipCard } from "../components/mindcheck-ui";
import { api } from "../lib/api";
import { getGuestJournalRecords } from "../lib/guest";
import { prettyDate } from "../lib/date";
import { useAuth } from "../store/auth";

export const ReflectionsPage = () => {
  const { user } = useAuth();
  const [reflections, setReflections] = useState<JournalEntry[]>(user ? [] : getGuestJournalRecords().filter((item) => item.entryType === "weekly_reflection"));

  useEffect(() => {
    if (!user) return;
    api.getWeeklyReflections().then((response) => setReflections(response.reflections));
  }, [user]);

  return (
    <div className="page-stack">
      <StaggerItem className="surface-panel surface-section" delay={0}>
        <p className="eyebrow eyebrow--soft">Weekly reflections</p>
        <h1 className="headline mt-4">A timeline of what felt hard, and what helped.</h1>
      </StaggerItem>

      <div className="grid gap-4">
        {reflections.length ? reflections.map((reflection) => (
          <StaggerItem key={reflection.id} className="surface-card surface-section" delay={150}>
            <TipCard
              title={prettyDate(reflection.date)}
              copy={reflection.prompt}
            />
            <p className="mt-4 whitespace-pre-wrap text-sm text-muted">{reflection.content || "No reflection saved for this week yet."}</p>
          </StaggerItem>
        )) : (
          <EmptyState title="No reflections yet" copy="Weekly reflections will appear here after the first Sunday check-in prompt is completed." />
        )}
      </div>
    </div>
  );
};

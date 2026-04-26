import { describe, expect, it } from "vitest";
import { createDefaultCheckIn, finalizeCheckIn, hydrateCheckInDraft } from "./checkins";

describe("check-in helpers", () => {
  it("creates a valid default payload for the current schema", () => {
    const value = createDefaultCheckIn(new Date("2026-03-28T09:30:45+05:30"));

    expect(value).toMatchObject({
      date: "2026-03-28",
      session: "full",
      meetingCount: null
    });
    expect(value.submittedAtLocal).toBe("2026-03-28T09:30:45+05:30");
  });

  it("hydrates older drafts with schema defaults", () => {
    const value = hydrateCheckInDraft({ mood: "happy", energy: 8 }, new Date("2026-03-28T10:00:00+05:30"));

    expect(value).toMatchObject({
      date: "2026-03-28",
      session: "full",
      meetingCount: null,
      mood: "happy",
      energy: 8
    });
  });

  it("refreshes the local submission time before save", () => {
    const draft = hydrateCheckInDraft({ submittedAtLocal: "2026-03-27T20:00:00+05:30" }, new Date("2026-03-28T10:00:00+05:30"));
    const value = finalizeCheckIn(draft, new Date("2026-03-28T11:15:30+05:30"));

    expect(value.submittedAtLocal).toBe("2026-03-28T11:15:30+05:30");
    expect(value.session).toBe("full");
    expect(value.meetingCount).toBeNull();
  });
});

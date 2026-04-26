// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { SettingsPage } from "./SettingsPage";

vi.mock("../lib/api", () => ({
  api: {
    saveProfile: vi.fn(),
    saveSettings: vi.fn()
  }
}));

vi.mock("../lib/storage", () => ({
  guestSettingsDefaults: {
    checkinMode: "once",
    recommendedSleepHours: 8,
    lateThreshold: "21:00"
  },
  storage: {
    getGuestSettings: () => ({
      checkinMode: "once",
      recommendedSleepHours: 8,
      lateThreshold: "21:00"
    }),
    saveGuestSettings: vi.fn()
  }
}));

vi.mock("../store/auth", () => ({
  useAuth: () => ({
    user: {
      id: "user-1",
      name: "Ava Stone",
      email: "ava@example.com",
      phoneNumber: "+91 99999 99999",
      region: "West Bengal",
      city: "Kolkata",
      createdAt: "2026-03-28T10:00:00.000Z",
      checkinMode: "once",
      recommendedSleepHours: 8,
      lateThreshold: "21:00",
      streakShields: 1,
      burnoutActive: false
    },
    updateUser: vi.fn()
  })
}));

describe("SettingsPage", () => {
  it("shows editable profile fields for logged in users", () => {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );

    expect(screen.getByDisplayValue("ava@example.com")).toBeTruthy();
    expect(screen.getByDisplayValue("+91 99999 99999")).toBeTruthy();
    expect(screen.getByDisplayValue("West Bengal")).toBeTruthy();
    expect(screen.getByDisplayValue("Kolkata")).toBeTruthy();
  });
});

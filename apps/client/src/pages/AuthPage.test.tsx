// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { AuthPage } from "./AuthPage";

vi.mock("../lib/api", () => ({
  api: {
    signup: vi.fn(),
    login: vi.fn(),
    syncLocalData: vi.fn()
  }
}));

vi.mock("../lib/storage", () => ({
  storage: {
    getSyncPayload: () => ({ checkIns: [], journals: [] }),
    clearGuestData: vi.fn()
  }
}));

vi.mock("../store/auth", () => ({
  useAuth: () => ({
    setSession: vi.fn(),
    user: null
  })
}));

describe("AuthPage", () => {
  it("keeps standard email characters in the signup form", () => {
    render(
      <MemoryRouter>
        <AuthPage mode="signup" />
      </MemoryRouter>
    );

    const emailField = screen.getByPlaceholderText(/email/i) as HTMLInputElement;
    fireEvent.change(emailField, { target: { value: "user.name+test@example.com" } });

    expect(emailField.value).toBe("user.name+test@example.com");
  });
});

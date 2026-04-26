// @vitest-environment jsdom
import type { PropsWithChildren } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BreathePage } from "./BreathePage";

vi.mock("recharts", () => {
  const Wrapper = ({ children }: PropsWithChildren) => <div>{children}</div>;

  return {
    ResponsiveContainer: Wrapper,
    BarChart: Wrapper,
    CartesianGrid: () => null,
    Tooltip: () => null,
    XAxis: () => null,
    YAxis: () => null,
    Bar: () => null
  };
});

describe("BreathePage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("resets the active timer when the user switches exercise", () => {
    render(<BreathePage />);

    fireEvent.click(screen.getByRole("button", { name: /start session/i }));

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.getByText(/0:03 elapsed/i)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /4-7-8/i }));

    expect(screen.getByText(/0:00 elapsed/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: /start session/i })).toBeTruthy();
    expect(screen.getByText(/session reset for the new exercise/i)).toBeTruthy();
  });
});

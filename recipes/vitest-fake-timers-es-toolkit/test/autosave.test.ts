import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createAutosave, createScrollTracker, fetchWithRetry, stamp } from "../src/autosave.ts";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("debounced autosave", () => {
  it("saves once after typing pauses", () => {
    const save = vi.fn();
    const auto = createAutosave(save, 500);
    auto.change("h");
    vi.advanceTimersByTime(200);
    auto.change("he");
    vi.advanceTimersByTime(200);
    auto.change("hey");
    expect(save).not.toHaveBeenCalled();
    vi.advanceTimersByTime(500);
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith("hey");
  });

  it("flush saves now and cancel drops a pending save", () => {
    const save = vi.fn();
    const auto = createAutosave(save, 500);
    auto.change("draft");
    auto.flush();
    expect(save).toHaveBeenCalledWith("draft");
    auto.change("lost");
    auto.cancel();
    vi.runAllTimers();
    expect(save).toHaveBeenCalledTimes(1);
  });
});

describe("throttled scroll tracking", () => {
  it("reports the leading call and the last call per window", () => {
    const report = vi.fn();
    const onScroll = createScrollTracker(report, 100);
    for (let y = 1; y <= 5; y++) onScroll(y * 10);
    expect(report).toHaveBeenCalledTimes(1);
    expect(report).toHaveBeenLastCalledWith(10);
    vi.advanceTimersByTime(100);
    expect(report).toHaveBeenCalledTimes(2);
    expect(report).toHaveBeenLastCalledWith(50);
  });
});

describe("async timers", () => {
  it("retries with delay using advanceTimersByTimeAsync", async () => {
    let calls = 0;
    const p = fetchWithRetry(async () => {
      calls++;
      if (calls < 3) throw new Error("flaky");
      return "ok";
    }, 3, 1000);
    await vi.advanceTimersByTimeAsync(2000);
    await expect(p).resolves.toBe("ok");
    expect(calls).toBe(3);
  });

  it("setSystemTime controls Date while delays are skipped", async () => {
    vi.setSystemTime(new Date("2026-10-15T12:00:00Z"));
    const p = stamp("job", 60_000);
    await vi.advanceTimersByTimeAsync(60_000);
    await expect(p).resolves.toBe("job at 2026-10-15T12:01:00.000Z");
  });
});

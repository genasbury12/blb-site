import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AutosaveController, DEBOUNCE_MS, type SaveFn, type SaveState } from "./use-autosave";

describe("worksheet autosave controller", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("debounces per field and sends one merged request", async () => {
    const save = vi.fn<SaveFn>(async () => ({ ok: true, savedAt: "2026-11-03T10:00:00Z" }));
    const states: SaveState[] = [];
    const c = new AutosaveController("ws", save, (s) => states.push(s));
    c.queue("q1", "a");
    c.queue("q1", "ab");
    c.queue("q2", "x");
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS - 1);
    expect(save).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(5);
    await vi.advanceTimersByTimeAsync(0);
    expect(save).toHaveBeenCalledTimes(1);
    expect(save.mock.calls[0]![0].patch).toEqual({ q1: "ab", q2: "x" });
    expect(states.at(-1)).toEqual({ kind: "saved", at: "2026-11-03T10:00:00Z" });
  });

  it("keeps one request in flight and queues the latest change", async () => {
    let release!: () => void;
    const save = vi.fn<SaveFn>().mockImplementationOnce(() => new Promise((r) => (release = () => r({ ok: true, savedAt: "t1" })))).mockResolvedValue({ ok: true, savedAt: "t2" });
    const c = new AutosaveController("ws", save, () => {});
    c.queue("q1", "first");
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS + 1);
    c.queue("q1", "second");
    c.queue("q1", "third");
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS + 1);
    expect(save).toHaveBeenCalledTimes(1);
    release();
    await vi.advanceTimersByTimeAsync(1);
    expect(save).toHaveBeenCalledTimes(2);
    expect(save.mock.calls[1]![0].patch).toEqual({ q1: "third" });
  });

  it("retries failures with backoff without losing newer edits", async () => {
    const save = vi
      .fn<SaveFn>()
      .mockResolvedValueOnce({ ok: false, error: "Not saved, retrying", retry: true })
      .mockResolvedValue({ ok: true, savedAt: "t" });
    const states: SaveState[] = [];
    const c = new AutosaveController("ws", save, (s) => states.push(s));
    c.queue("q1", "old");
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS + 1);
    expect(states.at(-1)?.kind).toBe("retrying");
    c.queue("q2", "new");
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS + 1);
    await vi.advanceTimersByTimeAsync(1000);
    expect(save).toHaveBeenLastCalledWith({ slug: "ws", patch: { q1: "old", q2: "new" } });
    expect(states.at(-1)?.kind).toBe("saved");
    expect(c.hasUnsaved()).toBe(false);
  });

  it("stops on a validation error instead of retrying forever", async () => {
    const save = vi.fn<SaveFn>().mockResolvedValue({ ok: false, error: "Keep this under 160 characters", retry: false });
    const states: SaveState[] = [];
    const c = new AutosaveController("ws", save, (s) => states.push(s));
    c.queue("idea_A", "x");
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS + 60000);
    expect(save).toHaveBeenCalledTimes(1);
    expect(states.at(-1)).toEqual({ kind: "error", message: "Keep this under 160 characters" });
  });

  it("settle sends answers still in the debounce pause right away (before Complete)", async () => {
    const save = vi.fn<SaveFn>(async () => ({ ok: true, savedAt: "t" }));
    const c = new AutosaveController("ws", save, () => {});
    c.queue("q2", "two");
    c.queue("q3", "three");
    const done = c.settle();
    await vi.advanceTimersByTimeAsync(0);
    expect(await done).toBe(true);
    expect(save).toHaveBeenCalledTimes(1);
    expect(save.mock.calls[0]![0].patch).toEqual({ q2: "two", q3: "three" });
    // The cancelled debounce timers do not send them a second time.
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS * 2);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("settle waits for a request already in flight, then sends what is left", async () => {
    let release!: () => void;
    const save = vi.fn<SaveFn>().mockImplementationOnce(() => new Promise((r) => (release = () => r({ ok: true, savedAt: "t1" })))).mockResolvedValue({ ok: true, savedAt: "t2" });
    const c = new AutosaveController("ws", save, () => {});
    c.queue("q1", "one");
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS + 1);
    c.queue("q2", "two");
    const done = c.settle();
    await vi.advanceTimersByTimeAsync(100);
    release();
    await vi.advanceTimersByTimeAsync(100);
    expect(await done).toBe(true);
    expect(save.mock.calls.map((x) => x[0].patch)).toEqual([{ q1: "one" }, { q2: "two" }]);
  });

  it("settle reports a failed save so Complete is not sent", async () => {
    const save = vi.fn<SaveFn>(async () => ({ ok: false, error: "offline", retry: true }));
    const c = new AutosaveController("ws", save, () => {});
    c.queue("q1", "one");
    const done = c.settle();
    await vi.advanceTimersByTimeAsync(0);
    expect(await done).toBe(false);
    c.dispose();
  });
});

import { useEffect, useRef } from 'react';

/**
 * Replacement for `st.fragment(run_every=…)`: runs `task` immediately whenever `resetKey` or the
 * interval changes and then every `intervalMs` while it is non-null. Ticks never overlap — the
 * next one is scheduled only after the previous finished — and the in-flight request is aborted
 * on change/unmount.
 */
export function usePolling(
  task: (signal: AbortSignal) => Promise<void>,
  intervalMs: number | null,
  resetKey: string,
): void {
  const taskRef = useRef(task);
  useEffect(() => {
    taskRef.current = task;
  });

  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;

    const tick = async () => {
      try {
        await taskRef.current(controller.signal);
      } catch {
        // Task errors are surfaced by the task itself; polling continues.
      }
      if (!controller.signal.aborted && intervalMs !== null) {
        timer = setTimeout(tick, intervalMs);
      }
    };
    void tick();

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [intervalMs, resetKey]);
}

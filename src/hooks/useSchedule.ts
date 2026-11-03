import { useCallback, useEffect, useState } from "react";
import type { UnifiedScheduleResponse } from "@/lib/schedule";

const REFRESH_MS = 5 * 60 * 1000; // re-fetch the schedule
const TICK_MS = 30 * 1000; // move the "on now" marker
const TIMEOUT_MS = 5000; // same budget as the embed player

/**
 * Loads the unified schedule from /api/schedule (AzuraCast, server-side) and
 * keeps a ticking clock so "on now" moves without a re-fetch.
 * `now` is null until mounted, which avoids an SSR hydration mismatch.
 */
export function useSchedule() {
  const [data, setData] = useState<UnifiedScheduleResponse | null>(null);
  const [error, setError] = useState(false);
  const [now, setNow] = useState<number | null>(null);

  const load = useCallback(async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch("/api/schedule", { signal: controller.signal });
      if (!res.ok) throw new Error(`Schedule request failed (${res.status})`);
      setData((await res.json()) as UnifiedScheduleResponse);
      setError(false);
    } catch (err) {
      console.warn("Failed to load schedule:", err);
      setError(true);
    } finally {
      clearTimeout(timeout);
    }
  }, []);

  useEffect(() => {
    load();
    const refresh = setInterval(load, REFRESH_MS);
    return () => clearInterval(refresh);
  }, [load]);

  useEffect(() => {
    setNow(Date.now());
    const tick = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(tick);
  }, []);

  return { data, error, now, reload: load };
}

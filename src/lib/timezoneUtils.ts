/**
 * Timezone utilities for Pacific Time (America/Los_Angeles) conversion
 * AzuraCast uses minutes-since-midnight (0-1439) in Pacific Time
 * 
 * IMPORTANT: All time inputs should be entered directly in Pacific Time.
 * No automatic timezone conversion is performed.
 */

const PACIFIC_TZ = "America/Los_Angeles";

/**
 * Convert time string (HH:MM) to minutes since midnight
 * Input is assumed to be in Pacific Time
 */
export function localTimeToPackificMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert minutes since midnight to time string (HH:MM)
 * Output is in Pacific Time
 */
export function pacificMinutesToLocalTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

/**
 * Format a date for AzuraCast (YYYY-MM-DD)
 */
export function formatDateForAzuraCast(date: Date | string | null | undefined): string | null {
  if (!date) return null;
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return null;
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  
  return `${year}-${month}-${day}`;
}

/**
 * Get current time in Pacific Time for display
 */
export function getCurrentPacificTime(): string {
  return new Date().toLocaleString("en-US", {
    timeZone: PACIFIC_TZ,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short"
  });
}
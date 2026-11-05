/**
 * Timezone utilities for Pacific Time (America/Los_Angeles) conversion
 * AzuraCast uses Pacific Time for all schedule operations
 */

const PACIFIC_TZ = "America/Los_Angeles";

/**
 * Convert a local time string (HH:MM) to minutes since midnight in Pacific Time
 */
export function localTimeToPackificMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number);
  
  // Create a date with today's date and the specified time in the browser's timezone
  const now = new Date();
  const localDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
  
  // Format in Pacific Time to get the equivalent PT time
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: PACIFIC_TZ,
    hour: "numeric",
    minute: "numeric",
    hour12: false
  });
  
  const parts = formatter.formatToParts(localDate);
  const ptHours = parseInt(parts.find(p => p.type === "hour")?.value || "0", 10);
  const ptMinutes = parseInt(parts.find(p => p.type === "minute")?.value || "0", 10);
  
  return ptHours * 60 + ptMinutes;
}

/**
 * Convert Pacific Time minutes to local time string (HH:MM)
 */
export function pacificMinutesToLocalTime(minutes: number): string {
  const ptHours = Math.floor(minutes / 60);
  const ptMinutes = minutes % 60;
  
  // Create a date in Pacific Time
  const now = new Date();
  const ptDate = new Date(now.toLocaleString("en-US", { timeZone: PACIFIC_TZ }));
  ptDate.setHours(ptHours, ptMinutes, 0, 0);
  
  // Get the PT date as ISO then parse to local
  const ptIso = ptDate.toISOString();
  const localDate = new Date(ptIso);
  
  // Return local time in HH:MM format
  const localHours = localDate.getHours();
  const localMinutes = localDate.getMinutes();
  
  return `${String(localHours).padStart(2, "0")}:${String(localMinutes).padStart(2, "0")}`;
}

/**
 * Format a date for AzuraCast (YYYY-MM-DD)
 */
export function formatDateForAzuraCast(date: Date | string | null): string | null {
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
/**
 * Formats a Date as a local `YYYY-MM-DD` string.
 *
 * Do NOT use `date.toISOString().slice(0, 10)`, that converts to UTC and
 * shifts the day back in positive timezones (e.g. picking the 13th at +6
 * stores the 12th). This helper uses local time parts.
 */
export function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Parses a `YYYY-MM-DD` string into a local Date (midnight local). */
export function parseLocalDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

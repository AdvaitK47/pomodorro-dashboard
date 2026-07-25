// lib/dateUtils.ts
//
// IMPORTANT: Never use `date.toISOString().split("T")[0]` to get a
// "YYYY-MM-DD" string for calendar-day comparisons (today/yesterday,
// session grouping, streaks, weekly/monthly charts, etc).
//
// `.toISOString()` always converts to UTC first. For any timezone ahead
// of UTC (e.g. IST, UTC+5:30), local midnight becomes the *previous*
// day in UTC, silently shifting every date-string back by one day.
// For timezones behind UTC, late-evening local times can shift forward
// a day instead. Either way, day-bucketing breaks.
//
// `getFullYear()` / `getMonth()` / `getDate()` are local-timezone
// getters and don't have this problem — use this helper instead,
// everywhere a calendar-day string is needed.
export function toLocalDateStr(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

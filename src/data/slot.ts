/** The nearest half hour that is not in the past, in the visitor's own time zone: 8:15 → 8:30, 8:30 → 8:30, 8:31 → 9:00. Used for every default date/time in the site. */
export function nextHalfHour(now: number = Date.now()): number {
  const d = new Date(now);
  const hadSeconds = d.getSeconds() > 0 || d.getMilliseconds() > 0;
  d.setSeconds(0, 0);
  if (hadSeconds) d.setMinutes(d.getMinutes() + 1);
  const r = d.getMinutes() % 30;
  if (r) d.setMinutes(d.getMinutes() + 30 - r);
  return d.getTime();
}
/** the same moment as a local "HH:mm" */
export const nextHalfHourHm = (now: number = Date.now()): string => { const d = new Date(nextHalfHour(now)); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };

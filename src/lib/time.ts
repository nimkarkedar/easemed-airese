/** A time of day on a 12-hour clock, as the stop-time wheels show it. */
export type ClockTime = { hour: number; minute: number; period: 'AM' | 'PM' }; // hour 1–12

const DAY = 24 * 60;

/** Minutes since midnight. */
export const toMinutes = (t: ClockTime) => ((t.hour % 12) + (t.period === 'PM' ? 12 : 0)) * 60 + t.minute;

export function fromMinutes(minutes: number): ClockTime {
  const m = ((minutes % DAY) + DAY) % DAY;
  const h24 = Math.floor(m / 60);
  return { hour: h24 % 12 || 12, minute: m % 60, period: h24 < 12 ? 'AM' : 'PM' };
}

const nowMinutes = (now: Date) => now.getHours() * 60 + now.getMinutes();

/** The recommended stop time: 8 hours from now. */
export const eightHoursFrom = (now = new Date()) => fromMinutes(nowMinutes(now) + 8 * 60);

/** Minutes from now until the next time the clock shows `t` (1 to 24 hours). */
export function minutesUntil(t: ClockTime, now = new Date()) {
  const d = (toMinutes(t) - nowMinutes(now) + DAY) % DAY;
  return d === 0 ? DAY : d;
}

/** "6 hr 30 min", "8 hr", "45 min" (BRAND.md: plain durations). */
export function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return [h ? `${h} hr` : '', m ? `${m} min` : ''].filter(Boolean).join(' ') || '0 min';
}

/** "6:20 am" */
export const formatClock = (t: ClockTime) => `${t.hour}:${String(t.minute).padStart(2, '0')} ${t.period.toLowerCase()}`;

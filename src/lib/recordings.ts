import { formatClock, formatDuration, fromMinutes } from './time';

/**
 * Past nights and the overall insight, for the Recordings tab.
 *
 * Prototype: sample data, made relative to today so the list always looks current.
 * Engineering: read real recordings from the device. The insight must follow the escalation
 * ladder (docs/BRAND.md §3): each step only when the data supports it, thresholds set with Clinical.
 */
export type Night = { id: string; date: Date; startMinutes: number; minutes: number };

/** A night's recording, by the date it started. */
const SAMPLE: { daysAgo: number; start: number; minutes: number }[] = [
  { daysAgo: 1, start: 23 * 60 + 5, minutes: 480 },
  { daysAgo: 2, start: 22 * 60 + 40, minutes: 460 },
  { daysAgo: 3, start: 23 * 60 + 30, minutes: 415 },
  { daysAgo: 5, start: 23 * 60 + 10, minutes: 480 },
  { daysAgo: 6, start: 22 * 60 + 55, minutes: 452 },
  { daysAgo: 9, start: 23 * 60 + 45, minutes: 390 },
  { daysAgo: 12, start: 23 * 60, minutes: 480 },
  { daysAgo: 16, start: 22 * 60 + 30, minutes: 470 },
  { daysAgo: 21, start: 23 * 60 + 15, minutes: 445 },
  { daysAgo: 27, start: 23 * 60 + 20, minutes: 480 },
  { daysAgo: 34, start: 22 * 60 + 50, minutes: 425 },
  { daysAgo: 40, start: 23 * 60 + 5, minutes: 480 },
];

export function sampleNights(today = new Date()): Night[] {
  return SAMPLE.map(({ daysAgo, start, minutes }) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - daysAgo);
    const id = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return { id, date, startMinutes: start, minutes };
  });
}

/** A night by id; "latest" is the most recent (used by the demo menu). */
export function findNight(id: string): Night | undefined {
  const nights = sampleNights();
  return id === 'latest' ? nights[0] : nights.find((n) => n.id === id);
}

/** Nights grouped by month, newest first: [{ title: 'October 2026', nights }]. */
export function byMonth(nights: Night[]) {
  const groups: { title: string; nights: Night[] }[] = [];
  for (const night of nights) {
    const title = `${MONTHS_LONG[night.date.getMonth()]} ${night.date.getFullYear()}`;
    const last = groups[groups.length - 1];
    if (last?.title === title) last.nights.push(night);
    else groups.push({ title, nights: [night] });
  }
  return groups;
}

// Spelled out here rather than via toLocaleDateString, which differs by device ("Sept", no comma).
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** "Tue, 27 Jan" */
export const formatNightDate = (d: Date) => `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS_LONG[d.getMonth()].slice(0, 3)}`;

/** "8 hr of recording" */
export const formatRecorded = (minutes: number) => `${formatDuration(minutes)} of recording`;

/** "11:05 pm to 7:05 am" */
export const formatSpan = (n: Night) => `${formatClock(fromMinutes(n.startMinutes))} to ${formatClock(fromMinutes(n.startMinutes + n.minutes))}`;

/**
 * The one overall message at the top of Recordings: at most two lines, at most one action.
 * What shows depends on the data and climbs the escalation ladder (docs/BRAND.md §3) only as far
 * as the data supports. Engineering and Clinical set the thresholds.
 *
 * Prototype: a different idea on each load, so the PM can see the range. Sample numbers.
 */
export type InsightAction = 'listen' | 'callback' | 'share';
export type Insight = { id: string; step: string; text: string; action?: { label: string; kind: InsightAction } };

const IDEAS: ((firstName: string) => Insight)[] = [
  (name) => ({ id: 'steady', step: 'Quiet: nothing to act on', text: `${name ? `Hi ${name}. ` : ''}Your breathing was steady this week.` }),
  () => ({ id: 'better', step: 'Getting better', text: 'Your breathing was steadier this week than last.' }),
  () => ({ id: 'notice', step: '1 Notice', text: 'You snored for 42 min last night, mostly after 3 am.', action: { label: 'Have a listen', kind: 'listen' } }),
  () => ({ id: 'compare', step: '2 Compare', text: 'You snored more than usual on 3 nights this week.' }),
  () => ({ id: 'pattern', step: '3 Pattern + 5 Suggest', text: 'Paused breathing on 5 of 7 nights. Worth seeing a doctor.', action: { label: 'Book a callback', kind: 'callback' } }),
  () => ({ id: 'act', step: '6 Help them act', text: 'Your report is ready to share with a doctor.', action: { label: 'Share report', kind: 'share' } }),
  () => ({ id: 'no-data', step: 'No data', text: 'We couldn’t hear enough last night. Try your phone closer to the bed.' }),
  () => ({ id: 'build-up', step: 'Building up', text: 'Record 3 more nights for your first weekly summary.' }),
];

/** A different idea from last time (remembered in the browser session where possible). */
export function nextInsightIdea(firstName: string): Insight {
  let last = lastIdea;
  try {
    last = globalThis.sessionStorage?.getItem('airese.insight') ?? last;
  } catch {}
  const options = IDEAS.map((idea) => idea(firstName)).filter((i) => i.id !== last);
  const pick = options[Math.floor(Math.random() * options.length)];
  lastIdea = pick.id;
  try {
    globalThis.sessionStorage?.setItem('airese.insight', pick.id);
  } catch {}
  return pick;
}
let lastIdea: string | null = null;

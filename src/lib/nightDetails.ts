import { formatClock, formatDuration, fromMinutes } from './time';
import { sampleNights, type Night } from './recordings';

/**
 * Recording Details: what one night held. Shape follows the PRD (§17), trimmed to what the
 * prototype shows. Prototype: sample data, generated from the night's id so a night always
 * looks the same. Engineering: fill from on-device analysis; every insight needs a confidence
 * threshold (§18) and must never turn a low-confidence output into a health statement.
 */

/** How the page should read (PRD §14–16, §11). */
export type NightState =
  | 'processing' // analysis not finished: no cards yet
  | 'poor' // couldn't hear clearly: no scores
  | 'first' // first night: no personal comparison yet
  | 'steady' // ordinary night
  | 'unusual' // one night out of the ordinary
  | 'pattern'; // the same thing on many recent nights (ladder: pattern → suggest → act)

export type Intensity = 'light' | 'moderate' | 'loud' | 'veryLoud';
export type ClipType = 'Loud snoring' | 'Repeated snoring' | 'Light snoring' | 'Interrupted breathing';

/** Minutes are from the start of the recording. */
export type SnoreSegment = { start: number; end: number; intensity: Intensity };
export type Clip = { id: string; at: number; seconds: number; type: ClipType; peaks: number[] };

export type NightDetails = {
  night: Night;
  state: NightState;
  snoringMinutes: number;
  segments: SnoreSegment[];
  breathingEvents: number[]; // minute offsets
  sleepMinutes: number;
  awakenings: number;
  clips: Clip[]; // in time order
  featured: Clip[]; // the few that best explain the night (not just the loudest)
  averageDb: number;
  peakDb: number;
  intensityShare: Record<Intensity, number>; // % of snoring time
  restScore: number;
  soundScore: number;
  baseline: { snoringMinutes: number; breathingEvents: number; averageDb: number } | null; // null before there's history
  patternNights?: { of: number; seen: number }; // e.g. 5 of the last 7
  awake: { start: number; end: number }[]; // stretches that sounded awake or restless
  recent: { day: string; snoringMinutes: number; tonight: boolean }[]; // last 7 nights, oldest first (empty before there's history)
  bins: number[]; // snoring loudness in 3-minute steps across the night, 0 (none) to 1 (very loud)
  hourly: { label: string; minutes: number }[]; // snoring minutes in each hour of the recording
};

export const BIN_MINUTES = 3;

// Small, seeded random so each night is stable.
function seeded(id: string) {
  let h = 2166136261;
  for (const c of id) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const INTENSITIES: Intensity[] = ['light', 'moderate', 'loud', 'veryLoud'];

export function nightDetails(night: Night, state: NightState): NightDetails {
  const rand = seeded(night.id + state);
  const between = (a: number, b: number) => a + rand() * (b - a);
  const heavy = state === 'pattern' || state === 'unusual';

  // Snoring: mostly in the middle of the night (hours 2–6 of the recording).
  const segments: SnoreSegment[] = [];
  const count = heavy ? 9 : 6;
  for (let i = 0; i < count; i++) {
    const centre = between(night.minutes * 0.22, night.minutes * 0.8);
    const length = between(heavy ? 6 : 3, heavy ? 14 : 9);
    const level = Math.min(3, Math.floor(rand() * (heavy ? 4 : 2.6)));
    segments.push({ start: Math.round(centre), end: Math.round(centre + length), intensity: INTENSITIES[level] });
  }
  segments.sort((a, b) => a.start - b.start);
  for (let i = 1; i < segments.length; i++) if (segments[i].start <= segments[i - 1].end + 2) segments[i].start = segments[i - 1].end + 3; // keep a gap
  for (const s of segments) if (s.end <= s.start) s.end = s.start + 3;
  const snoringMinutes = segments.reduce((sum, s) => sum + (s.end - s.start), 0);

  // Breathing interruptions: inside snoring periods.
  const breathingCount = state === 'pattern' ? 16 : state === 'unusual' ? 11 : 4;
  const breathingEvents = Array.from({ length: breathingCount }, () => {
    const s = segments[Math.floor(rand() * segments.length)];
    return Math.round(between(s.start, s.end));
  }).sort((a, b) => a - b);

  // Clips: one per snoring period plus a few around breathing events; 12 in all.
  const clips: Clip[] = [];
  const peaks = () => Array.from({ length: 18 }, () => 0.25 + rand() * 0.75);
  segments.forEach((s, i) =>
    clips.push({
      id: `c${i}`,
      at: Math.round(between(s.start, s.end)),
      seconds: Math.round(between(14, 40)),
      type: s.intensity === 'light' ? 'Light snoring' : s.intensity === 'moderate' ? 'Repeated snoring' : 'Loud snoring',
      peaks: peaks(),
    }),
  );
  for (let i = 0; clips.length < 12 && i < breathingEvents.length; i += 2)
    clips.push({ id: `b${i}`, at: breathingEvents[i], seconds: Math.round(between(12, 24)), type: 'Interrupted breathing', peaks: peaks() });
  clips.sort((a, b) => a.at - b.at);

  // Featured: the clips that best explain the night: the loudest, a repeated stretch, and a breathing moment if any.
  const pick = (t: ClipType) => clips.find((c) => c.type === t);
  const featured = [pick('Loud snoring') ?? pick('Repeated snoring'), pick('Repeated snoring') ?? pick('Light snoring'), pick('Interrupted breathing')]
    .filter((c, i, all): c is Clip => !!c && all.indexOf(c) === i)
    .sort((a, b) => a.at - b.at);

  const share = INTENSITIES.map((k) => segments.filter((s) => s.intensity === k).reduce((n, s) => n + s.end - s.start, 0));
  const total = share.reduce((a, b) => a + b, 0) || 1;
  const intensityShare = Object.fromEntries(INTENSITIES.map((k, i) => [k, Math.round((share[i] / total) * 100)])) as Record<Intensity, number>;

  const firstNight = state === 'first';
  const awakenings = Math.round(between(1, heavy ? 5 : 3));
  const awake = Array.from({ length: awakenings }, () => {
    const start = Math.round(between(10, night.minutes - 30));
    return { start, end: start + Math.round(between(5, 14)) };
  }).sort((a, b) => a.start - b.start);
  const baselineSnoring = state === 'steady' ? Math.round(snoringMinutes * between(1.3, 1.7)) : Math.round(snoringMinutes * between(0.45, 0.65));
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const recent = firstNight
    ? []
    : Array.from({ length: 7 }, (_, i) => {
        const date = new Date(night.date.getFullYear(), night.date.getMonth(), night.date.getDate() - (6 - i));
        const tonight = i === 6;
        // Earlier nights sit around the usual; in a pattern most of them run high too.
        const level = state === 'pattern' && i % 3 !== 0 ? between(1.4, 1.9) : between(0.7, 1.3);
        return { day: DAYS[date.getDay()], snoringMinutes: tonight ? snoringMinutes : Math.round(baselineSnoring * level), tonight };
      });
  // Fine-grained loudness for the timeline: each snoring period, with a little natural variation.
  const LEVEL_VALUE: Record<Intensity, number> = { light: 0.35, moderate: 0.55, loud: 0.78, veryLoud: 0.95 };
  const bins = Array.from({ length: Math.ceil(night.minutes / BIN_MINUTES) }, (_, i) => {
    const m = i * BIN_MINUTES + BIN_MINUTES / 2;
    const s = segments.find((seg) => m >= seg.start && m < seg.end);
    return s ? Math.min(1, Math.max(0.15, LEVEL_VALUE[s.intensity] + (rand() - 0.5) * 0.3)) : 0;
  });
  const hourly = Array.from({ length: Math.ceil(night.minutes / 60) }, (_, h) => ({
    label: formatClock(fromMinutes(night.startMinutes + h * 60)).replace(/:\d\d/, ''),
    minutes: segments.reduce((n, seg) => n + Math.max(0, Math.min(seg.end, (h + 1) * 60) - Math.max(seg.start, h * 60)), 0),
  }));

  // The recent average is exactly the average of the earlier bars, so chart and numbers agree.
  const earlier = recent.filter((r) => !r.tonight);
  const usualSnoring = earlier.length ? Math.round(earlier.reduce((n, r) => n + r.snoringMinutes, 0) / earlier.length) : baselineSnoring;
  return {
    night,
    state,
    snoringMinutes,
    segments,
    breathingEvents,
    sleepMinutes: night.minutes - Math.round(between(12, 30)),
    awakenings,
    awake,
    recent,
    bins,
    hourly,
    clips,
    featured,
    averageDb: Math.round(between(heavy ? 48 : 42, heavy ? 56 : 49)),
    peakDb: Math.round(between(heavy ? 78 : 66, heavy ? 88 : 74)),
    intensityShare,
    restScore: Math.round(between(heavy ? 55 : 72, heavy ? 68 : 86)),
    soundScore: Math.round(between(heavy ? 58 : 24, heavy ? 78 : 44)),
    baseline: firstNight
      ? null
      : {
          snoringMinutes: usualSnoring,
          breathingEvents: state === 'steady' ? breathingCount + 3 : Math.max(3, breathingCount - 7),
          averageDb: Math.round(between(44, 50)),
        },
    patternNights: state === 'pattern' ? { of: 7, seen: 5 } : undefined,
  };
}

// ---------- Plain-language helpers ----------

export const clockAt = (d: NightDetails, minute: number) => formatClock(fromMinutes(d.night.startMinutes + minute));

/** "2 and 4 am": the two-hour window that held the most snoring. */
export function busiestWindow(d: NightDetails) {
  let best = 0;
  let bestStart = 0;
  for (let start = 0; start + 120 <= d.night.minutes; start += 15) {
    const sum = d.segments.reduce((n, s) => n + Math.max(0, Math.min(s.end, start + 120) - Math.max(s.start, start)), 0);
    if (sum > best) {
      best = sum;
      bestStart = start;
    }
  }
  // Round the window's start to the nearest hour on the clock, then name the two-hour span.
  const startClock = Math.round((d.night.startMinutes + bestStart) / 60) * 60;
  const a = fromMinutes(startClock);
  const b = fromMinutes(startClock + 120);
  const p = (t: typeof a) => t.period.toLowerCase();
  return p(a) === p(b) ? `${a.hour} and ${b.hour} ${p(b)}` : `${a.hour} ${p(a)} and ${b.hour} ${p(b)}`;
}

export type Trend = 'less' | 'same' | 'more';
export const trend = (value: number, usual: number): Trend => (value < usual * 0.8 ? 'less' : value > usual * 1.2 ? 'more' : 'same');
export const trendWords: Record<Trend, string> = { less: 'Less than usual', same: 'About usual', more: 'More than usual' };

/** Headline and the sentence or two under it (PRD §5). Plain, factual, calm. */
export function summary(d: NightDetails): { headline: string; body: string } {
  const snored = `You snored for ${formatDuration(d.snoringMinutes)}, mostly between ${busiestWindow(d)}.`;
  switch (d.state) {
    case 'first':
      return { headline: 'A first look at your night', body: snored };
    case 'unusual':
      return { headline: 'More snoring than usual', body: `${snored} That’s more than your recent nights.` };
    case 'pattern':
      return { headline: 'Worth a closer look', body: `${snored} Your breathing was interrupted often, as on most recent nights.` };
    default:
      return { headline: 'A steadier night', body: `${snored} Your breathing was steadier than on your recent nights.` };
  }
}

/** What this means (PRD §11): direct only as repeated evidence builds up. */
export function meaning(d: NightDetails): { title: string; body: string } | null {
  switch (d.state) {
    case 'steady':
      return { title: 'Nothing unusual stood out', body: 'Your snoring and breathing were close to your recent pattern. Keep recording so Airese can learn what’s typical for you.' };
    case 'unusual':
      return { title: 'Something to keep an eye on', body: 'You snored more and your breathing was less steady last night. One night alone doesn’t show a pattern.' };
    case 'pattern':
      return {
        title: 'This has been happening regularly',
        body: `Your breathing was interrupted often on ${d.patternNights?.seen} of your last ${d.patternNights?.of} recorded nights. This is worth discussing with a doctor.`,
      };
    default:
      return null;
  }
}

/** Plain explanations for L2 sheets. Exact definitions to come from Product, Engineering and Clinical. */
export const EXPLAIN = {
  clips: { title: 'Why these clips?', body: 'Airese picks the moments that best explain your night, not just the loudest ones: a loud stretch, a repeated one, and any time your breathing was interrupted.' },
  breathing: { title: 'Breathing interruptions', body: 'Moments when your breathing sounded like it paused or became uneven while you snored. Airese counts them; it doesn’t diagnose anything.' },
  usual: { title: 'What “usual” means', body: 'Airese compares this night with your own recent nights, not with other people. “About usual” means within a fifth of your recent average.' },
  deciding: { title: 'How Airese decides what to say', body: 'One night alone doesn’t show a pattern. Airese only suggests talking to someone when the same thing shows up again and again.' },
  privacy: { title: 'Private by design', body: 'Airese analyses your sleep sounds on your phone. Your recordings stay on your device, and you choose if and when to share anything.' },
  restScore: { title: 'Rest Score', body: 'A summary of how settled your night sounded: how long you slept, and how often snoring or waking broke it up.' },
  soundScore: { title: 'Sound Score', body: 'A summary of how much snoring Airese heard and how intense it was during the recording. Lower is quieter.' },
  snoring: { title: 'Snoring', body: 'The total time Airese heard snoring, and how much of the recording that was.' },
  loudness: { title: 'Sound levels', body: 'How loud the snoring was, measured by your phone’s microphone. Phones differ, so compare nights rather than reading the numbers on their own.' },
  sleep: { title: 'Estimated sleep', body: 'Recording time minus the stretches where you sounded awake or restless. An estimate from sound alone.' },
  efficiency: { title: 'Sleep efficiency', body: 'How much of the recording you spent asleep, as a percentage. An estimate from sound alone.' },
};
export type ExplainKey = keyof typeof EXPLAIN;

export const INTENSITY_LABEL: Record<Intensity, string> = { light: 'Light', moderate: 'Moderate', loud: 'Loud', veryLoud: 'Very loud' };

/** "Mostly light to moderate" + louder periods, for the L1 loudness line. */
export function loudnessLine(d: NightDetails) {
  const loud = d.segments.filter((s) => s.intensity === 'loud' || s.intensity === 'veryLoud').length;
  const quiet = d.intensityShare.light + d.intensityShare.moderate;
  const mostly = quiet >= 60 ? 'Mostly light to moderate' : 'Often loud';
  return loud ? `${mostly} · ${loud} louder ${loud === 1 ? 'period' : 'periods'}` : mostly;
}

/**
 * Prototype: what each sample night shows, for the Recordings list and the night page.
 * The oldest night is the first one; the rest are mostly ordinary, with the odd unusual night
 * and a repeated pattern in the most recent week.
 */
export function sampleState(night: Night, all: Night[]): NightState {
  const i = all.findIndex((n) => n.id === night.id);
  if (i === all.length - 1) return 'first';
  if (i === 1 || i === 3) return 'pattern';
  if (i === 6) return 'unusual';
  return 'steady';
}

const STATES: NightState[] = ['processing', 'poor', 'first', 'steady', 'unusual', 'pattern'];

/** The state to show: a demo override (?state=…) if valid, else the sample night's own. */
export function nightState(night: Night, override?: string): NightState {
  if (override && (STATES as string[]).includes(override)) return override as NightState;
  return sampleState(night, sampleNights());
}

/**
 * A small status mark for a night's headline (list rows, summary card): a calm, colour-coded icon.
 * Never red, never alarming: Dew for steady, Lamp (the warm light) for "look at this".
 */
export type StatusMark = { icon: 'check_circle' | 'trending_up' | 'visibility' | 'bedtime'; color: 'dataSleep' | 'lamp' | 'textMuted' };
export function statusMark(state: NightState): StatusMark {
  switch (state) {
    case 'unusual':
      return { icon: 'trending_up', color: 'lamp' };
    case 'pattern':
      return { icon: 'visibility', color: 'lamp' };
    case 'steady':
      return { icon: 'check_circle', color: 'dataSleep' };
    default:
      return { icon: 'bedtime', color: 'textMuted' };
  }
}

/** Compact duration for big numbers: "7h 36m", "36m". One size, no small units. */
export function shortDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

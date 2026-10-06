import type { IconName } from '../components/Icon';

/**
 * Home tips: short messages on the sheet behind the panel. The charging tip is always the one
 * in view; pull the panel down to see the rest (a few at random each time Home opens).
 * Copy follows docs/BRAND.md: plain, factual, calm, useful. No praise, badges, urgency or
 * diagnosis, and nothing the tech can't back up.
 *
 * Prototype: the "update" messages use sample data. Engineering: show those only when they're
 * true (a real recording exists, a real comparison holds), and follow
 * the escalation ladder (BRAND.md §3) for anything about patterns.
 */
export type Tip = { id: string; icon: IconName; text: string; kind: 'tip' | 'update'; /** Shows a "Turn on" button that asks for this permission. */ action?: 'microphone' | 'notifications' };

/**
 * Shown while a permission is off (after "Not now" in onboarding). Calm, never a warning.
 * Microphone: pinned in view, since nothing can be recorded without it. Notifications: among the tips underneath.
 */
export const MICROPHONE_OFF: Tip = { id: 'microphone-off', kind: 'tip', icon: 'mic', text: 'Microphone is off. Airese needs it to record your night.', action: 'microphone' };
export const NOTIFICATIONS_OFF: Tip = { id: 'notifications-off', kind: 'tip', icon: 'notifications', text: 'Turn on notifications for a bedtime reminder.', action: 'notifications' };

export const TIPS: Tip[] = [
  { id: 'charge', kind: 'tip', icon: 'battery_charging_full', text: 'Keep your phone on charge tonight. Sleep tracking can use more battery than usual.' },
  { id: 'placement', kind: 'tip', icon: 'bed', text: 'Put your phone on your bedside table, close to your pillow.' },
  { id: 'partner', kind: 'tip', icon: 'group', text: 'Sharing a bed? Keep your phone on your side for the clearest recording.' },
  { id: 'dnd', kind: 'tip', icon: 'do_not_disturb_on', text: 'Turn on Do Not Disturb. Calls and alerts stay quiet, and Airese keeps recording.' },
  { id: 'steadier', kind: 'update', icon: 'bedtime', text: 'Your breathing was steadier last night than your usual.' },
  { id: 'listen', kind: 'update', icon: 'graphic_eq', text: '2:14 am. 40 seconds. Have a listen to what happened while you slept.' },
];

/** Always the one in view: the most useful thing to do before a night of recording. */
const FIRST = 'charge';

/** The charging tip first, then `count - 1` other tips in random order. */
export function randomTips(count = 4): Tip[] {
  const first = TIPS.find((t) => t.id === FIRST)!;
  const rest = TIPS.filter((t) => t.id !== FIRST).sort(() => Math.random() - 0.5);
  return [first, ...rest].slice(0, count);
}

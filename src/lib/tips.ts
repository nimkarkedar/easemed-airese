import type { IconName } from '../components/Icon';

/**
 * Home banners: tips and short updates. Each time Home opens: the charging tip first, then a few at random.
 * Copy follows docs/BRAND.md: plain, factual, calm, useful. No praise, badges, urgency or
 * diagnosis, and nothing the tech can't back up.
 *
 * Prototype: the "update" banners use sample data. Engineering: show those only when they're
 * true (report actually ready, a real recording exists, a real comparison holds), and follow
 * the escalation ladder (BRAND.md §3) for anything about patterns.
 */
export type Tip = { id: string; icon: IconName; title: string; body: string; kind: 'tip' | 'update' };

export const TIPS: Tip[] = [
  { id: 'charge', kind: 'tip', icon: 'battery_charging_full', title: 'Keep your phone on charge', body: 'Recording all night uses more battery than usual.' },
  { id: 'placement', kind: 'tip', icon: 'bed', title: 'Phone by the bed', body: 'Put it on your bedside table, close to your pillow.' },
  { id: 'partner', kind: 'tip', icon: 'group', title: 'Sharing a bed?', body: 'Keep your phone on your side for the clearest recording.' },
  { id: 'dnd', kind: 'tip', icon: 'do_not_disturb_on', title: 'Turn on Do Not Disturb', body: 'Calls and alerts stay quiet. Airese keeps recording.' },
  { id: 'report', kind: 'update', icon: 'description', title: 'Your weekly report is ready', body: 'See how your nights went. Share it with a doctor if you’d like.' },
  { id: 'steadier', kind: 'update', icon: 'bedtime', title: 'A steadier night', body: 'Your breathing was steadier last night than your usual.' },
  { id: 'listen', kind: 'update', icon: 'graphic_eq', title: '2:14 am. 40 seconds.', body: 'Have a listen to what happened while you slept.' },
];

/** Always shown first: the most useful thing to do before a night of recording. */
const FIRST = 'charge';

/** The charging tip first, then `count - 1` other tips in random order. */
export function randomTips(count = 3): Tip[] {
  const first = TIPS.find((t) => t.id === FIRST)!;
  const rest = TIPS.filter((t) => t.id !== FIRST).sort(() => Math.random() - 0.5);
  return [first, ...rest].slice(0, count);
}

import type { IconName } from '../components/Icon';

/**
 * Home banner: one message at a time, the most useful one for right now. Four messages, in priority:
 *
 *   P0  Microphone off     → Turn on microphone   (nothing can be recorded without it)
 *   P1  Notifications off  → Turn on notifications
 *   P2  Keep it charging   → Got it               (until dismissed)
 *   P3  Night Notes        → Add / Edit Night Notes (always there underneath: Home's way into Night Notes)
 *
 * Copy follows docs/BRAND.md: plain, factual, calm, useful. Never a warning.
 * Engineering: P2 could also hide while the phone is already on charge (expo-battery), and come back
 * each evening rather than once per install.
 */
export type HomeMessageId = 'microphone' | 'notifications' | 'charging' | 'notes';
export type HomeMessage = { id: HomeMessageId; icon: IconName; text: string; cta: string };

type Situation = {
  micOn: boolean;
  notificationsOn: boolean;
  chargingDismissed: boolean;
  /** Tonight's Night Notes, summarised ("Blocked nose · Alcohol"), or empty when none yet. */
  notesTonight: string;
};

export function homeMessage(s: Situation): HomeMessage {
  if (!s.micOn) return { id: 'microphone', icon: 'mic', text: 'Airese needs your microphone to record your night.', cta: 'Turn on microphone' };
  if (!s.notificationsOn) return { id: 'notifications', icon: 'notifications', text: 'Turn on notifications to know when your night is ready.', cta: 'Turn on notifications' };
  if (!s.chargingDismissed) return { id: 'charging', icon: 'battery_charging_full', text: 'Keep your phone on charge while you record. A night of listening uses more battery.', cta: 'Got it' };
  if (s.notesTonight) return { id: 'notes', icon: 'edit_note', text: `Tonight’s Night Notes: ${s.notesTonight}`, cta: 'Edit Night Notes' };
  return { id: 'notes', icon: 'edit_note', text: 'Add Night Notes before you sleep, so you can track your progress over time.', cta: 'Add Night Notes' };
}

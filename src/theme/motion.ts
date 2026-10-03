/**
 * Airese motion: one calm, unhurried pace for the whole app.
 * Every animation uses these durations and curves; don't hand-tune per screen.
 *
 * Feel: like settling down for the night. Unhurried: every curve starts
 * softly (no snap at the start) and lands softly (long, gentle settle).
 * Things arrive slowly (enter), drift away (exit) and glide between states
 * (move). Overlap steps rather than chaining them, so it flows instead of ticking.
 * Nothing snaps, bounces or overshoots.
 */
import { Easing, Platform } from 'react-native';

export const motion = {
  duration: {
    /** Getting out of the way: hiding something the user just moved past. */
    fast: 450,
    /** Default: fades, small reveals (a button appearing, text changing). */
    base: 1000,
    /** Big or meaningful moments: the logo arriving, the splash falling away. */
    slow: 1400,
    /** Background life: one full in-and-out of an ambient "breath". */
    ambient: 9000,
  },
  easing: {
    /** Arriving: eases in softly, then a long gentle settle (soft ease-out). */
    enter: Easing.bezier(0.3, 0, 0.2, 1),
    /** Leaving: drifts off, gradually gathering pace (ease-in sine). */
    exit: Easing.bezier(0.47, 0, 0.745, 0.715),
    /** Gliding between two resting states (ease-in-out sine). */
    move: Easing.bezier(0.37, 0, 0.63, 1),
    /** Looping ambient motion: a sine wave, like breathing. */
    ambient: Easing.inOut(Easing.sin),
  },
  /** Brief pause before a follow-on element, so things arrive in sequence, not all at once. */
  stagger: 350,
  /** The native driver isn't available on web (browser preview only). */
  useNativeDriver: Platform.OS !== 'web',
} as const;

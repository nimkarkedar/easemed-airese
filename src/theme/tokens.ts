/**
 * Airese design tokens (kept minimal: add only when a screen needs it).
 * Source: docs/BRAND.md (Voice & Tone and Visual Language decks, Oct 2026).
 *  - Night-appropriate dark UI, with one warm light. No red: calm, never alarming.
 *  - Montserrat: bold to scan, regular to read.
 */
import { Platform, type TextStyle } from 'react-native';

/** Night palette, "Night, with one warm light" (docs/BRAND.md §4). */
const palette = {
  night: '#05070F', // deepest background
  midnight: '#0B1020', // app base colour
  deep: '#19294E', // cards, sheets (deck had #131B2E; updated by design, Oct 2026)
  mist: '#93A0BB', // muted text
  moon: '#EEF1F7', // text
  breath: '#9DB4FF', // cool accent: breathing, links
  lamp: '#F4B65F', // the one warm light; use sparingly
} as const;

export const colors = {
  ...palette,
  // Roles: screens use these
  background: palette.midnight,
  surface: palette.deep, // cards
  text: palette.moon,
  textMuted: palette.mist,
  accent: palette.breath, // primary buttons, links
  onAccent: palette.midnight, // text on accent (white on Breath is too low-contrast)
  brand: '#2E3A5A', // Airese navy (logo, decks). Role in the dark UI still open: see BRAND.md §5
  white: '#FFFFFF', // logo on the splash gradient
  scrim: 'rgba(5, 7, 15, 0.7)', // Night at 70%: dims the screen behind sheets
} as const;

/** Gradient stops, top to bottom. */
export const gradients = {
  // Splash: night sky brightening to a clear blue (Figma "iPhone 16 & 17 Pro - 1").
  // Top stop is the app background on purpose: when the splash falls away, the top
  // colour is what's left, so it hands over seamlessly to the next screen.
  splash: [
    { offset: 0, color: palette.midnight },
    { offset: 0.5, color: '#1C3470' },
    { offset: 1, color: '#225ED8' },
  ],
} as const;

export type ColorName = keyof typeof colors;

/** 4-pt grid */
export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  gutter: 20, // screen edges
} as const;

export const radius = {
  md: 12,
  lg: 16, // cards
  pill: 999, // buttons
  sheet: 28, // bottom sheet top corners
} as const;

/* One loaded font file per weight (see src/app/_layout.tsx).
   On web, plain "Montserrat" is the fallback used by the shared preview link. */
type Weight = '400' | '700';
const nativeFamily: Record<Weight, string> = {
  '400': 'Montserrat_400Regular',
  '700': 'Montserrat_700Bold',
};
const font = (w: Weight): TextStyle =>
  Platform.OS === 'web'
    ? { fontFamily: `${nativeFamily[w]}, Montserrat, system-ui, sans-serif`, fontWeight: w }
    : { fontFamily: nativeFamily[w] };

export const type = {
  title: { ...font('700'), fontSize: 28, lineHeight: 34 },
  headline: { ...font('700'), fontSize: 24, lineHeight: 30 }, // onboarding statements
  heading: { ...font('700'), fontSize: 20, lineHeight: 26 },
  body: { ...font('400'), fontSize: 17, lineHeight: 26 },
  subhead: { ...font('400'), fontSize: 15, lineHeight: 20 }, // short lines under a headline
  small: { ...font('400'), fontSize: 13, lineHeight: 18 },
  button: { ...font('700'), fontSize: 16, lineHeight: 20 },
} satisfies Record<string, TextStyle>;

export type TypeVariant = keyof typeof type;

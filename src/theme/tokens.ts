/**
 * Airese design tokens (kept minimal: add only when a screen needs it).
 * Source: docs/BRAND.md (Voice & Tone and Visual Language decks, Oct 2026).
 *  - Night-appropriate dark UI, with one warm light. Red only for form errors, never for sleep data.
 *  - Montserrat: semibold to scan (headings), medium to act (buttons), regular to read.
 */
import { Platform, type TextStyle } from 'react-native';

/** Night palette, "Night, with one warm light" (docs/BRAND.md §4). */
const palette = {
  night: '#05070F', // deepest background
  midnight: '#0B1020', // app base colour
  deep: '#19294E', // cards, sheets (deck had #131B2E; updated by design, Oct 2026)
  mist: '#B3BDD3', // muted text (deck had #93A0BB; lightened to pass WCAG AAA 7:1 on Midnight and Deep)
  moon: '#EEF1F7', // text
  breath: '#9DB4FF', // cool accent: breathing, links
  lamp: '#F4B65F', // the one warm light; use sparingly
  // Data only (charts, data icons; never text, buttons or links). Added Oct 2026 for Recording Details.
  ember: '#FFAA5C', // snoring
  iris: '#B9A3FF', // breathing interruptions
  dew: '#8EE3CF', // sleep and rest
} as const;

export const colors = {
  ...palette,
  // Roles: screens use these
  background: palette.midnight,
  surface: palette.deep, // cards, sheets, form groups
  divider: 'rgba(179, 189, 211, 0.18)', // hairlines between form rows (Mist at 18%)
  text: palette.moon,
  textMuted: palette.mist,
  accent: palette.breath, // primary buttons, links
  onAccent: palette.midnight, // text on accent (white on Breath is too low-contrast)
  error: '#FFB4AB', // form errors only (Material 3 dark error, tone 80). Never for sleep results: calm, not alarming
  brand: '#2E3A5A', // Airese navy (logo, decks). Role in the dark UI still open: see BRAND.md §5
  white: '#FFFFFF', // logo on the splash gradient
  scrim: 'rgba(5, 7, 15, 0.7)', // Night at 70%: dims the screen behind sheets

  // Data: one colour per kind of thing, the same everywhere (charts, data icons, legends, score rings).
  // Checked together on Deep and Midnight with the dataviz validator: colour-blind dE 12+, 3:1+ contrast.
  // Breath stays out of charts (it's the UI colour, and too close to Iris for colour-blind readers).
  // Marks and icons only, never text; every chart also labels or shapes its marks.
  dataSnoring: palette.ember,
  dataBreathing: palette.iris,
  dataSleep: palette.dew,
  // Soft tints of the same, for icon badges. Decorative: text on them uses Moon.
  tintSnoring: 'rgba(255, 170, 92, 0.14)',
  tintBreathing: 'rgba(185, 163, 255, 0.14)',
  tintSleep: 'rgba(142, 227, 207, 0.12)',
  tintWarm: 'rgba(244, 182, 95, 0.10)', // Lamp wash, for the meaning card
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
  // Hero card (a night's takeaway): Deep lifting into the splash's mid blue. Moon text stays at 11:1+.
  hero: [
    { offset: 0, color: '#1C3470' },
    { offset: 1, color: palette.deep },
  ],
} as const;

export type ColorName = keyof typeof colors;

/** Snoring loudness: one hue (Ember), light to deep. Magnitude, so never a rainbow, and no red. */
export const loudness = { light: '#FFD9B0', moderate: '#FFC285', loud: '#FFAA5C', veryLoud: '#F28B3D' } as const;

/** 4-pt grid */
export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  gutter: 20, // screen edges: the one side inset for every screen (iOS standard)
} as const;

export const radius = {
  md: 12,
  lg: 16, // cards, form groups
  xl: 20, // banners
  card: 24, // data cards (Recording Details)
  pill: 999, // buttons
  sheet: 28, // bottom sheet corners
} as const;

/* One loaded font file per weight (see src/app/_layout.tsx).
   On web, plain "Montserrat" is the fallback used by the shared preview link. */
type Weight = '400' | '500' | '600' | '700';
const nativeFamily: Record<Weight, string> = {
  '400': 'Montserrat_400Regular',
  '500': 'Montserrat_500Medium',
  '600': 'Montserrat_600SemiBold',
  '700': 'Montserrat_700Bold',
};
const font = (w: Weight): TextStyle =>
  Platform.OS === 'web'
    ? { fontFamily: `${nativeFamily[w]}, Montserrat, system-ui, sans-serif`, fontWeight: w }
    : { fontFamily: nativeFamily[w] };

/**
 * Type scale. Base 16; steps of about 1.25 (major third), rounded to whole sizes,
 * Reading text has line height of at least 1.5x (WCAG 1.4.8). Nothing smaller than 12: text is read half-asleep at 6 am.
 *   12 · 14 · 16 · 20 · 24 · 32
 */
export const type = {
  title: { ...font('600'), fontSize: 32, lineHeight: 40 }, // rare: big single statements
  headline: { ...font('600'), fontSize: 24, lineHeight: 32 }, // screen headline (onboarding)
  heading: { ...font('600'), fontSize: 20, lineHeight: 28 }, // section and sheet titles
  body: { ...font('400'), fontSize: 16, lineHeight: 24 }, // base: all reading text
  small: { ...font('400'), fontSize: 14, lineHeight: 22 }, // secondary detail
  caption: { ...font('400'), fontSize: 12, lineHeight: 18 }, // the minimum: credits, fine print
  button: { ...font('400'), fontSize: 16, lineHeight: 20 }, // regular (Oct 2026: two weights only, regular and semibold)
} satisfies Record<string, TextStyle>;

export type TypeVariant = keyof typeof type;

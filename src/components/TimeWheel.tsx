import React, { useEffect, useRef, useState } from 'react';
import { Animated, PanResponder, Platform, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { ClockTime } from '../lib/time';
import { motion, radius, space } from '../theme';
import { AppText } from './AppText';

const native = motion.useNativeDriver;
const ITEM = 44; // row height: one value, a full touch target
const BOX = 104; // window height: the value plus a glimpse of its neighbours curving away
const SLOTS = [-2, -1, 0, 1, 2]; // rows drawn around the centre (enough to cover the window while moving)
const MOMENTUM = 280; // how far a flick carries: ms of travel at release speed
const SETTLE_MS = 120; // quiet time after the last wheel/trackpad event before settling

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
const PERIODS: ClockTime['period'][] = ['AM', 'PM'];

const mod = (n: number, m: number) => ((n % m) + m) % m;

/**
 * Time picker as three drums (hour, minute, AM/PM) that behave like the iOS wheel, in Airese colours.
 *
 * Each drum is a cylinder: values tilt back, shrink and fade as they leave the centre.
 * It follows the finger 1:1, carries on when flicked, then settles on the nearest value
 * (fast preset for a row or two, slow for a long flick; ease-out, no bounce). Hours and minutes
 * go round endlessly; AM/PM stops at the ends with a little give. A light haptic tick marks each
 * value passing. Also: tap a neighbour to step to it; mouse drag, scroll wheel and trackpad in the browser.
 * Screen readers: an adjustable control per drum (swipe up / down).
 */
export function TimeWheel({ value, onChange }: { value: ClockTime; onChange: (t: ClockTime) => void }) {
  // Latest value, updated straight away: two drums can settle in the same moment.
  const latest = useRef(value);
  latest.current = value;
  const set = (patch: Partial<ClockTime>) => {
    latest.current = { ...latest.current, ...patch };
    onChange(latest.current);
  };
  return (
    <View style={styles.row}>
      <Drum label="Hour" items={HOURS} loop index={value.hour - 1} onChange={(i) => set({ hour: i + 1 })} />
      <Drum label="Minute" items={MINUTES} loop index={value.minute} onChange={(i) => set({ minute: i })} />
      <Drum label="AM or PM" items={PERIODS} index={PERIODS.indexOf(value.period)} onChange={(i) => set({ period: PERIODS[i] })} />
    </View>
  );
}

function Drum({ label, items, index, loop = false, onChange }: { label: string; items: string[]; index: number; loop?: boolean; onChange: (i: number) => void }) {
  const n = items.length;
  const max = (n - 1) * ITEM;
  // Position in pixels: row × ITEM (continuous; runs past the ends when looping).
  const offset = useRef(new Animated.Value(index * ITEM)).current;
  const pos = useRef(index * ITEM); // mirror of `offset`, readable at any time
  const [centre, setCentre] = useState(index); // nearest row: which values the slots show
  const lastRow = useRef(index);
  const committed = useRef(index);
  const dragFrom = useRef(0);
  const box = useRef<View>(null);
  const wheelTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const clampRow = (row: number) => (loop ? row : Math.min(n - 1, Math.max(0, row)));
  const valueAt = (row: number) => mod(row, n);

  // Follow the animated value: redraw the slots, and tick as each row passes the centre.
  useEffect(() => {
    const id = offset.addListener(({ value: v }) => {
      pos.current = v;
      const row = Math.round(v / ITEM);
      if (row === lastRow.current) return;
      lastRow.current = row;
      setCentre(row);
      if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
    });
    return () => offset.removeListener(id);
  }, [offset]);

  useEffect(() => () => clearTimeout(wheelTimer.current), []);

  const settleTo = (row: number) => {
    const target = clampRow(row);
    const rows = Math.abs(target * ITEM - pos.current) / ITEM;
    const preset = rows > 2 ? motion.slow : motion.fast;
    Animated.timing(offset, { toValue: target * ITEM, duration: preset.duration, easing: preset.easeOut, useNativeDriver: native }).start(({ finished }) => {
      if (!finished) return;
      const v = valueAt(target);
      // Looping: quietly move back into the first lap so positions never grow without bound.
      if (loop && target !== v) offset.setValue(v * ITEM);
      if (v !== committed.current) {
        committed.current = v;
        onChangeRef.current(v);
      }
    });
  };
  const settleRef = useRef(settleTo);
  settleRef.current = settleTo;

  // Value changed from outside (e.g. the sheet reopened): turn to it the short way round.
  useEffect(() => {
    if (index === committed.current) return;
    committed.current = index;
    const here = Math.round(pos.current / ITEM);
    const half = Math.floor(n / 2);
    const delta = loop ? mod(index - here + half, n) - half : index - here;
    settleRef.current(here + delta);
  }, [index, loop, n]);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        offset.stopAnimation();
        dragFrom.current = pos.current;
      },
      onPanResponderMove: (_, g) => {
        let at = dragFrom.current - g.dy;
        // AM/PM: give a little past the ends (a third of the finger's travel), like iOS.
        if (!loop && at < 0) at = at / 3;
        if (!loop && at > max) at = max + (at - max) / 3;
        offset.setValue(at);
      },
      onPanResponderRelease: (_, g) => {
        if (Math.abs(g.dy) < 4 && Math.abs(g.vy) < 0.1) {
          // A tap: step to the row that was tapped (measured now: the sheet may have moved since layout).
          const y0 = g.y0; // read now: the gesture state is reset after release
          return box.current?.measureInWindow((_, top) => {
            const rows = Math.round((y0 - (top + BOX / 2)) / ITEM);
            if (rows !== 0) settleRef.current(Math.round(pos.current / ITEM) + rows);
          });
        }
        settleRef.current(Math.round((pos.current - g.vy * MOMENTUM) / ITEM));
      },
      onPanResponderTerminate: () => settleRef.current(Math.round(pos.current / ITEM)),
    }),
  ).current;

  // Browser: scroll wheel and trackpad turn the drum too.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const el = box.current as unknown as HTMLElement | null;
    if (!el?.addEventListener) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      offset.stopAnimation();
      let next = pos.current + e.deltaY;
      if (!loop) next = Math.min(max, Math.max(0, next));
      offset.setValue(next);
      clearTimeout(wheelTimer.current);
      wheelTimer.current = setTimeout(() => settleRef.current(Math.round(pos.current / ITEM)), SETTLE_MS);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [loop, max, offset]);

  const step = (by: number) => settleTo(Math.round(pos.current / ITEM) + by);

  return (
    <View
      ref={box}
      style={styles.box}
      {...pan.panHandlers}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ text: items[valueAt(centre)] }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => step(e.nativeEvent.actionName === 'increment' ? 1 : -1)}
    >
      {SLOTS.map((k) => {
        const row = centre + k;
        if (!loop && (row < 0 || row >= n)) return null;
        // This row's distance from the centre, in pixels (0 = in the middle).
        const rel = Animated.subtract(row * ITEM, offset);
        const curve = (out: number[]) => rel.interpolate({ inputRange: [-2 * ITEM, -ITEM, 0, ITEM, 2 * ITEM], outputRange: out, extrapolate: 'clamp' });
        return (
          <Animated.View
            key={row}
            pointerEvents="none"
            style={[
              styles.item,
              {
                opacity: curve([0, 0.35, 1, 0.35, 0]),
                transform: [
                  { translateY: rel },
                  { perspective: 300 },
                  { rotateX: rel.interpolate({ inputRange: [-2 * ITEM, 0, 2 * ITEM], outputRange: ['55deg', '0deg', '-55deg'], extrapolate: 'clamp' }) },
                  { scale: curve([0.8, 0.9, 1, 0.9, 0.8]) },
                ],
              },
            ]}
          >
            <AppText variant="title" color="text">
              {items[valueAt(row)]}
            </AppText>
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', gap: space.md },
  box: {
    width: 88,
    height: BOX,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(157, 180, 255, 0.4)', // Breath at 40%
    backgroundColor: 'rgba(11, 16, 32, 0.35)', // Midnight, sunk into the sheet
    overflow: 'hidden',
    ...(Platform.OS === 'web' ? ({ cursor: 'grab', userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none', touchAction: 'none' } as object) : null),
  },
  item: { position: 'absolute', left: 0, right: 0, top: (BOX - ITEM) / 2, height: ITEM, alignItems: 'center', justifyContent: 'center' },
});

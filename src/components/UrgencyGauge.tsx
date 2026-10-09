import React, { useEffect, useRef, useState } from 'react';
import { Animated, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { colors, loudness, motion, useReducedMotion } from '../theme';
import { AppText } from './AppText';
import { rampColor } from './ScoreRing';

const RAMP = [loudness.light, loudness.moderate, loudness.loud, loudness.veryLoud] as const;
const W = 72;
const STROKE = 7;
const R = (W - STROKE) / 2;
const CX = W / 2;
const CY = R + STROKE / 2;
const H = CY + STROKE / 2 + 2;

/**
 * How much a night calls for attention, as a small dial: a half-circle running cyan → yellow →
 * orange → red (the loudness ramp) with a needle, and one word under it. Reads before the words.
 * `level` 0 to 1: low (ordinary) · middle (unusual) · in the red (a repeated pattern).
 * The needle sweeps up from the left on arrival (slow ease-out); Reduce Motion shows it in place.
 * The word carries the meaning too, so colour is never the only cue.
 */
export function UrgencyGauge({ level, label }: { level: number; label: string }) {
  const reduced = useReducedMotion();
  const target = Math.max(0, Math.min(1, level));
  const t = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  const [p, setP] = useState(reduced ? 1 : 0);

  useEffect(() => {
    if (reduced) return setP(1);
    const id = t.addListener(({ value }) => setP(value));
    Animated.timing(t, { toValue: 1, duration: motion.slow.duration, delay: motion.stagger, easing: motion.slow.easeOut, useNativeDriver: false }).start();
    return () => t.removeListener(id);
  }, [reduced, t]);

  // Angle along the dial: 0 = far left, 1 = far right, over the top.
  const at = (f: number, r = R): [number, number] => [CX - r * Math.cos(f * Math.PI), CY - r * Math.sin(f * Math.PI)];
  const n = 36;
  const arc = Array.from({ length: n }, (_, i) => {
    const a = i / n;
    const b = Math.min(1, (i + 1) / n + 0.004);
    const [x0, y0] = at(a);
    const [x1, y1] = at(b);
    return <Path key={i} d={`M${x0},${y0} A${R},${R} 0 0 1 ${x1},${y1}`} stroke={rampColor(RAMP, (a + b) / 2)} strokeWidth={STROKE} fill="none" />;
  });
  const [lx, ly] = at(0);
  const [rx, ry] = at(1);
  const [nx, ny] = at(target * p, R - STROKE - 3);

  return (
    <View style={{ width: W, alignItems: 'center' }} accessible accessibilityLabel={`Attention: ${label}`}>
      <Svg width={W} height={H}>
        <Circle cx={lx} cy={ly} r={STROKE / 2} fill={RAMP[0]} />
        {arc}
        <Circle cx={rx} cy={ry} r={STROKE / 2} fill={RAMP[RAMP.length - 1]} />
        <Line x1={CX} y1={CY} x2={nx} y2={ny} stroke={colors.text} strokeWidth={2.5} strokeLinecap="round" />
        <Circle cx={CX} cy={CY} r={4} fill={colors.text} />
      </Svg>
      <AppText variant="caption" color="text" style={{ marginTop: 2 }} numberOfLines={1}>
        {label}
      </AppText>
    </View>
  );
}

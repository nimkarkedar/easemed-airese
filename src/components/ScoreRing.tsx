import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, motion, useReducedMotion } from '../theme';
import { Icon, type IconName } from './Icon';

/**
 * A ring showing how far along its scale a score sits, with the data's icon (or the score) in the middle.
 * Fills in once on arrival (slow ease-out); Reduce Motion shows it filled.
 */
export function ScoreRing({ fraction, color, icon, size = 64, stroke = 6, children }: { fraction: number; color: string; icon?: IconName; size?: number; stroke?: number; children?: React.ReactNode }) {
  const reduced = useReducedMotion();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const f = Math.max(0.04, Math.min(1, fraction));
  // Progress drives a plain SVG circle (animated SVG elements leak native-only props on web).
  const t = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  const [p, setP] = useState(reduced ? 1 : 0);

  useEffect(() => {
    if (reduced) return setP(1);
    const id = t.addListener(({ value }) => setP(value));
    Animated.timing(t, { toValue: 1, duration: motion.slow.duration, delay: motion.stagger, easing: motion.slow.easeOut, useNativeDriver: false }).start();
    return () => t.removeListener(id);
  }, [reduced, t]);

  return (
    <View style={{ width: size, height: size }} accessible={false}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(238, 241, 247, 0.1)" strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={c - c * f * p}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
        {children ?? (icon ? <Icon name={icon} size={22} color="text" /> : null)}
      </View>
    </View>
  );
}
/** Ring colour per score: the data colours; Rest (a mix of everything) is neutral Moon. */
export const scoreColor = { snoring: colors.dataSnoring, breathing: colors.dataBreathing, sleep: colors.dataSleep, rest: colors.text } as const;

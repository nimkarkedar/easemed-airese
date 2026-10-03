import React, { useEffect, useRef, useState } from 'react';
import { Animated, PanResponder, Platform, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { colors, gradients, motion, radius, space, useReducedMotion } from '../theme';
import { AppText } from './AppText';
import { Icon } from './Icon';

const native = motion.useNativeDriver;
// Deliberately big: the main action on Home, easy to hit half-asleep.
const HEIGHT = 112;
const PAD = 6;
const KNOB = HEIGHT - PAD * 2;
const DONE_AT = 0.85; // drag past 85% of the way to start

/**
 * Slide-to-start control: drag the mic knob to the end of the glowing track to start.
 * A deliberate gesture, so recording isn't started by a stray tap at bedtime.
 * Released early, the knob settles back (fast). The label fades as the knob travels.
 * Screen readers get a plain "activate" action instead of the drag (WCAG 2.5.1).
 */
export function SlideToStart({ label, onStart }: { label: string; onStart?: () => void }) {
  const reduced = useReducedMotion();
  const [trackWidth, setTrackWidth] = useState(0);
  const max = Math.max(0, trackWidth - KNOB - PAD * 2);
  const maxRef = useRef(0);
  maxRef.current = max;
  const x = useRef(new Animated.Value(0)).current;
  const startRef = useRef(onStart);
  startRef.current = onStart;

  const settle = (to: number, done?: () => void) =>
    Animated.timing(x, { toValue: to, duration: motion.fast.duration, easing: motion.fast.easeOut, useNativeDriver: native }).start(() => done?.());

  const complete = () =>
    settle(maxRef.current, () => {
      startRef.current?.();
      // Prototype: no recording screen yet, so the knob returns after a beat.
      setTimeout(() => settle(0), motion.slow.duration);
    });

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 4,
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (_, g) => x.setValue(Math.min(Math.max(0, g.dx), maxRef.current)),
      onPanResponderRelease: (_, g) => (g.dx >= maxRef.current * DONE_AT ? complete() : settle(0)),
      onPanResponderTerminate: () => settle(0),
    }),
  ).current;

  // A gentle nudge on the chevron every few seconds hints at the gesture. Off with Reduce Motion.
  const nudge = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduced) return nudge.setValue(0);
    const half = { duration: motion.slow.duration / 2, easing: motion.slow.easeInOut, useNativeDriver: native };
    const loop = Animated.loop(
      Animated.sequence([Animated.timing(nudge, { toValue: 1, ...half }), Animated.timing(nudge, { toValue: 0, ...half }), Animated.delay(motion.slow.duration * 2)]),
    );
    loop.start();
    return () => loop.stop();
  }, [nudge, reduced]);

  const fade = max > 0 ? x.interpolate({ inputRange: [0, max * 0.6], outputRange: [1, 0], extrapolate: 'clamp' }) : 1;
  const blue = gradients.splash[gradients.splash.length - 1].color;

  return (
    <View
      style={styles.track}
      onLayout={(e: LayoutChangeEvent) => setTrackWidth(e.nativeEvent.layout.width)}
      accessible
      accessibilityRole="button"
      accessibilityLabel={label.replace(/\n/g, ' ')}
      accessibilityHint="Double tap to start"
      accessibilityActions={[{ name: 'activate' }]}
      onAccessibilityAction={(e) => e.nativeEvent.actionName === 'activate' && complete()}
    >
      <Animated.View style={[styles.labelRow, { opacity: fade }]} pointerEvents="none">
        <AppText color="text" style={{ flexShrink: 1 }}>
          {label}
        </AppText>
        <Animated.View style={{ transform: [{ translateX: nudge.interpolate({ inputRange: [0, 1], outputRange: [0, 6] }) }] }}>
          <Icon name="chevron_right" size={28} color="textMuted" />
        </Animated.View>
      </Animated.View>

      <Animated.View {...pan.panHandlers} style={[styles.knob, { transform: [{ translateX: x }] }]}>
        <Svg style={StyleSheet.absoluteFill} width={KNOB} height={KNOB}>
          <Defs>
            <LinearGradient id="knob" x1="0" y1="0" x2="1" y2="1">
              {/* Splash blues: white mic stays at 5.7:1 or more on the knob (WCAG 1.4.11) */}
              <Stop offset="0" stopColor={blue} />
              <Stop offset="1" stopColor={gradients.splash[1].color} />
            </LinearGradient>
          </Defs>
          <Rect width={KNOB} height={KNOB} rx={KNOB / 2} fill="url(#knob)" />
        </Svg>
        {/* Positioned so it paints above the gradient on web too */}
        <View style={{ position: 'relative', zIndex: 1 }}>
          <Icon name="mic_fill" size={44} color="white" />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: HEIGHT,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.accent,
    backgroundColor: 'rgba(25, 41, 78, 0.5)', // Deep, translucent
    justifyContent: 'center',
    // Soft Breath glow
    shadowColor: colors.accent,
    shadowOpacity: 0.5,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 0 },
    ...(Platform.OS === 'android' ? { elevation: 0 } : null),
  },
  labelRow: { position: 'absolute', left: KNOB + PAD + space.xl, right: space.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  knob: { position: 'absolute', left: PAD, width: KNOB, height: KNOB, borderRadius: KNOB / 2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});

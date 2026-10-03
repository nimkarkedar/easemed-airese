import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, View } from 'react-native';
import { colors, motion, radius, space, useReducedMotion } from '../theme';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

const native = motion.useNativeDriver;

export type TipContent = { id: string; icon: IconName; title: string; body: string };

// How cards behind the front one sit: each step back is lower, smaller and dimmer,
// like cards stacked towards the horizon.
const PEEK = 10; // pt each card shows below the one in front
const SHRINK = 0.05; // scale lost per step back
const DIM = [1, 0.7, 0.45];
const MAX_BEHIND = 2;

/**
 * A stack of tips / short updates on the Home hero (2–3 cards).
 * Only the front card shows its content; the ones behind peek out below it.
 * Dismiss the front card: it lifts away and fades (fast ease-in) while the stack moves
 * forward one step, then the new front card's content fades in (fast ease-out).
 * When the last card is dismissed the stack is gone.
 *
 * Glass is Midnight at 55% so Moon text stays at 10:1+ even over the brightest hero blue.
 * Reduce Motion: no lift, slide or scale; cards just fade.
 */
export function TipStack({ tips }: { tips: TipContent[] }) {
  const reduced = useReducedMotion();
  const [queue, setQueue] = useState(tips);
  const [busy, setBusy] = useState(false);
  const appear = useRef(new Animated.Value(0)).current; // first appearance
  const advance = useRef(new Animated.Value(0)).current; // 0 → 1 while the stack moves forward
  const content = useRef(new Animated.Value(1)).current; // front card's content

  useEffect(() => {
    Animated.timing(appear, { toValue: 1, duration: motion.slow.duration, delay: motion.stagger, easing: motion.slow.easeOut, useNativeDriver: native }).start();
  }, [appear]);

  if (queue.length === 0) return null;
  const [front, ...behind] = queue;
  const shells = behind.slice(0, MAX_BEHIND);

  const dismiss = () => {
    if (busy) return;
    setBusy(true);
    const ease = { duration: motion.fast.duration, easing: motion.fast.easeIn, useNativeDriver: native };
    Animated.timing(advance, { toValue: 1, ...ease }).start(() => {
      setQueue((q) => q.slice(1));
      advance.setValue(0);
      content.setValue(0);
      Animated.timing(content, { toValue: 1, duration: motion.fast.duration, easing: motion.fast.easeOut, useNativeDriver: native }).start(() => setBusy(false));
    });
  };

  // Card at step k behind the front, moving to step k-1 as `advance` runs.
  const shellStyle = (k: number) => {
    const at = (step: number) => ({
      y: reduced ? 0 : step * PEEK,
      s: reduced ? 1 : 1 - step * SHRINK,
      o: DIM[Math.min(step, DIM.length - 1)],
    });
    const from = at(k), to = at(k - 1);
    return {
      opacity: advance.interpolate({ inputRange: [0, 1], outputRange: [from.o, to.o] }),
      transform: [
        { translateY: advance.interpolate({ inputRange: [0, 1], outputRange: [from.y, to.y] }) },
        { scale: advance.interpolate({ inputRange: [0, 1], outputRange: [from.s, to.s] }) },
      ],
    };
  };

  return (
    <Animated.View
      style={{ opacity: appear, paddingBottom: shells.length * PEEK, transform: [{ translateY: appear.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }}
    >
      {/* Cards behind, back to front: empty glass the size of the front card */}
      {shells
        .map((tip, i) => (
          <Animated.View key={tip.id} pointerEvents="none" style={[styles.shell, { bottom: shells.length * PEEK }, shellStyle(i + 1)]}>
            <View style={[styles.glass, StyleSheet.absoluteFill]} />
          </Animated.View>
        ))
        .reverse()}

      {/* Front card: lifts away and fades when dismissed */}
      <Animated.View
        style={{
          opacity: advance.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
          transform: [
            { translateY: advance.interpolate({ inputRange: [0, 1], outputRange: [0, reduced ? 0 : -16] }) },
            { scale: advance.interpolate({ inputRange: [0, 1], outputRange: [1, reduced ? 1 : 1.02] }) },
          ],
        }}
        accessibilityRole="summary"
        accessibilityLabel={`Tip ${tips.length - queue.length + 1} of ${tips.length}. ${front.title}. ${front.body}`}
      >
        <View style={styles.glass}>
          <Animated.View style={[styles.row, { opacity: content }]}>
            <View style={styles.badge}>
              <Icon name={front.icon} size={24} color="lamp" />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="button" color="text">
                {front.title}
              </AppText>
              <AppText variant="small" color="text" style={{ marginTop: 2 }}>
                {front.body}
              </AppText>
            </View>
          </Animated.View>
        </View>

        {/* Floating close button on the corner; 44 pt tap area */}
        <Pressable onPress={dismiss} hitSlop={8} style={styles.close} accessibilityRole="button" accessibilityLabel="Dismiss tip">
          <Icon name="close" size={18} color="text" />
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const blur = Platform.OS === 'web' ? ({ backdropFilter: 'blur(20px) saturate(140%)', WebkitBackdropFilter: 'blur(20px) saturate(140%)' } as object) : null;

const styles = StyleSheet.create({
  glass: {
    padding: space.lg,
    paddingRight: space.xl,
    borderRadius: radius.xl,
    backgroundColor: 'rgba(11, 16, 32, 0.55)', // Midnight glass
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(238, 241, 247, 0.28)', // Moon edge highlight
    ...blur,
  },
  shell: { position: 'absolute', top: 0, left: 0, right: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  badge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(244, 182, 95, 0.14)', // Lamp, soft
  },
  close: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(238, 241, 247, 0.35)',
    ...blur,
  },
});

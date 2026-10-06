import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AmbientGradient, AppText, BottomSheet, Button, Icon, InfoButton, ListeningRing, PAGE_SIDE } from '../components';
import { formatClock, formatDuration, minutesUntil, type ClockTime } from '../lib/time';
import { colors, gradients, motion, radius, space, useInsets, useReducedMotion } from '../theme';
import type { RecordOrigin } from './HomeScreen';

const native = motion.useNativeDriver;
const RING_MAX = 300;
const GRADIENT_STRETCH = 1.4;

/**
 * Recording: shown all night while Airese listens.
 *
 * Arrives from Home: the record button's blue grows out from where it sat until it fills the
 * screen (slow ease-in-out), then this screen surfaces out of the blue: the gradient fades in,
 * the words rise into place and the listening ring opens out (slow ease-out, staggered).
 * Reduce Motion: no growing circle; the screen fades in.
 *
 * Stop: tap the button, then confirm, so a half-asleep tap never ends the night.
 * Direction: Figma "iPhone 16 & 17 Pro - 15" (Oct 2026).
 */
export function RecordingScreen({ stopAt, from, onStop }: { stopAt: ClockTime; from?: RecordOrigin; onStop: () => void }) {
  const insets = useInsets();
  const reduced = useReducedMotion();
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [ringRoom, setRingRoom] = useState({ width: 0, height: 0 });
  const [, tick] = useState(0);
  const [confirm, setConfirm] = useState(false);
  const [info, setInfo] = useState(false);

  const flood = useRef(new Animated.Value(0)).current; // the blue circle: 0 button size → 1 fills the screen
  const surface = useRef(new Animated.Value(0)).current; // this screen fading in over the blue
  const ring = useRef(new Animated.Value(0)).current; // the listening ring opening out

  // "8 hr from now" stays true through the night.
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (size.width === 0) return;
    const out = { easing: motion.slow.easeOut, useNativeDriver: native };
    const arrive = Animated.parallel([
      Animated.timing(surface, {
        toValue: 1,
        duration: motion.slow.duration,
        ...out,
      }),
      Animated.timing(ring, {
        toValue: 1,
        duration: motion.slow.duration,
        delay: motion.stagger,
        ...out,
      }),
    ]);
    if (reduced || !from) return arrive.start();
    Animated.sequence([
      Animated.timing(flood, {
        toValue: 1,
        duration: motion.slow.duration,
        easing: motion.slow.easeInOut,
        useNativeDriver: native,
      }),
      arrive,
    ]).start();
  }, [size.width > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  // Info card: fade (fast ease-in), then close the gap (fast ease-in-out). Height can't use the native driver.
  const [cardShown, setCardShown] = useState(true);
  const card = useRef(new Animated.Value(1)).current;
  const cardFull = useRef(0);
  const [cardHeight, setCardHeight] = useState<Animated.Value | null>(null);
  const closeCard = () => {
    const h = new Animated.Value(cardFull.current);
    setCardHeight(h);
    Animated.sequence([
      Animated.timing(card, {
        toValue: 0,
        duration: motion.fast.duration,
        easing: motion.fast.easeIn,
        useNativeDriver: false,
      }),
      Animated.timing(h, {
        toValue: 0,
        duration: reduced ? 0 : motion.fast.duration,
        easing: motion.fast.easeInOut,
        useNativeDriver: false,
      }),
    ]).start(() => setCardShown(false));
  };

  // The blue circle: big enough to cover the screen from wherever the button was.
  const origin = from ?? { x: size.width / 2, y: size.height / 2, r: 60 };
  const cover = 2 * Math.hypot(Math.max(origin.x, size.width - origin.x), Math.max(origin.y, size.height - origin.y));
  const ringSize = Math.floor(Math.min(RING_MAX, ringRoom.width, ringRoom.height));
  const rise = (by: number) => ({
    opacity: surface,
    transform: [
      {
        translateY: surface.interpolate({
          inputRange: [0, 1],
          outputRange: [reduced ? 0 : by, 0],
        }),
      },
    ],
  });
  const stopsIn = formatDuration(minutesUntil(stopAt));

  return (
    <View style={styles.root} onLayout={(e: LayoutChangeEvent) => setSize(e.nativeEvent.layout)}>
      <StatusBar style="light" />

      {/* 1. The record button's blue, growing to fill the screen */}
      {size.width > 0 && from && !reduced && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            width: cover,
            height: cover,
            left: origin.x - cover / 2,
            top: origin.y - cover / 2,
            borderRadius: cover / 2,
            backgroundColor: gradients.splash[2].color,
            transform: [
              {
                scale: flood.interpolate({
                  inputRange: [0, 1],
                  outputRange: [(origin.r * 2) / cover, 1],
                }),
              },
            ],
          }}
        />
      )}

      {/* 2. This screen, surfacing out of the blue */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: surface }]} pointerEvents="none">
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />
        {/* Runs past the bottom edge, so the text at the bottom sits on mid blue (Moon at 7:1 or more) */}
        {size.width > 0 && <AmbientGradient width={size.width} height={size.height * GRADIENT_STRETCH} />}
      </Animated.View>

      <View style={{ flex: 1, paddingTop: insets.top + space.xl }}>
        <Animated.View style={[{ paddingHorizontal: PAGE_SIDE }, rise(12)]}>
          <AppText variant="title" color="white" accessibilityRole="header">
            Recording Sleep
          </AppText>
          <AppText color="text" style={{ marginTop: space.xs }}>
            Recording on your phone privately.
          </AppText>
        </Animated.View>

        {/* Info card: close it and it fades, then the space closes up so the ring can grow */}
        {cardShown && (
          <Animated.View style={{ height: cardHeight ?? undefined }}>
            <Animated.View style={rise(12)}>
              <Animated.View
                style={{
                  paddingHorizontal: PAGE_SIDE,
                  paddingTop: space.xl,
                  opacity: card,
                }}
                onLayout={(e: LayoutChangeEvent) => cardFull.current === 0 && (cardFull.current = e.nativeEvent.layout.height)}
              >
                <View style={styles.card}>
                  <AppText color="onAccent" style={{ flex: 1 }}>
                    Smart listening. Only snoring is recorded.
                  </AppText>
                  <InfoButton color="onAccent" label="How recording works" onPress={() => setInfo(true)} />
                </View>
                {/* Floating close button on the corner; 44 pt tap area */}
                <Pressable onPress={closeCard} hitSlop={8} style={styles.close} accessibilityRole="button" accessibilityLabel="Close">
                  <Icon name="close" size={18} color="text" />
                </Pressable>
              </Animated.View>
            </Animated.View>
          </Animated.View>
        )}

        <View style={styles.ringArea} onLayout={(e: LayoutChangeEvent) => setRingRoom(e.nativeEvent.layout)}>
          {ringSize > 0 && (
            <Animated.View
              style={{
                opacity: ring,
                transform: [
                  {
                    scale: ring.interpolate({
                      inputRange: [0, 1],
                      outputRange: [reduced ? 1 : 0.7, 1],
                    }),
                  },
                ],
              }}
            >
              <ListeningRing size={ringSize} onStop={() => setConfirm(true)} />
            </Animated.View>
          )}
        </View>

        <Animated.View style={[styles.note, rise(8), { marginBottom: Math.max(insets.bottom, space.lg) + space.xl }]}>
          <AppText variant="small" color="text" style={styles.center}>
            Tap to stop recording
          </AppText>
          <AppText variant="small" color="text" style={styles.center}>
            {`Automatically stops at\n${formatClock(stopAt)} (${stopsIn} from now)`}
          </AppText>
        </Animated.View>
      </View>

      <BottomSheet visible={confirm} onClose={() => setConfirm(false)}>
        <AppText variant="heading" color="text" accessibilityRole="header" style={styles.center}>
          Stop recording?
        </AppText>
        <AppText color="textMuted" style={[styles.center, { marginTop: space.sm }]}>
          Airese keeps what it has recorded so far.
        </AppText>
        <Button
          label="Stop recording"
          onPress={() => {
            setConfirm(false);
            onStop();
          }}
          style={{ marginTop: space.xl }}
        />
        <Button label="Keep recording" variant="quiet" onPress={() => setConfirm(false)} style={{ marginTop: space.sm }} />
      </BottomSheet>

      {/* (i): content to come */}
      <BottomSheet visible={info} onClose={() => setInfo(false)}>
        <View />
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    padding: space.xl,
    borderRadius: radius.xl,
    backgroundColor: colors.accent,
  },
  close: {
    position: 'absolute',
    top: space.xl - 10,
    right: PAGE_SIDE - 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(238, 241, 247, 0.35)',
  },
  ringArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: space.xl,
    marginHorizontal: PAGE_SIDE,
  },
  note: {
    paddingHorizontal: PAGE_SIDE,
    marginTop: space.lg,
  },
  center: { textAlign: 'center' },
});

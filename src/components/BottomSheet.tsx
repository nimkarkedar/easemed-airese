import React, { useEffect, useRef, useState } from 'react';
import { Animated, BackHandler, PanResponder, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { colors, motion, radius, space, useInsets } from '../theme';

const native = motion.useNativeDriver;
/** Drag further than this, or flick down faster than this, to dismiss. */
const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 0.8;

/**
 * Floating bottom sheet over a dimmed screen: inset from the edges, all corners
 * rounded, sitting just above the home indicator.
 * Render it last inside the screen's root view; it overlays that screen
 * (no native Modal, so it also stays inside the browser preview's phone frame).
 * Opens: backdrop fades in while the sheet glides up (enter).
 * Closes: tap the backdrop, or drag the sheet down; it drifts away (exit).
 */
export function BottomSheet({ visible, onClose, children }: { visible: boolean; onClose: () => void; children: React.ReactNode }) {
  const { height } = useWindowDimensions();
  const insets = useInsets();
  const [mounted, setMounted] = useState(visible);
  const progress = useRef(new Animated.Value(0)).current; // 0 hidden, 1 open
  const drag = useRef(new Animated.Value(0)).current; // finger offset while dragging down

  useEffect(() => {
    if (visible) {
      setMounted(true);
      drag.setValue(0);
      Animated.timing(progress, { toValue: 1, duration: motion.duration.base, easing: motion.easing.enter, useNativeDriver: native }).start();
    } else if (mounted) {
      Animated.timing(progress, { toValue: 0, duration: motion.duration.base, easing: motion.easing.exit, useNativeDriver: native }).start(
        ({ finished }) => finished && setMounted(false),
      );
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  // Android back button closes the sheet.
  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, onClose]);

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_, g) => drag.setValue(Math.max(0, g.dy)),
      onPanResponderRelease: (_, g) => {
        if (g.dy > DISMISS_DISTANCE || g.vy > DISMISS_VELOCITY) onClose();
        else Animated.timing(drag, { toValue: 0, duration: motion.duration.fast, easing: motion.easing.move, useNativeDriver: native }).start();
      },
    }),
  ).current;

  if (!mounted) return null;

  return (
    <View style={[StyleSheet.absoluteFill, styles.layer]}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: progress }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
      </Animated.View>

      <Animated.View
        {...pan.panHandlers}
        style={[
          styles.sheet,
          {
            bottom: Math.max(space.xl, insets.bottom - space.sm),
            transform: [
              { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [height, 0] }) },
              { translateY: drag },
            ],
          },
        ]}
      >
        <View style={styles.handle} />
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: { zIndex: 10 },
  backdrop: { backgroundColor: colors.scrim },
  sheet: {
    position: 'absolute',
    left: space.lg,
    right: space.lg,
    minHeight: 366, // Figma sheet height; content will set it once the sheet design lands
    backgroundColor: colors.surface,
    borderRadius: radius.sheet,
    paddingHorizontal: space.xl,
    paddingTop: space.lg,
    paddingBottom: space.xl,
  },
  handle: {
    alignSelf: 'center',
    width: 30,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.textMuted,
    opacity: 0.4,
    marginBottom: space.xl,
  },
});

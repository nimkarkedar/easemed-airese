import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { colors, motion, space, useInsets, useReducedMotion } from '../theme';
import { AppText } from './AppText';
import { Icon } from './Icon';
import { PAGE_SIDE } from './PageTitle';

const native = motion.useNativeDriver;
const BAR = 44; // sticky top bar, below the status bar
const FADE = 24; // soft fade above a sticky footer

/**
 * Template for a page opened from a list or row (a night, Night Notes): plain Midnight,
 * "‹ Back" top left, large title and subtitle, then the content.
 *
 * Sticky header, as on iOS: the back button stays put; once the large title has scrolled under
 * the bar, a compact frosted title fades in behind it.
 * Optional `footer` sticks to the bottom (e.g. Done), over the content.
 *
 * Moving in and out: on iOS / Android the system push (slide from the right, swipe back), set in
 * the route. The browser has no native push, so with `slideIn` the page slides itself in and out
 * (fast preset) over a dimming screen. Reduce Motion: it fades instead.
 * `onBack` runs once the page is out; `leave(fn)` (from children via render prop) does the same for other exits.
 */
export function DetailPage({
  backLabel,
  title,
  subtitle,
  onBack,
  slideIn = Platform.OS === 'web',
  footer,
  children,
}: {
  backLabel: string;
  title: string;
  subtitle?: string;
  onBack: () => void;
  slideIn?: boolean;
  footer?: (leave: (then: () => void) => void) => React.ReactNode;
  children: React.ReactNode;
}) {
  const insets = useInsets();
  const reduced = useReducedMotion();
  const [width, setWidth] = useState(0);
  const [footerHeight, setFooterHeight] = useState(0);
  const t = useRef(new Animated.Value(slideIn ? 0 : 1)).current; // 0 off to the right, 1 in place
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!slideIn || width === 0) return;
    Animated.timing(t, { toValue: 1, duration: motion.fast.duration, easing: motion.fast.easeOut, useNativeDriver: native }).start();
  }, [slideIn, width, t]);

  const leave = (then: () => void) => {
    if (!slideIn) return then();
    Animated.timing(t, { toValue: 0, duration: motion.fast.duration, easing: motion.fast.easeIn, useNativeDriver: native }).start(() => then());
  };

  const page = slideIn
    ? reduced
      ? { opacity: t }
      : { transform: [{ translateX: t.interpolate({ inputRange: [0, 1], outputRange: [width, 0] }) }] }
    : null;

  // Compact title: in as the large title (which starts just under the bar) slides beneath it.
  const compact = scrollY.interpolate({ inputRange: [space.lg, space.lg + BAR / 2], outputRange: [0, 1], extrapolate: 'clamp' });

  return (
    <View style={StyleSheet.absoluteFill} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
      <StatusBar style="light" />
      {slideIn && <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.scrim, opacity: t }]} pointerEvents="none" />}

      <Animated.View style={[styles.page, page]}>
        <Animated.ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + BAR, paddingBottom: (footer ? footerHeight : insets.bottom) + space.xl }}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: native })}
        >
          <View style={styles.header}>
            <AppText variant="title" color="text" accessibilityRole="header">
              {title}
            </AppText>
            {subtitle ? (
              <AppText color="textMuted" style={{ marginTop: space.xs }}>
                {subtitle}
              </AppText>
            ) : null}
          </View>
          {children}
        </Animated.ScrollView>

        {/* Sticky top bar: frosted background and compact title fade in; back always here */}
        <Animated.View pointerEvents="none" style={[styles.barBg, { height: insets.top + BAR, opacity: compact }]} />
        <View style={[styles.bar, { top: insets.top }]} pointerEvents="box-none">
          <Pressable onPress={() => leave(onBack)} hitSlop={8} style={styles.back} accessibilityRole="button" accessibilityLabel={`Back to ${backLabel}`}>
            <Icon name="chevron_left" size={28} color="accent" />
            <AppText color="accent">{backLabel}</AppText>
          </Pressable>
          <Animated.View pointerEvents="none" style={[styles.compactTitle, { opacity: compact }]} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
            <AppText variant="button" color="text" numberOfLines={1}>
              {title}
            </AppText>
          </Animated.View>
        </View>

        {footer && (
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space.lg) + space.sm }]} onLayout={(e: LayoutChangeEvent) => setFooterHeight(e.nativeEvent.layout.height)}>
            <Svg style={styles.fade} width="100%" height={FADE} pointerEvents="none">
              <Defs>
                <LinearGradient id="footerFade" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={colors.background} stopOpacity={0} />
                  <Stop offset="1" stopColor={colors.background} stopOpacity={1} />
                </LinearGradient>
              </Defs>
              <Rect width="100%" height={FADE} fill="url(#footerFade)" />
            </Svg>
            {footer(leave)}
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: PAGE_SIDE, marginTop: space.sm },
  barBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(11, 16, 32, 0.88)', // Midnight, frosted
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(179, 189, 211, 0.1)',
    ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(20px) saturate(140%)', WebkitBackdropFilter: 'blur(20px) saturate(140%)' } as object) : null),
  },
  bar: { position: 'absolute', left: 0, right: 0, height: BAR, justifyContent: 'center', paddingHorizontal: space.sm },
  back: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', minHeight: 44, paddingRight: space.sm, zIndex: 1 },
  compactTitle: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  fade: { position: 'absolute', top: -FADE, left: 0, right: 0 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: PAGE_SIDE, paddingTop: space.md, backgroundColor: colors.background },
});

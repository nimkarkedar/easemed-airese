import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { AppText, Avatar, BottomSheet, PAGE_SIDE, PageTitle, SegmentedControl, SlideToStart, TAB_BAR_CLEARANCE, TipStack, type Segment } from '../components';
import { randomTips } from '../lib/tips';
import { initials, useProfile } from '../lib/profile';
import { colors, gradients, space, useInsets } from '../theme';

const PANEL_RADIUS = 32;

const STOP_AFTER: Segment[] = [
  { key: 'eight', label: '8 hours' },
  { key: 'custom', label: 'Custom' },
];

/**
 * Home (Record tab): set when recording stops, then slide to start.
 * A gradient with the translucent hero image sits behind the header and a rounded Midnight panel.
 * Direction: Figma "iPhone 16 & 17 Pro - 11" (treated as directional, not final).
 */
export function RecordScreen() {
  const insets = useInsets();
  const profile = useProfile();
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [stopAfter, setStopAfter] = useState('eight');
  const [customOpen, setCustomOpen] = useState(false);
  const [tips] = useState(() => randomTips(3)); // a different set each time Home opens
  // Tallest the header has been (with the tip stack). Held, so dismissing tips never moves the panel.
  const [headerHeight, setHeaderHeight] = useState(0);

  const heroHeight = Math.round(Math.max(260, size.height * 0.36));

  const choose = (key: string) => {
    setStopAfter(key);
    if (key === 'custom') setCustomOpen(true);
  };

  return (
    <View style={styles.root} onLayout={(e: LayoutChangeEvent) => setSize(e.nativeEvent.layout)}>
      <StatusBar style="light" />
      {size.width > 0 && <HeroBackground width={size.width} height={Math.max(heroHeight, headerHeight) + PANEL_RADIUS} />}

      <ScrollView contentContainerStyle={{ paddingBottom: TAB_BAR_CLEARANCE }} showsVerticalScrollIndicator={false}>
        {/* Header over the hero */}
        <View
          style={[styles.header, { paddingTop: insets.top + space.lg, minHeight: Math.max(heroHeight, headerHeight) }]}
          onLayout={(e: LayoutChangeEvent) => {
            const h = e.nativeEvent.layout.height;
            setHeaderHeight((prev) => Math.max(prev, h));
          }}
        >
          <PageTitle title="Home" color="white" trailing={<Avatar initials={initials(profile)} />} />

          {/* Tips and short updates: a stack of 3, random each visit; dismiss one and the next comes forward */}
          <View style={{ marginTop: space.xxl + space.md, paddingHorizontal: PAGE_SIDE }}>
            <TipStack tips={tips} />
          </View>
        </View>

        {/* Panel */}
        <View style={styles.panel}>
          <AppText variant="small" color="textMuted" style={styles.sectionLabel}>
            Stop recording after
          </AppText>
          <SegmentedControl label="Stop recording after" segments={STOP_AFTER} selected={stopAfter} onSelect={choose} />
          <AppText variant="small" color="textMuted" style={{ marginTop: space.sm, paddingHorizontal: space.xs }}>
            {stopAfter === 'eight' ? 'Recommended. Covers a full night.' : 'Stops at the time you set.'}
          </AppText>

          <View style={{ marginTop: space.xxl * 2 }}>
            <SlideToStart label={'Slide to\nstart recording'} />
          </View>
          <AppText variant="small" color="textMuted" style={[styles.center, { marginTop: space.lg }]}>
            Completely private. Recorded on your phone.
          </AppText>
        </View>
      </ScrollView>

      {/* Custom stop time: design to come */}
      <BottomSheet visible={customOpen} onClose={() => setCustomOpen(false)}>
        <View />
      </BottomSheet>
    </View>
  );
}

/**
 * Header background: a bright night-to-blue gradient (the splash blues) with the translucent
 * wave image (design asset, 40% opacity) on top, so the gradient glows through the waves.
 * Runs under the panel's rounded corners. Static. Text over it stays at AAA contrast.
 */
function HeroBackground({ width, height }: { width: number; height: number }) {
  return (
    <View style={[StyleSheet.absoluteFill, { height }]} pointerEvents="none">
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="hero" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.night} />
            <Stop offset="0.55" stopColor={gradients.splash[1].color} />
            <Stop offset="1" stopColor={gradients.splash[2].color} />
          </LinearGradient>
        </Defs>
        <Rect width={width} height={height} fill="url(#hero)" />
      </Svg>
      <Image source={require('../../assets/home/hero.png')} resizeMode="cover" style={StyleSheet.absoluteFill} accessible={false} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { paddingBottom: PANEL_RADIUS + space.md },
  panel: {
    marginTop: -PANEL_RADIUS,
    borderTopLeftRadius: PANEL_RADIUS,
    borderTopRightRadius: PANEL_RADIUS,
    backgroundColor: colors.background,
    paddingTop: space.xxl,
    paddingHorizontal: PAGE_SIDE,
    minHeight: 480,
  },
  center: { textAlign: 'center' },
  sectionLabel: { marginBottom: space.sm, paddingHorizontal: space.xs },
});

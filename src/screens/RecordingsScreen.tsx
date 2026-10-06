import React, { useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AmbientGradient, AppText, Avatar, BottomSheet, Button, Icon, PAGE_SIDE, PageTitle, TAB_BAR_CLEARANCE } from '../components';
import { initials, useProfile } from '../lib/profile';
import { byMonth, formatNightDate, formatRecorded, nextInsightIdea, sampleNights, type Night } from '../lib/recordings';
import { nightDetails, sampleState, statusMark, summary } from '../lib/nightDetails';
import { formatDuration } from '../lib/time';
import { colors, motion, space, useInsets } from '../theme';

const PANEL_RADIUS = 32;
const GRADIENT_STRETCH = 1.6; // brightest blue sits below the panel's top, so the insight text stays at AAA
const BAR = 44; // compact title bar height (below the status bar)
const TITLE_ROW = 44; // the large title's row (PageTitle)

/**
 * Recordings tab: one overall insight on top, then every night recorded, newest first.
 *
 * The insight sits on the night gradient: a Lamp lightbulb, at most two lines, at most one action.
 * Prototype: a different idea each time the page opens (see nextInsightIdea), for the PM.
 * The list follows the iOS plain list: month headers, rows of date and length with a chevron,
 * inset hairlines, no boxes. A row opens that night (NightScreen).
 *
 * Title, as on iOS: the large title scrolls away with the page; once it has gone, a compact
 * "Recordings" bar (frosted Midnight) fades in at the top, so the list never runs under the
 * status bar unprotected.
 * Direction: Figma "Recordings" (Oct 2026).
 */
export function RecordingsScreen({ onOpen }: { onOpen: (night: Night) => void }) {
  const insets = useInsets();
  const profile = useProfile();
  const [width, setWidth] = useState(0);
  const [heroHeight, setHeroHeight] = useState(0);
  const [nights] = useState(() => sampleNights());
  const [sheet, setSheet] = useState(false);
  // Each row: the night's takeaway, so the list says enough to choose one (PRD: L0).
  const headline = (n: Night) => summary(nightDetails(n, sampleState(n, nights))).headline;
  const [insight] = useState(() => nextInsightIdea(profile.firstName.trim()));
  const scrollY = useRef(new Animated.Value(0)).current;

  const act = () => {
    if (insight.action?.kind === 'listen') onOpen(nights[0]); // last night
    else setSheet(true); // callback / share: flows to come
  };

  // Compact bar: appears as the large title slides under it.
  const barOpacity = scrollY.interpolate({ inputRange: [space.lg, space.lg + TITLE_ROW / 2], outputRange: [0, 1], extrapolate: 'clamp' });

  return (
    <View style={styles.root} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
      <StatusBar style="light" />
      <Animated.ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: motion.useNativeDriver })}
      >
        {/* Pulled down past the top (iOS bounce): more of the gradient's top colour, not a gap */}
        <View style={styles.overscroll} />

        {/* Hero: title and the overall insight on the gradient */}
        <View onLayout={(e: LayoutChangeEvent) => setHeroHeight(e.nativeEvent.layout.height)} style={{ paddingTop: insets.top + space.lg, paddingBottom: PANEL_RADIUS + space.xl }}>
          {width > 0 && heroHeight > 0 && <AmbientGradient width={width} height={heroHeight * GRADIENT_STRETCH} />}
          <PageTitle title="Recordings" color="white" trailing={<Avatar initials={initials(profile)} />} />

          <View style={styles.insight}>
            <Icon name="lightbulb" size={28} color="lamp" />
            <View style={{ flex: 1 }}>
              <AppText color="text" accessibilityRole="summary">
                {insight.text}
              </AppText>
              {insight.action && <Button label={insight.action.label} onPress={act} style={styles.insightAction} />}
            </View>
          </View>
        </View>

        {/* The list */}
        <View style={[styles.panel, { paddingBottom: TAB_BAR_CLEARANCE + insets.bottom }]}>
          {byMonth(nights).map((month) => (
            <View key={month.title} style={styles.section}>
              <AppText variant="caption" color="textMuted" accessibilityRole="header" style={styles.sectionTitle}>
                {month.title}
              </AppText>
              {month.nights.map((night, i) => (
                <Pressable
                  key={night.id}
                  onPress={() => onOpen(night)}
                  accessibilityRole="button"
                  accessibilityLabel={`${formatNightDate(night.date)}, ${headline(night)}, ${formatRecorded(night.minutes)}`}
                  style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                >
                  {/* Inset hairline between rows, from the text edge, as on iOS */}
                  {i > 0 && <View style={styles.divider} />}
                  <View style={{ flex: 1 }}>
                    <AppText color="text">{formatNightDate(night.date)}</AppText>
                    {/* The night's takeaway with a small colour-coded status mark (Dew steady, Lamp worth a look) */}
                    <View style={styles.status}>
                      <Icon name={statusMark(sampleState(night, nights)).icon} size={16} color={statusMark(sampleState(night, nights)).color} />
                      <AppText variant="small" color="textMuted" numberOfLines={1} style={{ flexShrink: 1 }}>
                        {`${headline(night)} · ${formatDuration(night.minutes)}`}
                      </AppText>
                    </View>
                  </View>
                  <View style={{ opacity: 0.6 }}>
                    <Icon name="chevron_right" size={20} color="textMuted" />
                  </View>
                </Pressable>
              ))}
            </View>
          ))}
        </View>
      </Animated.ScrollView>

      {/* Compact title bar */}
      <Animated.View pointerEvents="none" style={[styles.bar, { height: insets.top + BAR, paddingTop: insets.top, opacity: barOpacity }]} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <AppText variant="button" color="text">
          Recordings
        </AppText>
      </Animated.View>

      {/* Book a callback / share report: flows to come */}
      <BottomSheet visible={sheet} onClose={() => setSheet(false)}>
        <View />
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background, overflow: 'hidden' },
  overscroll: { position: 'absolute', top: -1000, left: 0, right: 0, height: 1000, backgroundColor: colors.night },
  bar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(11, 16, 32, 0.88)', // Midnight, frosted
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(179, 189, 211, 0.1)',
    ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(20px) saturate(140%)', WebkitBackdropFilter: 'blur(20px) saturate(140%)' } as object) : null),
  },
  insight: { flexDirection: 'row', alignItems: 'flex-start', gap: space.lg, paddingHorizontal: PAGE_SIDE, marginTop: space.xl },
  insightAction: { alignSelf: 'flex-start', marginTop: space.lg },
  panel: {
    flexGrow: 1,
    marginTop: -PANEL_RADIUS,
    borderTopLeftRadius: PANEL_RADIUS,
    borderTopRightRadius: PANEL_RADIUS,
    backgroundColor: colors.background,
    paddingTop: space.xxl,
  },
  section: { marginBottom: space.xxl },
  sectionTitle: { paddingHorizontal: PAGE_SIDE, marginBottom: space.sm, textTransform: 'uppercase', letterSpacing: 1.2 },
  // Calm rows: regular-weight date, roomy (72 pt), faint inset lines, a quiet chevron
  row: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: PAGE_SIDE, paddingVertical: space.lg },
  status: { flexDirection: 'row', alignItems: 'center', gap: space.xs, marginTop: 2 },
  rowPressed: { backgroundColor: 'rgba(238, 241, 247, 0.05)' }, // Moon at 5%: the iOS row highlight
  divider: { position: 'absolute', top: 0, left: PAGE_SIDE, right: PAGE_SIDE, height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(179, 189, 211, 0.1)' }, // Mist at 10%
});

import React, { useEffect, useRef, useState } from 'react';
import { Animated, AppState, PanResponder, Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AmbientGradient, AppText, Avatar, Icon, PAGE_SIDE, PageTitle, PermissionSheet, RecordDial, SettingsCard, SettingsRow, TAB_BAR_CLEARANCE, type DialRect } from '../components';
import { initials, useProfile } from '../lib/profile';
import { refreshPermissions, usePermissionStatus, type PermissionKind } from '../lib/permissionStatus';
import { needsNotes, summarize, useNightNotes } from '../lib/nightNotes';
import { MICROPHONE_OFF, NOTIFICATIONS_OFF, randomTips, type Tip } from '../lib/tips';
import { colors, motion, radius, space, type, useInsets, useReducedMotion } from '../theme';

const native = motion.useNativeDriver;
const PANEL_RADIUS = 32;
const DIAL_MAX = 180; // present, not loud
const DIAL_LABEL = 56; // room under the dial for its two lines

/**
 * Home: tap the dial to start. Recording runs until you stop it when you wake (no stop time to
 * choose at bedtime; it stops by itself after 12 hours as a safety net).
 *
 * Layers, back to front:
 *   1. A night-to-blue gradient with a slow, faint drift of light (ambient preset), so the screen feels alive.
 *   2. The tip sheet (Breath): the charging tip always in view; more tips underneath.
 *      While a permission is off: "Microphone is off" takes the top spot, and a notifications
 *      tip joins the ones underneath, each with "Turn on" (opens PermissionSheet).
 *   3. The panel (Midnight, grabber on top). Pull it down to uncover the other tips; let go and it
 *      goes back to its place. Tapping the grabber keeps them open until tapped again.
 * Direction: Figma "Frame 1" (Oct 2026).
 */
/** Where the record button sits, in Home's own coordinates, so Recording can grow out of it. */
export type RecordOrigin = { x: number; y: number; r: number };

export function HomeScreen({ onStartRecording, onOpenNotes, onOpenProfile }: { onStartRecording?: (from: RecordOrigin) => void; onOpenNotes?: () => void; onOpenProfile?: () => void }) {
  const notes = useNightNotes();
  const rootRef = useRef<View>(null);
  const insets = useInsets();
  const profile = useProfile();
  const [width, setWidth] = useState(0);
  const [baseTips] = useState(() => randomTips(4)); // charging first, then a different few each visit
  const mic = usePermissionStatus('microphone');
  const notifications = usePermissionStatus('notifications');
  const micOff = mic !== 'granted';
  const tips = [...(micOff ? [MICROPHONE_OFF] : []), baseTips[0], ...(notifications !== 'granted' ? [NOTIFICATIONS_OFF] : []), ...baseTips.slice(1)];

  // Asking again in context (tip "Turn on", or the dial while the mic is off).
  const [permSheet, setPermSheet] = useState<PermissionKind | null>(null);
  const [permKind, setPermKind] = useState<PermissionKind>('microphone'); // stays put while the sheet closes
  const pendingStart = useRef<DialRect | null>(null); // the hold that asked for the mic: start once allowed
  const ask = (kind: PermissionKind) => {
    setPermKind(kind);
    setPermSheet(kind);
  };

  // On device: read permissions on open and whenever the app comes back (e.g. from Settings).
  useEffect(() => {
    refreshPermissions();
    const sub = AppState.addEventListener('change', (state) => state === 'active' && refreshPermissions());
    return () => sub.remove();
  }, []);

  // Tip sheet geometry, from the top of the stage: where the first tip ends (the panel's resting
  // top) and where the last one ends (how far the panel moves to uncover them all).
  const [stageTop, setStageTop] = useState(0);
  const [peek, setPeek] = useState(0);
  const [full, setFull] = useState(0);
  const { open, toggle, pan, pull } = usePullDown(Math.max(0, full - peek));

  const [dialRoom, setDialRoom] = useState({ width: 0, height: 0 });
  const dialSize = Math.floor(Math.min(DIAL_MAX, dialRoom.width, dialRoom.height - DIAL_LABEL));

  // Tapped: hand over where the button is (window → Home coordinates, allowing for the preview's
  // scaled phone frame). Recording runs until you stop it in the morning (12-hour safety cap).
  const startRecording = (dial: DialRect, micJustAllowed = false) => {
    if (micOff && !micJustAllowed) {
      pendingStart.current = dial;
      return ask('microphone');
    }
    rootRef.current?.measureInWindow((rx, ry, rw) => {
      const k = width > 0 && rw > 0 ? width / rw : 1;
      onStartRecording?.({ x: (dial.x - rx + dial.width / 2) * k, y: (dial.y - ry + dial.height / 2) * k, r: (dial.button / 2) * k });
    });
  };

  // Latest startRecording (micOff changes once allowed), for the sheet's onAllowed.
  const startRecordingRef = useRef(startRecording);
  startRecordingRef.current = startRecording;

  // The gradient fills what shows above the tip sheet, brightest where the sheet begins.
  const heroHeight = stageTop > 0 ? stageTop + radius.sheet : 240;

  return (
    <View ref={rootRef} style={styles.root} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
      <StatusBar style="light" />
      {width > 0 && <AmbientGradient width={width} height={heroHeight} />}

      <View style={{ paddingTop: insets.top + space.lg }}>
        <PageTitle title="Home" color="white" trailing={<Avatar initials={initials(profile)} onPress={onOpenProfile} />} />
      </View>

      <View style={styles.stage} onLayout={(e: LayoutChangeEvent) => setStageTop(e.nativeEvent.layout.y)}>
        <TipSheet tips={tips} expanded={open} onPeek={setPeek} onFull={setFull} onAction={ask} />

        <Animated.View {...pan.panHandlers} style={[styles.panel, { top: peek, transform: [{ translateY: pull }] }]}>
          <Pressable
            onPress={toggle}
            style={styles.grabZone}
            accessibilityRole="button"
            accessibilityLabel={open ? 'Hide tips' : 'Show more tips'}
            accessibilityState={{ expanded: open }}
          >
            <View style={styles.grabber} />
          </Pressable>

          <View style={{ marginTop: space.sm }}>
            <SettingsCard>
              {/* After a first night: a gentle nudge while tonight's notes are empty */}
              <SettingsRow
                icon="edit_note"
                title="Night Notes"
                subtitle={notes.tonight.length ? summarize(notes.tonight) : 'Add sleep context'}
                alert={needsNotes(notes) ? 'Not added for tonight yet' : undefined}
                onPress={onOpenNotes}
              />
            </SettingsCard>
          </View>

          {/* The dial takes the room that's left, up to its full size */}
          <View style={styles.dialArea} onLayout={(e: LayoutChangeEvent) => setDialRoom(e.nativeEvent.layout)}>
            {dialSize > 0 && <RecordDial size={dialSize} note="Completely private. Recorded on your phone." ready={!micOff} onStart={startRecording} />}
          </View>
        </Animated.View>
      </View>

      <PermissionSheet
        kind={permKind}
        visible={permSheet !== null}
        onAllowed={() => {
          setPermSheet(null);
          const dial = pendingStart.current;
          pendingStart.current = null;
          if (dial && permKind === 'microphone') startRecordingRef.current(dial, true); // they were starting: carry on
        }}
        onNotNow={() => {
          setPermSheet(null);
          pendingStart.current = null;
        }}
      />

    </View>
  );
}

/**
 * Elastic pull-down for the panel: it follows the finger to uncover the tips, with growing
 * resistance past the last one, and goes back to its place when let go (fast ease-out).
 * Tapping the grabber (or a screen reader's activate) keeps the tips open until tapped again:
 * the single-tap alternative to dragging (WCAG 2.5.7).
 * Reduce Motion: still follows the finger, but goes back without animating.
 */
function usePullDown(reveal: number) {
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);
  const pull = useRef(new Animated.Value(0)).current;
  const s = useRef({ open: false, reveal: 0, reduced: false }).current;
  s.reveal = reveal;
  s.reduced = reduced;

  const settle = (toOpen: boolean) => {
    s.open = toOpen;
    setOpen(toOpen);
    const to = toOpen ? s.reveal : 0;
    if (s.reduced) pull.setValue(to);
    else Animated.timing(pull, { toValue: to, duration: motion.fast.duration, easing: motion.fast.easeOut, useNativeDriver: native }).start();
  };

  // Tips changed size (text size, rotation): keep the panel where it belongs.
  useEffect(() => {
    if (s.open) pull.setValue(reveal);
  }, [reveal]); // eslint-disable-line react-hooks/exhaustive-deps

  // Rubber band: 1:1 up to the last tip, then each extra point of drag moves the panel less.
  const stretch = (d: number) => (d <= s.reveal ? d : s.reveal + (d - s.reveal) / (1 + (d - s.reveal) / 120));

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 8 && Math.abs(g.dy) > Math.abs(g.dx) * 1.5,
      onPanResponderGrant: () => pull.stopAnimation(),
      onPanResponderMove: (_, g) => pull.setValue(Math.max(0, stretch((s.open ? s.reveal : 0) + g.dy))),
      onPanResponderRelease: () => settle(false), // let go: back to its place
      onPanResponderTerminate: () => settle(false),
    }),
  ).current;

  return { open, toggle: () => settle(!s.open), pan, pull };
}

/**
 * The sheet behind the panel: tips in Breath with Midnight text (9.4:1). The first is always
 * in view; the rest are hidden from screen readers until the panel is pulled down.
 */
function TipSheet({
  tips,
  expanded,
  onPeek,
  onFull,
  onAction,
}: {
  tips: Tip[];
  expanded: boolean;
  onPeek: (y: number) => void;
  onFull: (y: number) => void;
  onAction: (kind: PermissionKind) => void;
}) {
  return (
    <View style={styles.tipSheet}>
      <View onLayout={(e: LayoutChangeEvent) => onFull(e.nativeEvent.layout.height)}>
        {tips.map((tip, i) => {
          const hidden = i > 0 && !expanded;
          return (
            <View
              key={tip.id}
              style={[styles.tip, i > 0 && styles.tipDivider]}
              onLayout={i === 0 ? (e: LayoutChangeEvent) => onPeek(e.nativeEvent.layout.y + e.nativeEvent.layout.height) : undefined}
              accessible={!tip.action} // with a button inside, let both be reached on their own
              accessibilityElementsHidden={hidden}
              importantForAccessibility={hidden ? 'no-hide-descendants' : 'yes'}
            >
              <View style={styles.tipBadge}>
                <Icon name={tip.icon} size={24} color="onAccent" />
              </View>
              <AppText color="onAccent" style={{ flex: 1 }}>
                {tip.text}
              </AppText>
              {tip.action && (
                <Pressable onPress={() => onAction(tip.action!)} hitSlop={4} style={({ pressed }) => [styles.tipAction, pressed && { opacity: 0.8 }]} accessibilityRole="button" accessibilityLabel={`Turn on ${tip.action}`}>
                  <AppText variant="small" color="text" style={{ fontFamily: type.button.fontFamily, fontWeight: type.button.fontWeight }}>
                    Turn on
                  </AppText>
                </Pressable>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background, overflow: 'hidden' },
  stage: { flex: 1, marginTop: space.xl },
  tipSheet: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.accent,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingBottom: PANEL_RADIUS, // runs under the panel's rounded corners
  },
  tip: { flexDirection: 'row', alignItems: 'center', gap: space.lg, paddingHorizontal: PAGE_SIDE, paddingVertical: space.lg },
  tipDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(11, 16, 32, 0.2)' },
  // Midnight pill on Breath: Moon label at 15:1. 36 pt tall plus 4 pt hit slop each side = 44 pt target.
  tipAction: { minHeight: 36, paddingHorizontal: space.lg, borderRadius: radius.pill, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  tipBadge: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(11, 16, 32, 0.1)' },
  panel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: PANEL_RADIUS,
    borderTopRightRadius: PANEL_RADIUS,
    backgroundColor: colors.background,
    paddingHorizontal: PAGE_SIDE,
    paddingBottom: TAB_BAR_CLEARANCE,
  },
  grabZone: { height: 44, alignItems: 'center', justifyContent: 'center' },
  grabber: { width: 36, height: 5, borderRadius: 3, backgroundColor: colors.textMuted },
  dialArea: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: space.xs, marginBottom: space.sm },
});

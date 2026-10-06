import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, View, type ImageSourcePropType } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AppText, Button, PermissionSheet } from '../components';
import { askPermission, type PermissionKind } from '../lib/permissionStatus';
import { colors, space, useInsets } from '../theme';

const ART = 200; // graphic size (pt)
const SIDE = space.gutter; // standard screen edge

type Props = {
  kind: PermissionKind;
  art: ImageSourcePropType;
  title: string;
  body: string;
  cta: string;
  /** Next step: after allowing, or after "Not now". */
  onDone?: () => void;
};

/**
 * Asks for one permission, explaining why first (Figma "iPhone 16 & 17 Pro - 7/8").
 * Skip top right; graphic centred in the space above; headline, body and the
 * Allow button anchored low, in thumb reach. Allow → system prompt → next step.
 *
 * Second chance in a bottom sheet (PermissionSheet): after Skip, why it matters; after
 * "Don't Allow", how to turn it on in Settings. "Not now" moves on, and the sheet says it can be
 * turned on later from Home (where it comes back in context: see HomeScreen).
 */
export function PermissionScreen({ kind, art, title, body, cta, onDone }: Props) {
  const insets = useInsets();
  const [asking, setAsking] = useState(false);
  const [sheet, setSheet] = useState(false);

  const allow = async () => {
    if (asking) return;
    setAsking(true);
    const status = await askPermission(kind);
    setAsking(false);
    if (status === 'granted') onDone?.();
    else setSheet(true); // said no: the sheet shows how to turn it on in Settings
  };

  const next = () => {
    setSheet(false);
    onDone?.();
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom + space.xxl * 2 }]}>
      <StatusBar style="light" />

      <View style={styles.topBar}>
        <Pressable onPress={() => setSheet(true)} style={styles.skip} accessibilityRole="button" accessibilityLabel="Skip">
          <AppText variant="small" style={styles.skipText}>
            Skip
          </AppText>
        </Pressable>
      </View>

      {/* Graphic is there from the start: no entrance or ambient animation on these screens */}
      <View style={styles.artArea}>
        <Image source={art} style={{ width: ART, height: ART }} accessible={false} />
      </View>

      <View style={styles.text}>
        <AppText variant="headline" accessibilityRole="header">
          {title}
        </AppText>
        <AppText color="textMuted" style={{ marginTop: space.sm }}>
          {body}
        </AppText>
        <Button label={cta} onPress={allow} style={{ marginTop: space.xl }} />
      </View>

      <PermissionSheet kind={kind} visible={sheet} onAllowed={next} onNotNow={next} onDismiss={() => setSheet(false)} note="You can turn this on any time from Home." />
    </View>
  );
}

// Copy as supplied by design (Oct 2026).

export function MicrophonePermissionScreen({ onDone }: { onDone?: () => void }) {
  return (
    <PermissionScreen
      kind="microphone"
      art={require('../../assets/permissions/microphone.png')}
      title="Let Airese listen while you sleep."
      body="Allow microphone access to capture snoring and breathing. Recordings stay private on your device unless you choose to share them."
      cta="Allow microphone"
      onDone={onDone}
    />
  );
}

export function NotificationsPermissionScreen({ onDone }: { onDone?: () => void }) {
  return (
    <PermissionScreen
      kind="notifications"
      art={require('../../assets/permissions/notifications.png')}
      title="Turn on notifications."
      body="We’ll remind you to start recording, and let you know when it stops. Just two notifications a day."
      cta="Allow notifications"
      onDone={onDone}
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  topBar: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: space.lg },
  // 44 pt tap target; text lines up 32 pt from the right edge, as in Figma.
  skip: { minWidth: 44, height: 44, paddingHorizontal: space.lg, alignItems: 'center', justifyContent: 'center' },
  skipText: { textTransform: 'uppercase', letterSpacing: 1 },
  artArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  // Same height on every permission screen (room for a 2-line headline, 4 lines of body and the
  // button), so the graphic sits in the same place as you move from one screen to the next.
  text: { paddingHorizontal: SIDE, minHeight: 240, justifyContent: 'flex-end' },
});

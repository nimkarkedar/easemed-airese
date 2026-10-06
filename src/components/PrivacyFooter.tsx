import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, space } from '../theme';
import { AppText } from './AppText';
import { Icon } from './Icon';

/**
 * "Private by design" (PRD §8) as the page footer: big and quiet, for anyone who scrolls to the end.
 * Not a card: no surface, just space, a large lock and a few words, with a link to more (L2).
 * Copy must stay true to the recording architecture: no claims Engineering hasn't confirmed.
 */
export function PrivacyFooter({ onMore }: { onMore?: () => void }) {
  return (
    <View style={styles.footer} accessibilityRole="summary">
      <View style={styles.icon}>
        <Icon name="lock" size={36} color="accent" />
      </View>
      <AppText variant="heading" color="text" accessibilityRole="header" style={styles.center}>
        Private by design
      </AppText>
      <AppText color="textMuted" style={[styles.center, { marginTop: space.sm }]}>
        Airese analyses your sleep sounds on your phone. Your recordings stay on your device.
      </AppText>
      {onMore ? (
        <AppText variant="small" color="accent" onPress={onMore} accessibilityRole="link" style={{ marginTop: space.lg, minHeight: 24 }}>
          How Airese keeps it private
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    alignItems: 'center',
    paddingHorizontal: space.xl,
    paddingTop: space.xxl * 2,
    paddingBottom: space.xxl,
    marginTop: space.xxl,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  icon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(157, 180, 255, 0.12)', marginBottom: space.xl },
  center: { textAlign: 'center' },
});

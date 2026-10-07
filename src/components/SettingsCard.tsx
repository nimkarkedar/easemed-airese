import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, space } from '../theme';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

/**
 * A card of tappable rows, outlined in Breath, with an optional small title (e.g. Home's Night Notes).
 * Rows are separated by hairlines. Each row is one button, at least 64 pt tall.
 */
export function SettingsCard({ title, children }: { title?: string; children: React.ReactNode }) {
  const rows = React.Children.toArray(children);
  return (
    <View style={styles.card}>
      {title ? (
        <AppText variant="small" color="textMuted" accessibilityRole="header" style={styles.title}>
          {title}
        </AppText>
      ) : null}
      {rows.map((row, i) => (
        <View key={i} style={i > 0 && styles.divider}>
          {row}
        </View>
      ))}
    </View>
  );
}

/**
 * One row: icon, title and a line of detail, with a trailing hint of what a tap does
 * (`edit`: change this here; `chevron_right`: opens somewhere else).
 */
export function SettingsRow({
  icon,
  title,
  subtitle,
  trailing = 'chevron_right',
  alert,
  onPress,
  accessibilityLabel,
}: {
  icon: IconName;
  title: string;
  subtitle: string;
  trailing?: IconName;
  /** A gentle nudge before the trailing icon (Lamp caution triangle), with what it means for screen readers. */
  alert?: string;
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${accessibilityLabel ?? `${title}, ${subtitle}`}${alert ? `. ${alert}` : ''}`}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
    >
      <Icon name={icon} size={28} color="text" />
      <View style={{ flex: 1 }}>
        <AppText variant="button" color="text">
          {title}
        </AppText>
        <AppText variant="small" color="textMuted" numberOfLines={1}>
          {subtitle}
        </AppText>
      </View>
      {alert ? <Icon name="warning" size={20} color="lamp" /> : null}
      <Icon name={trailing} size={24} color="textMuted" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.accent, // Breath outline (9:1 on Midnight)
  },
  title: { paddingHorizontal: space.lg, paddingTop: space.md },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.divider },
  row: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: space.lg, paddingHorizontal: space.lg, paddingVertical: space.md },
});

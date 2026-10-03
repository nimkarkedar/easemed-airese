import React from 'react';
import { StyleSheet, View } from 'react-native';
import { space, type ColorName } from '../theme';
import { AppText } from './AppText';

/** Standard screen edge, shared by page titles and content across the app. */
export const PAGE_SIDE = space.gutter;

/**
 * Large page title for top-level screens (Home, History): same size, inset and row height
 * everywhere, with an optional control on the right (e.g. the avatar), centred on the title line.
 * The screen adds the top spacing: insets.top + space.lg.
 */
export function PageTitle({ title, trailing, color = 'text' }: { title: string; trailing?: React.ReactNode; color?: ColorName }) {
  return (
    <View style={styles.row}>
      <AppText variant="title" color={color} accessibilityRole="header" numberOfLines={1} style={{ flexShrink: 1 }}>
        {title}
      </AppText>
      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.lg, paddingHorizontal: PAGE_SIDE },
});

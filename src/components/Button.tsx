import React from 'react';
import { Pressable, type ViewStyle } from 'react-native';
import { colors, radius, space } from '../theme';
import { AppText } from './AppText';

type Props = {
  label: string;
  onPress?: () => void;
  /** primary: the one next step on a screen. quiet: text-only alternative. */
  variant?: 'primary' | 'quiet';
  /** Layout only (e.g. alignSelf to hug the label). Stretches to its container by default. */
  style?: ViewStyle;
};

/** Pill button, 48 pt tall. Primary is filled with the accent (Breath) and has a Midnight label. */
export function Button({ label, onPress, variant = 'primary', style }: Props) {
  const primary = variant === 'primary';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        {
          height: 48,
          borderRadius: radius.pill,
          paddingHorizontal: space.xl,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: primary ? colors.accent : 'transparent',
          opacity: pressed ? 0.8 : 1,
        },
        style,
      ]}
    >
      <AppText variant="button" color={primary ? 'onAccent' : 'text'}>
        {label}
      </AppText>
    </Pressable>
  );
}

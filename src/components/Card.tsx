import React from 'react';
import { View, type ViewStyle } from 'react-native';
import { colors, radius, space } from '../theme';

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return (
    <View style={[{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: space.gutter }, style]}>
      {children}
    </View>
  );
}

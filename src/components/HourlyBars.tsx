import React, { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { colors, space } from '../theme';
import { AppText } from './AppText';

const GAP = 6;

/**
 * Snoring minutes in each hour of the night (Ember; hours with none show a faint neutral stub),
 * hour labels underneath, the busiest hour labelled with its minutes. `compact`: a small sparkline for a square card (no labels).
 */
export function HourlyBars({ hours, compact = false, color = colors.dataSnoring, what = 'Snoring', unit = 'min' }: { hours: { label: string; minutes: number }[]; compact?: boolean; color?: string; what?: string; unit?: string }) {
  const [width, setWidth] = useState(0);
  const H = compact ? 44 : 120;
  const max = Math.max(1, ...hours.map((h) => h.minutes));
  const peak = hours.findIndex((h) => h.minutes === max);
  const gap = compact ? 3 : GAP;
  const barW = width > 0 ? (width - gap * (hours.length - 1)) / hours.length : 0;

  return (
    <View accessible={!compact} accessibilityLabel={`${what} by hour. Most at ${hours[peak]?.label}: ${max} ${unit}.`}>
      <View style={{ height: H }} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
        {width > 0 &&
          hours.map((h, i) => (
            <View key={i} style={{ position: 'absolute', left: i * (barW + gap), width: barW, bottom: 0, alignItems: 'center' }}>
              {!compact && i === peak && (
                <AppText variant="small" color="text" style={styles.peak}>
                  {`${h.minutes} ${unit}`}
                </AppText>
              )}
              <View style={{ width: '100%', height: Math.max(3, (h.minutes / max) * (H - (compact ? 0 : 26))), borderRadius: compact ? 2 : 4, backgroundColor: h.minutes ? color : 'rgba(238, 241, 247, 0.14)' }} />
            </View>
          ))}
      </View>
      {!compact && (
        <View style={styles.labels}>
          {hours.map((h, i) => (
            <AppText key={i} variant="small" color="textMuted" style={{ width: barW + gap, textAlign: 'center', opacity: i % 2 === 0 ? 1 : 0 }}>
              {h.label.replace(' ', ' ')}
            </AppText>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  peak: { position: 'absolute', bottom: '100%', width: 80, textAlign: 'center', marginBottom: space.xs },
  labels: { flexDirection: 'row', marginTop: space.sm },
});

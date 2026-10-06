import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';
import { colors, gradients, radius, space, type ColorName } from '../theme';
import { AppText } from './AppText';
import { Card } from './Card';
import { Icon, type IconName } from './Icon';
import { InfoButton } from './InfoButton';

/**
 * A plain-language takeaway: a short title and a sentence or two (PRD §5, §11).
 * `lead`: the night's main takeaway, set larger; otherwise a section-sized title.
 * Optional icon (e.g. the Lamp lightbulb) and an (i) for "why does it say this?" (L2 sheet).
 * Tones: `plain` (Deep), `hero` (the night's takeaway: Deep lifting into blue with a soft Breath glow),
 * `warm` (a faint Lamp wash, for "what this means"). Optional children sit underneath (e.g. the key number).
 */
export function InsightCard({
  title,
  body,
  lead = false,
  icon,
  onInfo,
  infoLabel,
  tone = 'plain',
  iconColor = 'lamp',
  children,
}: {
  title: string;
  body?: string;
  lead?: boolean;
  icon?: IconName;
  onInfo?: () => void;
  infoLabel?: string;
  tone?: 'plain' | 'hero' | 'warm';
  /** Icon colour: Lamp by default; a status mark passes its own (e.g. Dew for a steady night). */
  iconColor?: ColorName;
  children?: React.ReactNode;
}) {
  return (
    <Card style={tone === 'warm' ? styles.warm : tone === 'hero' ? styles.hero : undefined}>
      {tone === 'hero' && <HeroBackground />}
      <View style={styles.row}>
        {icon ? (
          <View style={{ marginTop: 2 }}>
            <Icon name={icon} size={24} color={iconColor} />
          </View>
        ) : null}
        <View style={{ flex: 1 }}>
          <View style={styles.titleRow}>
            <AppText variant="heading" color="text" accessibilityRole="header" style={{ flex: 1 }}>
              {title}
            </AppText>
            {onInfo ? <InfoButton size={22} onPress={onInfo} label={infoLabel ?? `About ${title}`} /> : null}
          </View>
          {body ? (
            <AppText color={lead ? 'text' : 'textMuted'} style={{ marginTop: space.sm }}>
              {body}
            </AppText>
          ) : null}
        </View>
      </View>
      {children}
    </Card>
  );
}

function HeroBackground() {
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none">
      <Defs>
        <LinearGradient id="heroCard" x1="0" y1="0" x2="1" y2="1">
          {gradients.hero.map((s) => (
            <Stop key={s.offset} offset={s.offset} stopColor={s.color} />
          ))}
        </LinearGradient>
        <RadialGradient id="heroGlow" cx="90%" cy="0%" r="70%">
          <Stop offset="0" stopColor={colors.accent} stopOpacity={0.22} />
          <Stop offset="1" stopColor={colors.accent} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#heroCard)" />
      <Circle cx="90%" cy="0%" r="70%" fill="url(#heroGlow)" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  hero: { overflow: 'hidden', borderRadius: radius.xl, paddingVertical: space.xl },
  warm: { backgroundColor: colors.tintBreathing, borderWidth: 1, borderColor: 'rgba(244, 182, 95, 0.22)' },
  row: { flexDirection: 'row', gap: space.md },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
});

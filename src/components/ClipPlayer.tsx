import React, { useState } from 'react';
import { Animated, Pressable, StyleSheet, View, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';
import type { Clip } from '../lib/nightDetails';
import { colors, space } from '../theme';
import { AppText } from './AppText';
import { clipColor, type ClipPlayerState as Player } from './AudioSnippet';
import { Icon } from './Icon';

const BARS = 44;
const WAVE_H = 64;
const KNOB = 18;

const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/** A fuller waveform from a clip's peaks: same shape, more bars, a soft envelope. */
function shape(peaks: number[]) {
  return Array.from({ length: BARS }, (_, i) => {
    const p = peaks[Math.floor((i / BARS) * peaks.length)];
    const wave = 0.75 + 0.25 * Math.sin(i * 1.7);
    return Math.max(0.12, Math.min(1, p * wave));
  });
}

/**
 * The large clip player (after the reference): time and description, a big waveform in the
 * clip's data colour that fills as it plays, a scrubber with a knob (tap or drag along it to
 * jump), elapsed and total time, and a round play / pause button.
 */
export function ClipPlayer({ clip, time, player }: { clip: Clip; time: string; player: Player }) {
  const [width, setWidth] = useState(0);
  const playing = player.playing === clip.id;
  const position = player.positionOf(clip.id);
  const color = clipColor(clip);
  const bars = shape(clip.peaks);
  const fill = position ? position.interpolate({ inputRange: [0, 1], outputRange: [0, width] }) : 0;

  const seekAt = (e: GestureResponderEvent) => width > 0 && player.seek(clip, e.nativeEvent.locationX / width);

  const wave = (opacity: number) => (
    <View style={styles.wave}>
      {bars.map((b, i) => (
        <View key={i} style={{ flex: 1, height: b * WAVE_H, borderRadius: 2, backgroundColor: color, opacity }} />
      ))}
    </View>
  );

  return (
    <View>
      <AppText variant="heading" color="text">
        {time}
      </AppText>
      <AppText variant="small" color="textMuted" style={{ marginTop: 2 }}>
        {`${clip.seconds} sec · ${clip.type}`}
      </AppText>

      {/* Waveform: dim underneath, full colour revealed as it plays */}
      <Pressable onPress={seekAt} accessibilityRole="adjustable" accessibilityLabel={`${time} clip, ${clip.seconds} seconds`} style={{ marginTop: space.xl }} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
        {wave(0.3)}
        {position ? <Animated.View style={[StyleSheet.absoluteFill, { overflow: 'hidden', width: fill }]}><View style={{ width }}>{wave(1)}</View></Animated.View> : null}
      </Pressable>

      {/* Scrubber */}
      <Pressable onPress={seekAt} hitSlop={{ top: 14, bottom: 14 }} style={styles.scrub} accessible={false}>
        <View style={styles.track} />
        <Animated.View style={[styles.done, { width: fill, backgroundColor: color }]} />
        <Animated.View style={[styles.knob, { transform: [{ translateX: position ? Animated.subtract(fill, KNOB / 2) : -KNOB / 2 }] }]} />
      </Pressable>
      <View style={styles.times}>
        <AppText variant="small" color="textMuted">
          {mmss(position ? player.elapsed : 0)}
        </AppText>
        <AppText variant="small" color="textMuted">
          {mmss(clip.seconds)}
        </AppText>
      </View>

      <Pressable
        onPress={() => player.toggle(clip)}
        accessibilityRole="button"
        accessibilityLabel={playing ? 'Pause' : `Play ${time} clip`}
        style={({ pressed }) => [styles.play, pressed && { opacity: 0.85 }]}
      >
        <Icon name={playing ? 'pause_fill' : 'play_fill'} size={30} color="onAccent" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wave: { height: WAVE_H, flexDirection: 'row', alignItems: 'center', gap: 3 },
  scrub: { height: KNOB + 8, justifyContent: 'center', marginTop: space.lg },
  track: { height: 4, borderRadius: 2, backgroundColor: 'rgba(238, 241, 247, 0.15)' },
  done: { position: 'absolute', left: 0, height: 4, borderRadius: 2 },
  knob: { position: 'absolute', left: 0, width: KNOB, height: KNOB, borderRadius: KNOB / 2, backgroundColor: colors.text },
  times: { flexDirection: 'row', justifyContent: 'space-between', marginTop: space.xs },
  play: { alignSelf: 'center', width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent, marginTop: space.md },
});

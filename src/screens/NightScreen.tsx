import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, View } from 'react-native';
import {
  AppText,
  AudioSnippet,
  BenchmarkScale,
  BigNumber,
  CareCTA,
  ClipPlayer,
  ComparisonIndicator,
  DataCard,
  DetailPage,
  ExplainSheet,
  HourlyBars,
  Icon,
  InsightCard,
  LargeSheet,
  LoudnessBars,
  NightTimeline,
  PAGE_SIDE,
  PrivacyFooter,
  RecentNightsChart,
  ScoreRing,
  asleepStretches,
  scoreColor,
  useClipPlayer,
  type ClipPlayerState,
} from '../components';
import { benchmarks, zoneOf, type Benchmark } from '../lib/benchmarks';
import {
  EXPLAIN,
  busiestWindow,
  clockAt,
  loudnessLine,
  meaning,
  nightDetails,
  shortDuration,
  statusMark,
  summary,
  trend,
  trendWords,
  type ExplainKey,
  type NightDetails,
  type NightState,
} from '../lib/nightDetails';
import { formatNightDate, formatRecorded, formatSpan, type Night } from '../lib/recordings';
import { formatDuration } from '../lib/time';
import { colors, motion, radius, space, type } from '../theme';

/** What a card opens: a large sheet. */
type Sheet = 'details' | 'snoring' | 'breathing' | 'sleep' | 'loudness' | 'timeline' | 'clips' | 'recent';
const SHEET_TITLE: Record<Sheet, string> = {
  details: 'All details',
  snoring: 'Snoring',
  breathing: 'Breathing interruptions',
  sleep: 'Sleep',
  loudness: 'How loud',
  timeline: 'When did it happen?',
  clips: 'All clips',
  recent: 'Your recent nights',
};

const PROCESSING_DEMO_MS = 6000; // prototype: how long "Looking through your night" shows before results

/**
 * Recording Details (L1): one night as a series of cards in two shapes (wide and square). Each
 * card has a visual, one line of insight and "›" to a large sheet with the full story.
 *
 * Emphasis, top to bottom: scores at a glance (the way into All details) → the takeaway →
 * snoring and breathing → hear it → when → sleep and loudness → recent nights → what it means →
 * privacy footer. The sticky action follows the level of concern.
 * Colour by data: Ember snoring, Iris breathing, Dew sleep. Type: four sizes, regular and semibold.
 * States: processing, poor audio, first night (no comparisons), ordinary, unusual, repeated pattern.
 */
export function NightScreen({ night, state: initialState, onBack, slideIn = Platform.OS === 'web' }: { night: Night; state: NightState; onBack: () => void; slideIn?: boolean }) {
  const [state, setState] = useState(initialState);
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [lastSheet, setLastSheet] = useState<Sheet>('details');
  const [explain, setExplain] = useState<ExplainKey | 'care' | null>(null);
  const player = useClipPlayer();
  const d = nightDetails(night, state === 'processing' ? 'steady' : state);
  const [selected, setSelected] = useState(d.featured[d.featured.length - 1]?.id); // clip in the big player

  useEffect(() => {
    if (state !== 'processing') return;
    const id = setTimeout(() => setState('steady'), PROCESSING_DEMO_MS);
    return () => clearTimeout(id);
  }, [state]);

  const open = (s: Sheet) => {
    setLastSheet(s);
    setSheet(s);
  };

  const ready = state !== 'processing' && state !== 'poor';
  const concern = state === 'pattern';
  const sum = summary(d);
  const means = meaning(d);
  const usual = d.baseline;
  const marks = benchmarks(d);
  const lead = d.featured.find((c) => c.id === selected) ?? d.featured[0];
  const status = statusMark(state);

  return (
    <>
      <DetailPage
        backLabel="Recordings"
        title={formatNightDate(night.date)}
        subtitle={`${formatRecorded(night.minutes)} · ${formatSpan(night)}`}
        onBack={onBack}
        slideIn={slideIn}
        footer={state === 'processing' ? undefined : (leave) => <CareCTA concern={concern} onPress={() => (concern ? setExplain('care') : leave(onBack))} />}
      >
        <View style={styles.body}>
          {state === 'processing' && <Processing />}

          {state === 'poor' && (
            <>
              <InsightCard lead tone="hero" title="We couldn’t hear enough clearly last night" body="Try placing your phone closer to your bed tonight." />
              <View style={{ flex: 1 }} />
              <PrivacyFooter onMore={() => setExplain('privacy')} />
            </>
          )}

          {ready && (
            <>
              {/* Scores at a glance: the way into All details */}
              <DataCard
                label="Tonight at a glance"
                onPress={() => open('details')}
                accessibilityLabel={`Tonight at a glance: ${marks
                  .slice(0, 4)
                  .map((b) => `${b.name} ${b.display}, ${zoneOf(b).word}`)
                  .join('; ')}. See all details`}
              >
                <View style={styles.glance}>
                  <Glance color={scoreColor.rest} icon="bedtime" fraction={d.restScore / 100} value={String(d.restScore)} label="Rest" />
                  <Glance color={scoreColor.snoring} icon="graphic_eq" fraction={mark(marks, 'snoring').value / 40} value={mark(marks, 'snoring').display} label="Snoring" />
                  <Glance color={scoreColor.breathing} icon="airwave" fraction={mark(marks, 'breathing').value / 20} value={String(d.breathingEvents.length)} label="Breathing" />
                  <Glance color={scoreColor.sleep} icon="schedule" fraction={d.sleepMinutes / 540} value={shortDuration(d.sleepMinutes)} label="Sleep" />
                </View>
              </DataCard>

              {/* The takeaway, with a colour-coded status mark */}
              <InsightCard lead tone="hero" icon={status.icon} iconColor={status.color} title={sum.headline} body={sum.body}>
                {lead && (
                  <Pressable
                    onPress={() => player.toggle(lead)}
                    accessibilityRole="button"
                    accessibilityLabel={player.playing === lead.id ? 'Pause' : `Have a listen: ${clockAt(d, lead.at)}`}
                    style={({ pressed }) => [styles.listen, pressed && { opacity: 0.85 }]}
                  >
                    <Icon name={player.playing === lead.id ? 'pause_fill' : 'play_fill'} size={18} color="onAccent" />
                    <AppText color="onAccent">{player.playing === lead.id ? 'Pause' : 'Have a listen'}</AppText>
                  </Pressable>
                )}
              </InsightCard>

              {/* Snoring and breathing */}
              <View style={styles.pair}>
                <DataCard shape="square" icon="graphic_eq" tone="snoring" label="Snoring" onPress={() => open('snoring')} accessibilityLabel={`Snoring: ${formatDuration(d.snoringMinutes)}. More`}>
                  <BigNumber value={shortDuration(d.snoringMinutes)} />
                  {usual ? <Trend value={d.snoringMinutes} usual={usual.snoringMinutes} /> : null}
                  <View style={styles.mini}>
                    <HourlyBars compact hours={d.hourly} />
                  </View>
                </DataCard>
                <DataCard shape="square" icon="airwave" tone="breathing" label="Breathing" onPress={() => open('breathing')} accessibilityLabel={`Breathing interruptions: ${d.breathingEvents.length}. More`}>
                  <BigNumber value={String(d.breathingEvents.length)} />
                  {usual ? <Trend value={d.breathingEvents.length} usual={usual.breathingEvents} /> : <Note>Interruptions</Note>}
                  <View style={styles.mini}>
                    <EventStrip d={d} />
                  </View>
                </DataCard>
              </View>

              {/* Hear it */}
              <DataCard title="Hear last night">
                {lead && <ClipPlayer clip={lead} time={clockAt(d, lead.at)} player={player} />}
                <View style={styles.clipChips}>
                  {d.featured.map((c) => (
                    <Pressable
                      key={c.id}
                      onPress={() => setSelected(c.id)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: c.id === lead?.id }}
                      accessibilityLabel={`${clockAt(d, c.at)}, ${c.type}`}
                      style={[styles.clipChip, c.id === lead?.id && styles.clipChipOn]}
                    >
                      <AppText variant="small" color={c.id === lead?.id ? 'text' : 'textMuted'}>
                        {clockAt(d, c.at)}
                      </AppText>
                    </Pressable>
                  ))}
                  <Pressable onPress={() => open('clips')} accessibilityRole="button" accessibilityLabel={`All ${d.clips.length} clips`} style={styles.allClips}>
                    <AppText variant="small" color="accent">{`All ${d.clips.length}`}</AppText>
                    <Icon name="chevron_right" size={18} color="accent" />
                  </Pressable>
                </View>
              </DataCard>

              {/* When */}
              <DataCard title="When did it happen?" insight={`Mostly between ${busiestWindow(d)}.`} onPress={() => open('timeline')}>
                <NightTimeline details={d} />
              </DataCard>

              {/* Sleep and loudness */}
              <View style={styles.pair}>
                <DataCard shape="square" icon="bedtime" tone="sleep" label="Sleep" onPress={() => open('sleep')} accessibilityLabel={`Sleep: ${formatDuration(d.sleepMinutes)}. ${zoneOf(mark(marks, 'sleep')).word}. More`}>
                  <BigNumber value={shortDuration(d.sleepMinutes)} />
                  <Note>{zoneOf(mark(marks, 'sleep')).word}</Note>
                  <View style={styles.mini}>
                    <AsleepStrip d={d} />
                  </View>
                </DataCard>
                <DataCard shape="square" icon="graphic_eq" tone="snoring" label="How loud" onPress={() => open('loudness')} accessibilityLabel={`How loud: ${d.averageDb} decibels on average. ${loudnessLine(d)}. More`}>
                  <BigNumber value={`${d.averageDb} dB`} />
                  <Note>{loudnessLine(d).split(' · ')[0]}</Note>
                  <View style={styles.mini}>
                    <LoudnessBars compact share={d.intensityShare} />
                  </View>
                </DataCard>
              </View>

              {/* Recent nights, or a first-night note */}
              {usual ? (
                <DataCard title="Your recent nights" insight={recentLine(d)} onPress={() => open('recent')}>
                  <RecentNightsChart nights={d.recent.map((r) => ({ day: r.day, value: r.snoringMinutes, tonight: r.tonight }))} usual={usual.snoringMinutes} format={formatDuration} />
                </DataCard>
              ) : (
                <InsightCard icon="lightbulb" title="Your first night" body="This gives us a starting point. Record a few more nights and Airese can show you what’s typical for you." />
              )}

              {/* What it means */}
              {means && <InsightCard tone="warm" icon="lightbulb" title={means.title} body={means.body} onInfo={() => setExplain('deciding')} infoLabel="How Airese decides what to say" />}

              <PrivacyFooter onMore={() => setExplain('privacy')} />
            </>
          )}
        </View>
      </DetailPage>

      {/* Large sheets: the full story behind each card */}
      <LargeSheet visible={sheet !== null} title={SHEET_TITLE[lastSheet]} onClose={() => setSheet(null)}>
        <SheetBody which={lastSheet} d={d} marks={marks} player={player} />
      </LargeSheet>

      {/* Small sheets: one-line explanations */}
      <ExplainSheet
        content={explain === 'care' ? CARE : explain ? EXPLAIN[explain] : null}
        onClose={() => setExplain(null)}
        // Callback flow (contact details, consent): design to come
        action={explain === 'care' ? { label: 'Request a callback', onPress: () => setExplain(null) } : undefined}
        dismissLabel={explain === 'care' ? 'Not now' : undefined}
      />
    </>
  );
}

const CARE = {
  title: 'Talk to a sleep care team',
  body: 'A sleep care team from The Air Station can go through your recent nights with you and suggest what to do next. It isn’t a diagnosis.',
};

const mark = (marks: Benchmark[], k: Benchmark['key']) => marks.find((b) => b.key === k)!;

// ---------- Small pieces ----------

function Glance({ color, icon, fraction, value, label }: { color: string; icon: 'bedtime' | 'graphic_eq' | 'airwave' | 'schedule'; fraction: number; value: string; label: string }) {
  return (
    <View style={styles.glanceItem}>
      <ScoreRing fraction={fraction} color={color} icon={icon} size={60} />
      <AppText color="text" style={[styles.semibold, { marginTop: space.md }]} numberOfLines={1}>
        {value}
      </AppText>
      <AppText variant="small" color="textMuted">
        {label}
      </AppText>
    </View>
  );
}

function Trend({ value, usual }: { value: number; usual: number }) {
  const t = trend(value, usual);
  return (
    <View style={{ marginTop: space.xs }}>
      <ComparisonIndicator trend={t} words={trendWords[t]} />
    </View>
  );
}

function Note({ children }: { children: string }) {
  return (
    <AppText variant="small" color="textMuted" style={{ marginTop: space.xs }}>
      {children}
    </AppText>
  );
}

/** Breathing interruptions across the night as Iris dots on a faint line. */
function EventStrip({ d }: { d: NightDetails }) {
  return (
    <View style={styles.strip} accessible={false}>
      <View style={styles.stripLine} />
      {d.breathingEvents.map((m, i) => (
        <View key={i} style={[styles.stripDot, { left: `${(m / d.night.minutes) * 100}%` }]} />
      ))}
    </View>
  );
}

/** Asleep across the night as a Dew line with gaps where restless. */
function AsleepStrip({ d }: { d: NightDetails }) {
  return (
    <View style={styles.strip} accessible={false}>
      {asleepStretches(d).map((a, i) => (
        <View key={i} style={[styles.asleep, { left: `${(a.start / d.night.minutes) * 100}%`, width: `${((a.end - a.start) / d.night.minutes) * 100 - 1}%` }]} />
      ))}
    </View>
  );
}

function recentLine(d: NightDetails) {
  if (!d.baseline) return '';
  const t = trend(d.snoringMinutes, d.baseline.snoringMinutes);
  const usual = formatDuration(d.baseline.snoringMinutes);
  return t === 'less' ? `Less snoring than your usual ${usual}.` : t === 'more' ? `More snoring than your usual ${usual}.` : `About your usual ${usual} of snoring.`;
}

// ---------- Sheet contents ----------

function SheetBody({ which, d, marks, player }: { which: Sheet; d: NightDetails; marks: Benchmark[]; player: ClipPlayerState }) {
  const usual = d.baseline;
  switch (which) {
    case 'details':
      return (
        <View style={styles.sheetBody}>
          <AppText color="textMuted">How tonight compares with guide ranges and your own usual.</AppText>
          {marks.map((b) => (
            <ScoreCard key={b.key} b={b} />
          ))}
          <AppText variant="small" color="textMuted">
            Prototype: guide ranges are placeholders for Clinical to confirm.
          </AppText>
        </View>
      );
    case 'snoring':
      return (
        <View style={styles.sheetBody}>
          <Lead value={formatDuration(d.snoringMinutes)} note={`${Math.round((d.snoringMinutes / d.night.minutes) * 100)}% of the recording, mostly between ${busiestWindow(d)}.`} />
          <Block label="By hour">
            <HourlyBars hours={d.hourly} />
          </Block>
          <Block label="How loud">
            <LoudnessBars share={d.intensityShare} />
          </Block>
          {usual && <Plain>{`Your usual is ${formatDuration(usual.snoringMinutes)}. ${trendWords[trend(d.snoringMinutes, usual.snoringMinutes)]} tonight.`}</Plain>}
          <Plain muted>{EXPLAIN.snoring.body}</Plain>
        </View>
      );
    case 'breathing':
      return (
        <View style={styles.sheetBody}>
          <Lead value={`${d.breathingEvents.length} times`} note={`About ${mark(marks, 'breathing').display} of sleep.`} />
          <Block label="When">
            <EventStrip d={d} />
            <View style={styles.times}>
              {d.breathingEvents.map((m, i) => (
                <View key={i} style={styles.timeChip}>
                  <View style={[styles.keyDot, { backgroundColor: colors.dataBreathing }]} />
                  <AppText variant="small" color="text">
                    {clockAt(d, m)}
                  </AppText>
                </View>
              ))}
            </View>
          </Block>
          {usual && <Plain>{`Your usual is ${usual.breathingEvents} a night. ${trendWords[trend(d.breathingEvents.length, usual.breathingEvents)]} tonight.`}</Plain>}
          <Plain muted>{EXPLAIN.breathing.body}</Plain>
        </View>
      );
    case 'sleep':
      return (
        <View style={styles.sheetBody}>
          <Lead value={formatDuration(d.sleepMinutes)} note={`Estimated from ${formatDuration(d.night.minutes)} of recording.`} />
          <Block label="Asleep and restless">
            <AsleepStrip d={d} />
            <AppText variant="small" color="textMuted" style={{ marginTop: space.md }}>
              {`Restless ${d.awakenings} ${d.awakenings === 1 ? 'time' : 'times'}: ${d.awake.map((w) => clockAt(d, w.start)).join(', ')}`}
            </AppText>
          </Block>
          <ScoreCard b={mark(marks, 'sleep')} />
          <Plain muted>{EXPLAIN.sleep.body}</Plain>
        </View>
      );
    case 'loudness':
      return (
        <View style={styles.sheetBody}>
          <Lead value={`${d.averageDb} dB average`} note={`Peak ${d.peakDb} dB.`} />
          <Block label="Snoring intensity">
            <LoudnessBars share={d.intensityShare} />
          </Block>
          <Block label="For reference">
            {[
              ['Whisper', '30 dB'],
              ['Quiet room', '40 dB'],
              ['Conversation', '60 dB'],
            ].map(([what, db]) => (
              <View key={what} style={styles.refRow}>
                <AppText color="text">{what}</AppText>
                <AppText color="textMuted">{db}</AppText>
              </View>
            ))}
          </Block>
          <Plain muted>{EXPLAIN.loudness.body}</Plain>
        </View>
      );
    case 'timeline':
      return (
        <View style={styles.sheetBody}>
          <NightTimeline full details={d} clips={d.clips} playing={player.playing} onClip={player.toggle} />
          <Block label="Snoring">
            {d.segments.map((s, i) => (
              <View key={i} style={styles.refRow}>
                <AppText color="text">{`${clockAt(d, s.start)} to ${clockAt(d, s.end)}`}</AppText>
                <AppText color="textMuted">{formatDuration(s.end - s.start)}</AppText>
              </View>
            ))}
          </Block>
        </View>
      );
    case 'clips':
      return (
        <View style={[styles.sheetBody, { gap: space.md }]}>
          <Plain muted>{EXPLAIN.clips.body}</Plain>
          {d.clips.map((c) => (
            <AudioSnippet key={c.id} clip={c} time={clockAt(d, c.at)} player={player} />
          ))}
        </View>
      );
    case 'recent':
      return (
        <View style={styles.sheetBody}>
          {usual && <RecentNightsChart nights={d.recent.map((r) => ({ day: r.day, value: r.snoringMinutes, tonight: r.tonight }))} usual={usual.snoringMinutes} format={formatDuration} />}
          {usual && (
            <Block label="Tonight compared with your usual">
              <CompareRow label="Snoring" tonight={formatDuration(d.snoringMinutes)} usual={formatDuration(usual.snoringMinutes)} t={trend(d.snoringMinutes, usual.snoringMinutes)} />
              <CompareRow label="Breathing interruptions" tonight={String(d.breathingEvents.length)} usual={String(usual.breathingEvents)} t={trend(d.breathingEvents.length, usual.breathingEvents)} />
              <CompareRow label="Loudness" tonight={`${d.averageDb} dB`} usual={`${usual.averageDb} dB`} t={trend(d.averageDb, usual.averageDb)} />
            </Block>
          )}
          <Plain muted>{EXPLAIN.usual.body}</Plain>
        </View>
      );
  }
}

/** One score with its scale (All details). */
function ScoreCard({ b }: { b: Benchmark }) {
  const zone = zoneOf(b);
  const color = scoreColor[b.tone];
  return (
    <View style={styles.block}>
      <View style={styles.scoreHead}>
        <AppText color="text" style={{ flex: 1 }}>
          {b.name}
        </AppText>
        <View style={[styles.word, { borderColor: color }]}>
          <AppText variant="small" color="text">
            {zone.word}
          </AppText>
        </View>
      </View>
      <AppText variant="title" color="text" style={{ marginTop: space.sm }}>
        {b.display}
      </AppText>
      <View style={{ marginTop: space.lg }}>
        <BenchmarkScale b={b} color={color} />
      </View>
      <AppText variant="small" color="textMuted" style={{ marginTop: space.md }}>
        {b.usual != null ? `${b.guide}. The thin line is your usual.` : `${b.guide}.`}
      </AppText>
      <AppText variant="small" color="text" style={{ marginTop: space.sm }}>
        {b.explain}
      </AppText>
    </View>
  );
}

function Lead({ value, note }: { value: string; note: string }) {
  return (
    <View>
      <BigNumber value={value} />
      <AppText color="textMuted" style={{ marginTop: space.xs }}>
        {note}
      </AppText>
    </View>
  );
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.block}>
      <AppText variant="small" color="textMuted" accessibilityRole="header" style={{ marginBottom: space.lg }}>
        {label}
      </AppText>
      {children}
    </View>
  );
}

function Plain({ children, muted }: { children: string; muted?: boolean }) {
  return <AppText color={muted ? 'textMuted' : 'text'}>{children}</AppText>;
}

function CompareRow({ label, tonight, usual, t }: { label: string; tonight: string; usual: string; t: ReturnType<typeof trend> }) {
  return (
    <View style={styles.compareRow}>
      <View style={{ flex: 1 }}>
        <AppText color="text">{label}</AppText>
        <AppText variant="small" color="textMuted">{`${tonight} tonight · ${usual} usual`}</AppText>
      </View>
      <ComparisonIndicator trend={t} words={trendWords[t]} />
    </View>
  );
}

/** Straight after a recording: analysis still running. No empty cards (PRD §16). */
function Processing() {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(t, { toValue: 1, duration: motion.slow.duration * 1.5, easing: motion.slow.easeInOut, useNativeDriver: motion.useNativeDriver }));
    loop.start();
    return () => loop.stop();
  }, [t]);
  return (
    <View style={styles.processing} accessibilityLiveRegion="polite">
      <AppText variant="heading" color="text" style={{ textAlign: 'center' }}>
        Looking through your night
      </AppText>
      <AppText color="textMuted" style={{ textAlign: 'center', marginTop: space.sm }}>
        Finding the moments worth showing you.
      </AppText>
      <View style={styles.progress}>
        <Animated.View style={[styles.glint, { transform: [{ translateX: t.interpolate({ inputRange: [0, 1], outputRange: [-80, 200] }) }] }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, paddingHorizontal: PAGE_SIDE, marginTop: space.xl, gap: space.lg },
  pair: { flexDirection: 'row', gap: space.md },
  mini: { marginTop: 'auto', paddingTop: space.lg },
  semibold: { fontFamily: type.heading.fontFamily, fontWeight: type.heading.fontWeight },

  glance: { flexDirection: 'row', justifyContent: 'space-between' },
  glanceItem: { alignItems: 'center', width: 76 },

  listen: { alignSelf: 'flex-start', minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.lg, borderRadius: radius.pill, backgroundColor: colors.accent, marginTop: space.xl },

  clipChips: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: space.sm, marginTop: space.xl },
  clipChip: { minHeight: 44, paddingHorizontal: space.lg, justifyContent: 'center', borderRadius: radius.pill, borderWidth: 1, borderColor: 'rgba(179, 189, 211, 0.24)' },
  clipChipOn: { backgroundColor: 'rgba(238, 241, 247, 0.08)', borderColor: colors.text },
  allClips: { minHeight: 44, flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.sm, marginLeft: 'auto' },

  strip: { height: 12, justifyContent: 'center' },
  stripLine: { height: 2, borderRadius: 1, backgroundColor: 'rgba(185, 163, 255, 0.25)' },
  stripDot: { position: 'absolute', width: 8, height: 8, borderRadius: 4, marginLeft: -4, backgroundColor: colors.dataBreathing },
  asleep: { position: 'absolute', height: 6, borderRadius: 3, backgroundColor: colors.dataSleep },

  sheetBody: { gap: space.xl, paddingTop: space.sm },
  block: { backgroundColor: colors.surface, borderRadius: radius.card, padding: space.gutter },
  scoreHead: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  word: { paddingHorizontal: space.md, minHeight: 28, justifyContent: 'center', borderRadius: radius.pill, borderWidth: 1.5 },
  times: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.lg },
  timeChip: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.md, minHeight: 32, borderRadius: radius.pill, backgroundColor: 'rgba(185, 163, 255, 0.1)' },
  keyDot: { width: 8, height: 8, borderRadius: 4 },
  refRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: space.sm },
  compareRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.sm },

  processing: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: space.xxl * 3 },
  progress: { width: 200, height: 4, borderRadius: 2, marginTop: space.xl, overflow: 'hidden', backgroundColor: 'rgba(179, 189, 211, 0.15)' },
  glint: { width: 80, height: 4, borderRadius: 2, backgroundColor: colors.accent },
});

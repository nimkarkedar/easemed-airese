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
  ScoreTile,
  SnoringChart,
  asleepStretches,
  scoreColor,
  useClipPlayer,
  type ClipPlayerState,
} from '../components';
import { benchmarks, zoneOf, type Benchmark } from '../lib/benchmarks';
import {
  EXPLAIN,
  busiestWindow,
  CLIP_LABEL,
  SAMPLE_SECONDS,
  clockAt,
  dbAt,
  loudMinutes,
  meaning,
  nightDetails,
  shortDuration,
  statusMark,
  summary,
  trend,
  trendWords,
  type Clip,
  type ExplainKey,
  type NightDetails,
  type NightState,
} from '../lib/nightDetails';
import { formatNightDate, formatRecorded, formatSpan, type Night } from '../lib/recordings';
import { formatDuration } from '../lib/time';
import { colors, motion, radius, space, type } from '../theme';

/** What a card opens: a large sheet. */
type Sheet = 'report' | 'sound' | 'snoring' | 'breathing' | 'sleep' | 'clips' | 'recent';
const SHEET_TITLE: Record<Sheet, string> = {
  report: 'Night report',
  sound: 'Sound Score',
  snoring: 'Snoring through the night',
  breathing: 'Breathing pauses',
  sleep: 'Sleep',
  clips: 'All clips',
  recent: 'Your recent nights',
};

const PROCESSING_DEMO_MS = 6000; // prototype: how long "Looking through your night" shows before results

/**
 * Recording Details (L1): one night as a series of cards in two shapes (wide and square). Each
 * card has a visual, one line of insight and "›" to a large sheet with the full story.
 *
 * Three layers, for three readers:
 *   glance   (everyone, at 6 am) the verdict and "Have a listen" · Sound Score and breathing as plain levels
 *   explore  your night in sound: the chart is the index to the clips; tap a moment to hear it, with the
 *            pause and the breath after it marked · snoring time and sleep · recent nights · what it means
 *   report   (the curious, and doctors) the night report sheet: zoomable chart, every measure, how it's measured
 * Snoring is a score (comparable, safe to track). Breathing is a plain level on the page; its exact
 * rate lives in its sheet and the report, pending Clinical. The sticky action follows the level of concern.
 * First night: proof first (the night in sound comes before the scores, which have nothing to compare with yet).
 * Colour by data: Ember snoring, Iris breathing, Dew sleep. Type: four sizes, regular and semibold.
 * States: processing, poor audio, first night (no comparisons), ordinary, unusual, repeated pattern.
 */
export function NightScreen({ night, state: initialState, onBack, slideIn = Platform.OS === 'web' }: { night: Night; state: NightState; onBack: () => void; slideIn?: boolean }) {
  const [state, setState] = useState(initialState);
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [lastSheet, setLastSheet] = useState<Sheet>('report');
  const [explain, setExplain] = useState<ExplainKey | 'care' | null>(null);
  const player = useClipPlayer();
  const d = nightDetails(night, state === 'processing' ? 'steady' : state);
  // The moment in the player: a breathing pause if there was one (the clearest proof), else the first.
  const [selected, setSelected] = useState((d.featured.find((c) => c.type === 'Interrupted breathing') ?? d.featured[0])?.id);

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
  const sound = mark(marks, 'sound');
  const breathing = mark(marks, 'breathing');
  const status = statusMark(state);
  const moment = lead ? d.featured.indexOf(lead) : -1;
  const pick = (c: Clip) => {
    setSelected(c.id);
    if (player.playing !== c.id) player.toggle(c);
  };

  // Snoring is a score; breathing a plain level (its exact rate is in its sheet and the report).
  const scores = (
    <View style={styles.pair}>
      <ScoreTile
        tone="snoring"
        fraction={sound.value / sound.max}
        value={sound.display}
        name="Sound Score"
        level={zoneOf(sound).word}
        detail={usual ? trendWords[trend(d.snoringMinutes, usual.snoringMinutes)] : 'Your first night'}
        onPress={() => open('sound')}
        accessibilityLabel={`Sound Score: ${sound.display} out of 100, ${zoneOf(sound).word}. More`}
      />
      <ScoreTile
        tone="breathing"
        fraction={breathing.value / breathing.max}
        icon="airwave"
        name="Breathing pauses"
        level={zoneOf(breathing).word}
        detail={usual ? trendWords[trend(d.breathingEvents.length, usual.breathingEvents)] : 'Your first night'}
        onPress={() => open('breathing')}
        accessibilityLabel={`Breathing pauses: ${zoneOf(breathing).word}. More`}
      />
    </View>
  );

  // The chart is the index to the audio: tap a moment to hear it.
  const sound_ = (
    <DataCard title="Your night in sound">
      <AppText color="text" style={{ marginBottom: space.xl }}>
        {chartLine(d)}
      </AppText>
      <SnoringChart d={d} mode="overview" moments={d.featured} selected={lead?.id} onSelect={pick} />
      {lead && (
        <View style={styles.moment}>
          <ClipPlayer clip={lead} time={clockAt(d, lead.at)} player={player} detail={`${CLIP_LABEL[lead.type]} · ${dbAt(d, lead.at)} dB · ${lead.seconds} sec`} />
        </View>
      )}
      <View style={styles.stepper}>
        <Pressable onPress={() => pick(d.featured[moment - 1])} disabled={moment <= 0} accessibilityRole="button" accessibilityLabel="Previous moment" style={[styles.stepButton, moment <= 0 && styles.off]}>
          <Icon name="chevron_left" size={22} color="text" />
        </Pressable>
        <AppText variant="small" color="textMuted" accessibilityLiveRegion="polite">{`${moment + 1} of ${d.featured.length}`}</AppText>
        <Pressable
          onPress={() => pick(d.featured[moment + 1])}
          disabled={moment >= d.featured.length - 1}
          accessibilityRole="button"
          accessibilityLabel="Next moment"
          style={[styles.stepButton, moment >= d.featured.length - 1 && styles.off]}
        >
          <Icon name="chevron_right" size={22} color="text" />
        </Pressable>
        <Pressable onPress={() => open('clips')} accessibilityRole="button" accessibilityLabel={`All ${d.clips.length} clips`} style={styles.allClips}>
          <AppText variant="small" color="accent">{`All ${d.clips.length}`}</AppText>
          <Icon name="chevron_right" size={18} color="accent" />
        </Pressable>
      </View>
    </DataCard>
  );

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
              {/* The verdict, with a colour-coded status mark, and the way into the audio */}
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

              {usual && scores}
              {sound_}
              {!usual && scores}

              {/* Snoring time and sleep */}
              <View style={styles.pair}>
                <DataCard shape="square" icon="graphic_eq" tone="snoring" label="Snoring" onPress={() => open('snoring')} accessibilityLabel={`Snoring time: ${formatDuration(d.snoringMinutes)}. More`}>
                  <BigNumber value={shortDuration(d.snoringMinutes)} />
                  {usual ? <Trend value={d.snoringMinutes} usual={usual.snoringMinutes} /> : <Note>{`${pct(d.snoringMinutes, d.night.minutes)}% of the night`}</Note>}
                  <View style={styles.mini}>
                    <HourlyBars compact hours={d.hourly} />
                  </View>
                </DataCard>
                <DataCard shape="square" icon="bedtime" tone="sleep" label="Sleep" onPress={() => open('sleep')} accessibilityLabel={`Sleep: ${formatDuration(d.sleepMinutes)}. ${zoneOf(mark(marks, 'sleep')).word}. More`}>
                  <BigNumber value={shortDuration(d.sleepMinutes)} />
                  <Note>{zoneOf(mark(marks, 'sleep')).word}</Note>
                  <View style={styles.mini}>
                    <AsleepStrip d={d} />
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

              {/* The night report: every measure, for the curious and for a doctor */}
              <DataCard title="Night report" insight="Every measure from last night, and how Airese got it. Handy to show a doctor." onPress={() => open('report')}>
                <View style={styles.stats}>
                  <Stat value={`${d.peakDb} dB`} label="Loudest" />
                  <Stat value={String(breathing.value)} label="Pauses an hour" />
                  <Stat value={shortDuration(loudMinutes(d))} label="Above 60 dB" />
                </View>
              </DataCard>

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

function Trend({ value, usual }: { value: number; usual: number }) {
  const t = trend(value, usual);
  return (
    <View style={{ marginTop: space.xs }}>
      <ComparisonIndicator trend={t} words={trendWords[t]} />
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ flex: 1 }}>
      <AppText color="text" style={styles.semibold} numberOfLines={1}>
        {value}
      </AppText>
      <AppText variant="small" color="textMuted">
        {label}
      </AppText>
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

const pct = (part: number, whole: number) => Math.round((part / whole) * 100);

/** The chart's one line: how long it was louder than a conversation, and when. */
function chartLine(d: NightDetails) {
  const loud = loudMinutes(d);
  return loud ? `Louder than a conversation for ${shortDuration(loud)}. Mostly between ${busiestWindow(d)}.` : `Quieter than a conversation all night. Mostly between ${busiestWindow(d)}.`;
}

/** Breathing pauses in each hour of the recording. */
function breathingByHour(d: NightDetails) {
  return d.hourly.map((h, i) => ({ label: h.label, minutes: d.breathingEvents.filter((m) => Math.floor(m / 60) === i).length }));
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
    case 'report':
      return (
        <View style={styles.sheetBody}>
          <AppText color="textMuted">Everything Airese measured last night, and how. Phones differ, so compare nights rather than reading one number on its own.</AppText>
          <Block label="The whole night">
            <SnoringChart d={d} height={240} />
          </Block>
          <Block label="Measures">
            {[
              ['Recorded', formatDuration(d.night.minutes)],
              ['Asleep (estimated)', formatDuration(d.sleepMinutes)],
              ['Snoring', `${formatDuration(d.snoringMinutes)} · ${pct(d.snoringMinutes, d.night.minutes)}%`],
              ['Above 60 dB', formatDuration(loudMinutes(d))],
              ['Average while snoring', `${d.averageDb} dB`],
              ['Loudest', `${d.peakDb} dB`],
              ['Breathing pauses', `${d.breathingEvents.length} · ${mark(marks, 'breathing').value} an hour`],
              ['Coughs', String(d.coughs.length)],
              ['Movements', String(d.movements.length)],
              ['Restless', `${d.awakenings} ${d.awakenings === 1 ? 'time' : 'times'}`],
              ['Sound Score', `${d.soundScore} · loudness ${d.soundParts.loudness} + snoring ${d.soundParts.snoring}`],
            ].map(([what, value]) => (
              <View key={what} style={styles.refRow}>
                <AppText color="text" style={{ flex: 1 }}>
                  {what}
                </AppText>
                <AppText color="textMuted" style={{ textAlign: 'right', flexShrink: 1 }}>
                  {value}
                </AppText>
              </View>
            ))}
          </Block>
          {marks.map((b) => (
            <ScoreCard key={b.key} b={b} />
          ))}
          <Block label="How Airese measures">
            <AppText color="text">{`Your phone’s microphone measures sound level every ${SAMPLE_SECONDS} seconds. Airese recognises snoring, pauses in breathing, coughs and movement from the sound alone, on your phone. A pause is counted when snoring stops for a moment and starts again with a louder breath.`}</AppText>
          </Block>
          <AppText variant="small" color="textMuted">
            Prototype: guide ranges and the Sound Score formula are placeholders for Clinical and Engineering to confirm. Not a diagnosis.
          </AppText>
        </View>
      );
    case 'sound': {
      const sound = mark(marks, 'sound');
      return (
        <View style={styles.sheetBody}>
          <Lead value={`${d.soundScore} out of 100`} note={`${zoneOf(sound).word}. ${sound.guide}.`} />
          <Block label="What it’s made of">
            <Part label="Loudness" value={d.soundParts.loudness} note={`Your snoring averaged ${d.averageDb} dB, peaking at ${d.peakDb} dB.`} />
            <Part label="Snoring" value={d.soundParts.snoring} note={`You snored for ${pct(d.snoringMinutes, d.night.minutes)}% of the night.`} />
          </Block>
          <ScoreCard b={sound} />
          <Plain muted>{EXPLAIN.soundScore.body}</Plain>
        </View>
      );
    }
    case 'snoring':
      return (
        <View style={styles.sheetBody}>
          <Lead value={formatDuration(d.snoringMinutes)} note={`${pct(d.snoringMinutes, d.night.minutes)}% of the recording. ${chartLine(d)}`} />
          <Block label="How loud, through the night">
            <SnoringChart d={d} height={260} />
          </Block>
          <Block label="By hour">
            <HourlyBars hours={d.hourly} />
          </Block>
          <Block label="Snoring intensity">
            <LoudnessBars share={d.intensityShare} />
          </Block>
          <Block label="For reference">
            {[
              ['Whisper', '30 dB'],
              ['Quiet room', '40 dB'],
              ['Conversation', '60 dB'],
              ['Vacuum cleaner', '75 dB'],
            ].map(([what, db]) => (
              <View key={what} style={styles.refRow}>
                <AppText color="text">{what}</AppText>
                <AppText color="textMuted">{db}</AppText>
              </View>
            ))}
          </Block>
          {usual && <Plain>{`Your usual is ${formatDuration(usual.snoringMinutes)}. ${trendWords[trend(d.snoringMinutes, usual.snoringMinutes)]} tonight.`}</Plain>}
          <Plain muted>{`${EXPLAIN.snoring.body} ${EXPLAIN.loudness.body}`}</Plain>
        </View>
      );
    case 'breathing': {
      const b = mark(marks, 'breathing');
      return (
        <View style={styles.sheetBody}>
          <Lead value={`${b.value} an hour`} note={`${d.breathingEvents.length} pauses in ${formatDuration(d.sleepMinutes)} of sleep.`} />
          <ScoreCard b={b} />
          <Block label="By hour">
            <HourlyBars hours={breathingByHour(d)} color={colors.dataBreathing} what="Breathing pauses" unit="pauses" />
          </Block>
          {usual && <Plain>{`Your usual is ${usual.breathingEvents} a night. ${trendWords[trend(d.breathingEvents.length, usual.breathingEvents)]} tonight.`}</Plain>}
          <Plain muted>{EXPLAIN.breathing.body}</Plain>
        </View>
      );
    }
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
    case 'clips':
      return (
        <View style={[styles.sheetBody, { gap: space.md }]}>
          <Plain muted>{EXPLAIN.clips.body}</Plain>
          <View style={[styles.block, { marginBottom: space.md }]}>
            <NightTimeline full details={d} clips={d.clips} playing={player.playing} onClip={player.toggle} />
          </View>
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
              <CompareRow label="Breathing pauses" tonight={String(d.breathingEvents.length)} usual={String(usual.breathingEvents)} t={trend(d.breathingEvents.length, usual.breathingEvents)} />
              <CompareRow label="Loudness" tonight={`${d.averageDb} dB`} usual={`${usual.averageDb} dB`} t={trend(d.averageDb, usual.averageDb)} />
            </Block>
          )}
          <Plain muted>{EXPLAIN.usual.body}</Plain>
        </View>
      );
  }
}

/** One part of the Sound Score: a bar out of 50 and what it reflects. */
function Part({ label, value, note }: { label: string; value: number; note: string }) {
  return (
    <View style={styles.part} accessible accessibilityLabel={`${label}: ${value} of 50. ${note}`}>
      <View style={styles.partHead}>
        <AppText color="text">{label}</AppText>
        <AppText color="text" style={styles.semibold}>{`${value} of 50`}</AppText>
      </View>
      <View style={styles.partTrack}>
        <View style={{ width: `${(value / 50) * 100}%`, height: '100%', borderRadius: 5, backgroundColor: colors.dataSnoring }} />
      </View>
      <AppText variant="small" color="textMuted">
        {note}
      </AppText>
    </View>
  );
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

  moment: { marginTop: space.xl, paddingTop: space.xl, borderTopWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(238, 241, 247, 0.16)' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.lg },
  stepButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(238, 241, 247, 0.08)' },
  off: { opacity: 0.4 },
  stats: { flexDirection: 'row', gap: space.md },

  listen: { alignSelf: 'flex-start', minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.lg, borderRadius: radius.pill, backgroundColor: colors.accent, marginTop: space.xl },

  allClips: { minHeight: 44, flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.sm, marginLeft: 'auto' },

  strip: { height: 12, justifyContent: 'center' },
  asleep: { position: 'absolute', height: 6, borderRadius: 3, backgroundColor: colors.dataSleep },

  sheetBody: { gap: space.xl, paddingTop: space.sm },
  block: { backgroundColor: colors.surface, borderRadius: radius.card, padding: space.gutter },
  scoreHead: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  word: { paddingHorizontal: space.md, minHeight: 28, justifyContent: 'center', borderRadius: radius.pill, borderWidth: 1.5 },
  part: { gap: space.sm, paddingVertical: space.sm },
  partHead: { flexDirection: 'row', justifyContent: 'space-between' },
  partTrack: { height: 10, borderRadius: 5, backgroundColor: 'rgba(179, 189, 211, 0.1)', overflow: 'hidden' },
  refRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: space.sm },
  compareRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.sm },

  processing: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: space.xxl * 3 },
  progress: { width: 200, height: 4, borderRadius: 2, marginTop: space.xl, overflow: 'hidden', backgroundColor: 'rgba(179, 189, 211, 0.15)' },
  glint: { width: 80, height: 4, borderRadius: 2, backgroundColor: colors.accent },
});

import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { finishNight, summarize, useNightNotes } from '../lib/nightNotes';
import { startAnalysing } from '../lib/recordings';
import { RecordingScreen } from '../screens/RecordingScreen';

/**
 * Opened over Home (transparent), so the record button's blue can grow out of Home itself.
 * Stopping in the morning goes straight to Reports: "Looking through your night", then the results.
 */
export default function Recording() {
  const p = useLocalSearchParams<{ x?: string; y?: string; r?: string }>();
  const [startedAt] = useState(() => new Date());
  const notes = useNightNotes();
  const from = p.x && p.y && p.r ? { x: Number(p.x), y: Number(p.y), r: Number(p.r) } : undefined;
  return (
    <RecordingScreen
      startedAt={startedAt}
      from={from}
      notesTonight={summarize(notes.tonight)}
      onOpenNotes={() => router.push({ pathname: '/night-notes', params: { from: 'recording' } })}
      onStop={() => {
        finishNight();
        startAnalysing();
        router.replace('/reports');
      }}
    />
  );
}

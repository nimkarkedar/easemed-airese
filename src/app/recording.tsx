import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { finishNight } from '../lib/nightNotes';
import { RecordingScreen } from '../screens/RecordingScreen';

/**
 * Opened over Home (transparent), so the record button's blue can grow out of Home itself.
 * Stopping in the morning goes straight to the night: "Looking through your night", then the results.
 */
export default function Recording() {
  const p = useLocalSearchParams<{ x?: string; y?: string; r?: string }>();
  const [startedAt] = useState(() => new Date());
  const from = p.x && p.y && p.r ? { x: Number(p.x), y: Number(p.y), r: Number(p.r) } : undefined;
  return (
    <RecordingScreen
      startedAt={startedAt}
      from={from}
      onStop={() => {
        finishNight();
        router.replace({ pathname: '/night/[id]', params: { id: 'latest', state: 'processing' } });
      }}
    />
  );
}

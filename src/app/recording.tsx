import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { finishNight } from '../lib/nightNotes';
import { eightHoursFrom, fromMinutes } from '../lib/time';
import { RecordingScreen } from '../screens/RecordingScreen';

/** Opened over Home (transparent), so the record button's blue can grow out of Home itself. */
export default function Recording() {
  const p = useLocalSearchParams<{ stop?: string; x?: string; y?: string; r?: string }>();
  const [stopAt] = useState(() => (p.stop ? fromMinutes(Number(p.stop)) : eightHoursFrom()));
  const from = p.x && p.y && p.r ? { x: Number(p.x), y: Number(p.y), r: Number(p.r) } : undefined;
  return <RecordingScreen stopAt={stopAt} from={from} onStop={() => {
        finishNight();
        if (router.canGoBack()) router.back();
        else router.replace('/home');
      }} />;
}

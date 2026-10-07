import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { demoAfterFirstNight } from '../../lib/nightNotes';
import { HomeScreen } from '../../screens/HomeScreen';

export default function Home() {
  // ?state=after-first-night: the demo menu's state (one night recorded, no notes for tonight). Prototype only.
  const { state } = useLocalSearchParams<{ state?: string }>();
  useState(() => state === 'after-first-night' && demoAfterFirstNight());
  return (
    <HomeScreen
      onOpenNotes={() => router.push('/night-notes')}
      onOpenProfile={() => router.push('/profile')}
      onStartRecording={(from) => router.push({ pathname: '/recording', params: { x: String(from.x), y: String(from.y), r: String(from.r) } })}
    />
  );
}

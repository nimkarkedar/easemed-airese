import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { nightState } from '../../../lib/nightDetails';
import { findNight } from '../../../lib/recordings';
import { NightScreen } from '../../../screens/NightScreen';

/** ?state=…: the demo menu's Recording Details states (prototype only). */
export default function NightRoute() {
  const { id, state } = useLocalSearchParams<{ id: string; state?: string }>();
  const night = findNight(id);
  if (!night) return <Redirect href="/recordings" />;
  const s = nightState(night, state);
  return (
    <NightScreen
      night={night}
      state={s}
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/recordings'))}
    />
  );
}

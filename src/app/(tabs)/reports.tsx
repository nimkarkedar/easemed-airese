import { router, useLocalSearchParams } from 'expo-router';
import { ReportsScreen } from '../../screens/ReportsScreen';

/** ?state=…: the demo menu's Recording Details states, on the latest night (prototype only). */
export default function Reports() {
  const { state } = useLocalSearchParams<{ state?: string }>();
  return <ReportsScreen key={state ?? 'default'} demoState={state} onRecordAgain={() => router.navigate('/home')} />;
}

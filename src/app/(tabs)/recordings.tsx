import { router } from 'expo-router';
import { RecordingsScreen } from '../../screens/RecordingsScreen';

export default function Recordings() {
  return <RecordingsScreen onOpen={(night) => router.push(`/night/${night.id}`)} onOpenProfile={() => router.push({ pathname: '/profile', params: { from: 'recordings' } })} />;
}

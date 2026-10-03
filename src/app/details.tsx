import { router } from 'expo-router';
import { DetailsScreen } from '../screens/DetailsScreen';

export default function Details() {
  return <DetailsScreen onDone={() => router.replace('/record')} />;
}

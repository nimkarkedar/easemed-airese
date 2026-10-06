import { router } from 'expo-router';
import { NightNotesScreen } from '../screens/NightNotesScreen';

export default function NightNotes() {
  return <NightNotesScreen onClose={() => (router.canGoBack() ? router.back() : router.replace('/home'))} />;
}

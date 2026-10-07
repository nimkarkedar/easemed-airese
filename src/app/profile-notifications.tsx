import { router } from 'expo-router';
import { NotificationSettingsScreen } from '../screens/NotificationSettingsScreen';

export default function ProfileNotifications() {
  return <NotificationSettingsScreen onBack={() => (router.canGoBack() ? router.back() : router.replace('/profile'))} />;
}

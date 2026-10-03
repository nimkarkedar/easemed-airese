import { router } from 'expo-router';
import { NotificationsPermissionScreen } from '../../screens/PermissionScreen';

export default function Notifications() {
  return <NotificationsPermissionScreen onDone={() => router.replace('/home')} />;
}

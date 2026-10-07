import { router, useLocalSearchParams } from 'expo-router';
import { eraseEverything } from '../lib/account';
import { ProfileScreen } from '../screens/ProfileScreen';

/** ?from=recordings: opened from the Recordings tab, so Back says so. */
export default function Profile() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  return (
    <ProfileScreen
      backLabel={from === 'recordings' ? 'Recordings' : 'Home'}
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/home'))}
      onOpenDetails={() => router.push('/profile-details')}
      onOpenNotifications={() => router.push('/profile-notifications')}
      onOpenCentres={() => router.push('/centres')}
      onErased={() => {
        eraseEverything();
        router.dismissAll();
        router.replace('/');
      }}
    />
  );
}

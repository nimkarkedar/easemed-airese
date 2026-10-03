/**
 * System permission requests (iOS and Android).
 * Each shows the operating system's own Allow / Don't Allow prompt and resolves
 * to true if the user allowed it. Callers move on either way.
 *
 * Browser preview: see permissions.web.ts (simulated prompt).
 */
import { Platform } from 'react-native';
import { requestRecordingPermissionsAsync } from 'expo-audio';
import * as Notifications from 'expo-notifications';

/** Microphone, for overnight recording. iOS prompt text lives in app.json (expo-audio plugin). */
export async function requestMicrophone(): Promise<boolean> {
  const { granted } = await requestRecordingPermissionsAsync();
  return granted;
}

/** Notifications: the bedtime reminder and the "recording stopped" message (two a day). */
export async function requestNotifications(): Promise<boolean> {
  if (Platform.OS === 'android') {
    // Android 13+ only shows the prompt once a channel exists.
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const result = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowSound: true, allowBadge: false },
  });
  // On iOS, read ios.status rather than the root status (per Expo docs).
  return result.granted || result.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

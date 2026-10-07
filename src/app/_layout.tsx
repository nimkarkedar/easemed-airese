import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SystemAlertHost } from '../components';
import { useFonts, Montserrat_400Regular, Montserrat_500Medium, Montserrat_600SemiBold, Montserrat_700Bold } from '@expo-google-fonts/montserrat';

SplashScreen.preventAutoHideAsync().catch(() => {});

/** Pages opened from a row (DetailPage): the system push on device; on web the page slides itself in. */
const PUSH =
  Platform.OS === 'web'
    ? ({ presentation: 'transparentModal', animation: 'none', contentStyle: { backgroundColor: 'transparent' } } as const)
    : ({ animation: 'slide_from_right' } as const);

export default function RootLayout() {
  const [loaded, error] = useFonts({ Montserrat_400Regular, Montserrat_500Medium, Montserrat_600SemiBold, Montserrat_700Bold });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync().catch(() => {});
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        {/* The splash's fall-away is the transition, so onboarding appears instantly */}
        <Stack.Screen name="onboarding" options={{ animation: 'none' }} />
        {/* A night: the system push on device (slide in, swipe back); on web the page slides itself over the list */}
        <Stack.Screen name="night/[id]/index" options={PUSH} />
        {/* Night Notes: same as a night (push; on web the page slides itself in over Home) */}
        <Stack.Screen name="night-notes" options={PUSH} />
        {/* Profile (from the avatar), and its pages one level deeper: the same push */}
        <Stack.Screen name="profile" options={PUSH} />
        <Stack.Screen name="profile-details" options={PUSH} />
        <Stack.Screen name="profile-notifications" options={PUSH} />
        <Stack.Screen name="centres" options={PUSH} />
        {/* Recording draws its own entrance over Home (the button's blue fills the screen); no swipe-back mid-night */}
        <Stack.Screen name="recording" options={{ presentation: 'transparentModal', animation: 'none', gestureEnabled: false, contentStyle: { backgroundColor: 'transparent' } }} />
      </Stack>
      {/* Browser preview only: simulated system permission prompts (renders nothing on iOS/Android) */}
      <SystemAlertHost />
    </SafeAreaProvider>
  );
}

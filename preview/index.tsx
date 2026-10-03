/**
 * Browser preview entry (not part of the shipped app).
 * Plays the same screens, in the same order as the app, inside an iPhone 17 Pro
 * frame for review, without expo-router (the preview is one self-contained HTML file).
 * Built with `npm run preview`.
 */
import React, { useState } from 'react';
import { registerRootComponent } from 'expo';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { OnboardingScreen } from '../src/screens/OnboardingScreen';
import { SplashScreen } from '../src/screens/SplashScreen';

function PreviewApp() {
  const [screen, setScreen] = useState<'splash' | 'onboarding'>('splash');
  return (
    <SafeAreaProvider>
      {screen === 'splash' ? <SplashScreen onFinish={() => setScreen('onboarding')} /> : <OnboardingScreen />}
    </SafeAreaProvider>
  );
}

registerRootComponent(PreviewApp);

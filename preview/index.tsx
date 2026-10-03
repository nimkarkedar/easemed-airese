/**
 * Browser preview entry (not part of the shipped app).
 * Plays the same screens, in the same order as the app, inside an iPhone 17 Pro
 * frame for review, without expo-router (the preview is one self-contained HTML file).
 * Built with `npm run preview`.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { registerRootComponent } from 'expo';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SystemAlertHost } from '../src/components';
import { HomeScreen } from '../src/screens/HomeScreen';
import { OnboardingScreen } from '../src/screens/OnboardingScreen';
import { MicrophonePermissionScreen, NotificationsPermissionScreen } from '../src/screens/PermissionScreen';
import { SplashScreen } from '../src/screens/SplashScreen';

type Step = 'splash' | 'onboarding' | 'microphone' | 'notifications' | 'home';

function PreviewApp() {
  const [step, setStep] = useState<Step>('splash');
  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }}>
        {step === 'splash' && <SplashScreen onFinish={() => setStep('onboarding')} />}
        {step === 'onboarding' && <OnboardingScreen onContinue={() => setStep('microphone')} />}
        {step === 'microphone' && <MicrophonePermissionScreen onDone={() => setStep('notifications')} />}
        {step === 'notifications' && <NotificationsPermissionScreen onDone={() => setStep('home')} />}
        {step === 'home' && <HomeScreen />}
        <SystemAlertHost />
      </View>
    </SafeAreaProvider>
  );
}

registerRootComponent(PreviewApp);

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
import { SystemAlertHost, TabBar, type TabItem } from '../src/components';
import { DetailsScreen } from '../src/screens/DetailsScreen';
import { HistoryScreen } from '../src/screens/HistoryScreen';
import { RecordScreen } from '../src/screens/RecordScreen';
import { OnboardingScreen } from '../src/screens/OnboardingScreen';
import { MicrophonePermissionScreen, NotificationsPermissionScreen } from '../src/screens/PermissionScreen';
import { SplashScreen } from '../src/screens/SplashScreen';

type Step = 'splash' | 'onboarding' | 'microphone' | 'notifications' | 'details' | 'home';

function PreviewApp() {
  const [step, setStep] = useState<Step>('splash');
  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }}>
        {step === 'splash' && <SplashScreen onFinish={() => setStep('onboarding')} />}
        {step === 'onboarding' && <OnboardingScreen onContinue={() => setStep('microphone')} />}
        {step === 'microphone' && <MicrophonePermissionScreen onDone={() => setStep('notifications')} />}
        {step === 'notifications' && <NotificationsPermissionScreen onDone={() => setStep('details')} />}
        {step === 'details' && <DetailsScreen onDone={() => setStep('home')} />}
        {step === 'home' && <HomeTabs />}
        <SystemAlertHost />
      </View>
    </SafeAreaProvider>
  );
}

// Home: same two tabs as src/app/(tabs), without the router.
const TABS: TabItem[] = [
  { key: 'record', label: 'Record', icon: 'mic', iconSelected: 'mic_fill' },
  { key: 'history', label: 'History', icon: 'history' },
];

function HomeTabs() {
  const [tab, setTab] = useState('record');
  return (
    <View style={{ flex: 1 }}>
      {tab === 'record' ? <RecordScreen /> : <HistoryScreen />}
      <TabBar items={TABS} selected={tab} onSelect={setTab} />
    </View>
  );
}

registerRootComponent(PreviewApp);

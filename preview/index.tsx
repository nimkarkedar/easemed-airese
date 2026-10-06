/**
 * Browser preview entry (not part of the shipped app).
 * Plays the same screens, in the same order as the app, inside an iPhone 17 Pro
 * frame for review, without expo-router (the preview is one self-contained HTML file).
 * Built with `npm run preview`.
 */
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { registerRootComponent } from 'expo';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HOME_TABS, SystemAlertHost, TabBar } from '../src/components';
import { DetailsScreen } from '../src/screens/DetailsScreen';
import { HomeScreen, type RecordOrigin } from '../src/screens/HomeScreen';
import { RecordingScreen } from '../src/screens/RecordingScreen';
import { eightHoursFrom, type ClockTime } from '../src/lib/time';
import { RecordingsScreen } from '../src/screens/RecordingsScreen';
import { NightScreen } from '../src/screens/NightScreen';
import { sampleNights, type Night } from '../src/lib/recordings';
import { nightState, type NightState } from '../src/lib/nightDetails';
import { NightNotesScreen } from '../src/screens/NightNotesScreen';
import { demoAfterFirstNight, finishNight } from '../src/lib/nightNotes';
import { OnboardingScreen } from '../src/screens/OnboardingScreen';
import { MicrophonePermissionScreen, NotificationsPermissionScreen } from '../src/screens/PermissionScreen';
import { SplashScreen } from '../src/screens/SplashScreen';

type Step = 'splash' | 'onboarding' | 'microphone' | 'notifications' | 'details' | 'home' | 'recording';

const STEPS: Step[] = ['splash', 'onboarding', 'microphone', 'notifications', 'details', 'home', 'recording'];

function PreviewApp() {
  const [step, setStep] = useState<Step>('splash');
  const [tab, setTab] = useState('home');
  const [recording, setRecording] = useState<{ stopAt: ClockTime; from?: RecordOrigin }>(() => ({ stopAt: eightHoursFrom() }));
  const [openNight, setOpenNight] = useState<{ night: Night; state: NightState } | null>(null); // demo menu: a night state
  const [run, setRun] = useState(0); // remounts the screen when the demo menu picks it again

  // Demo menu above the phone frame (public/iphone.html): jump to any screen, and keep the menu in step.
  useEffect(() => {
    const onJump = (e: Event) => {
      const key = (e as CustomEvent<string>).detail;
      setOpenNight(null);
      if (key.startsWith('night-')) {
        // Recording Details in a given state, over Recordings
        const night = sampleNights()[0];
        setStep('home');
        setTab('recordings');
        setOpenNight({ night, state: nightState(night, key.slice('night-'.length)) });
      } else if (key === 'home' || key === 'recordings' || key === 'home-after-first-night') {
        if (key === 'home-after-first-night') demoAfterFirstNight();
        setStep('home');
        setTab(key === 'recordings' ? 'recordings' : 'home');
      } else if ((STEPS as string[]).includes(key)) {
        if (key === 'recording') setRecording({ stopAt: eightHoursFrom() });
        setStep(key as Step);
      }
      setRun((n) => n + 1);
    };
    window.addEventListener('airese:jump', onJump);
    return () => window.removeEventListener('airese:jump', onJump);
  }, []);
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('airese:screen', { detail: step === 'home' ? tab : step }));
  }, [step, tab]);

  return (
    <SafeAreaProvider>
      <View key={run} style={{ flex: 1 }}>
        {step === 'splash' && <SplashScreen onFinish={() => setStep('onboarding')} />}
        {step === 'onboarding' && <OnboardingScreen onContinue={() => setStep('microphone')} />}
        {step === 'microphone' && <MicrophonePermissionScreen onDone={() => setStep('notifications')} />}
        {step === 'notifications' && <NotificationsPermissionScreen onDone={() => setStep('details')} />}
        {step === 'details' && <DetailsScreen onDone={() => setStep('home')} />}
        {(step === 'home' || step === 'recording') && (
          <HomeTabs
            tab={tab}
            onTab={setTab}
            initialNight={openNight}
            onStartRecording={(stopAt, from) => {
              setRecording({ stopAt, from });
              setStep('recording');
            }}
          />
        )}
        {/* Over Home, like the app's transparent modal, so the button's blue grows out of Home */}
        {step === 'recording' && (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
            <RecordingScreen
              stopAt={recording.stopAt}
              from={recording.from}
              onStop={() => {
                finishNight();
                setStep('home');
              }}
            />
          </View>
        )}
        <SystemAlertHost />
      </View>
    </SafeAreaProvider>
  );
}

// Home: same two tabs as src/app/(tabs), without the router.
function HomeTabs({
  tab,
  onTab,
  onStartRecording,
  initialNight,
}: {
  tab: string;
  onTab: (key: string) => void;
  onStartRecording: (stopAt: ClockTime, from: RecordOrigin) => void;
  initialNight: { night: Night; state: NightState } | null;
}) {
  const [night, setNight] = useState<{ night: Night; state: NightState } | null>(initialNight);
  const [notes, setNotes] = useState(false);
  return (
    <View style={{ flex: 1 }}>
      {tab === 'home' ? <HomeScreen onStartRecording={onStartRecording} onOpenNotes={() => setNotes(true)} /> : <RecordingsScreen onOpen={(n) => setNight({ night: n, state: nightState(n) })} />}
      <TabBar items={HOME_TABS} selected={tab} onSelect={onTab} />
      {/* A night, over the list (like the app's push) */}
      {night && <NightScreen night={night.night} state={night.state} onBack={() => setNight(null)} slideIn />}
      {notes && <NightNotesScreen onClose={() => setNotes(false)} slideIn />}
    </View>
  );
}

registerRootComponent(PreviewApp);

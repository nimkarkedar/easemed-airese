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
import { RecordingsScreen } from '../src/screens/RecordingsScreen';
import { NightScreen } from '../src/screens/NightScreen';
import { sampleNights, type Night } from '../src/lib/recordings';
import { nightState, type NightState } from '../src/lib/nightDetails';
import { NightNotesScreen } from '../src/screens/NightNotesScreen';
import { demoAfterFirstNight, finishNight } from '../src/lib/nightNotes';
import { OnboardingScreen } from '../src/screens/OnboardingScreen';
import { MicrophonePermissionScreen, NotificationsPermissionScreen } from '../src/screens/PermissionScreen';
import { SplashScreen } from '../src/screens/SplashScreen';
import { ProfileScreen } from '../src/screens/ProfileScreen';
import { CentresScreen } from '../src/screens/CentresScreen';
import { EditDetailsScreen } from '../src/screens/EditDetailsScreen';
import { NotificationSettingsScreen } from '../src/screens/NotificationSettingsScreen';
import { eraseEverything } from '../src/lib/account';

type Step = 'splash' | 'onboarding' | 'microphone' | 'notifications' | 'details' | 'home' | 'recording';

const STEPS: Step[] = ['splash', 'onboarding', 'microphone', 'notifications', 'details', 'home', 'recording'];

function PreviewApp() {
  const [step, setStep] = useState<Step>('splash');
  const [tab, setTab] = useState('home');
  const [recording, setRecording] = useState<{ startedAt: Date; from?: RecordOrigin }>(() => ({ startedAt: new Date() }));
  const [openNight, setOpenNight] = useState<{ night: Night; state: NightState } | null>(null); // demo menu: a night state
  const [openProfile, setOpenProfile] = useState(false); // demo menu: Profile, over Home
  const [run, setRun] = useState(0); // remounts the screen when the demo menu picks it again

  // Demo menu above the phone frame (public/iphone.html): jump to any screen, and keep the menu in step.
  useEffect(() => {
    const onJump = (e: Event) => {
      const key = (e as CustomEvent<string>).detail;
      setOpenNight(null);
      setOpenProfile(key === 'profile');
      if (key === 'profile') {
        setStep('home');
        setTab('home');
      } else if (key.startsWith('night-')) {
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
        if (key === 'recording') setRecording({ startedAt: new Date() });
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
            initialProfile={openProfile}
            onAccountDeleted={() => {
              setStep('splash');
              setRun((n) => n + 1);
            }}
            onStartRecording={(from) => {
              setRecording({ startedAt: new Date(), from });
              setStep('recording');
            }}
          />
        )}
        {/* Over Home, like the app's transparent modal, so the button's blue grows out of Home */}
        {step === 'recording' && (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
            <RecordingScreen
              startedAt={recording.startedAt}
              from={recording.from}
              onStop={() => {
                // Stopping in the morning goes straight to the night, as in the app
                finishNight();
                setStep('home');
                setTab('recordings');
                setOpenNight({ night: sampleNights()[0], state: 'processing' });
                setRun((n) => n + 1);
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
  initialProfile,
  onAccountDeleted,
}: {
  tab: string;
  onTab: (key: string) => void;
  onStartRecording: (from: RecordOrigin) => void;
  initialNight: { night: Night; state: NightState } | null;
  initialProfile: boolean;
  onAccountDeleted: () => void;
}) {
  const [night, setNight] = useState<{ night: Night; state: NightState } | null>(initialNight);
  const [notes, setNotes] = useState(false);
  const [profile, setProfile] = useState<'profile' | 'details' | 'notifications' | 'centres' | null>(initialProfile ? 'profile' : null);
  return (
    <View style={{ flex: 1 }}>
      {tab === 'home' ? (
        <HomeScreen onStartRecording={onStartRecording} onOpenNotes={() => setNotes(true)} onOpenProfile={() => setProfile('profile')} />
      ) : (
        <RecordingsScreen onOpen={(n) => setNight({ night: n, state: nightState(n) })} onOpenProfile={() => setProfile('profile')} />
      )}
      <TabBar items={HOME_TABS} selected={tab} onSelect={onTab} />
      {/* A night, over the list (like the app's push) */}
      {night && <NightScreen night={night.night} state={night.state} onBack={() => setNight(null)} slideIn />}
      {notes && <NightNotesScreen onClose={() => setNotes(false)} slideIn />}
      {/* Profile, and its pages over it */}
      {profile && (
        <ProfileScreen
          backLabel={tab === 'recordings' ? 'Recordings' : 'Home'}
          onBack={() => setProfile(null)}
          onOpenDetails={() => setProfile('details')}
          onOpenNotifications={() => setProfile('notifications')}
          onOpenCentres={() => setProfile('centres')}
          onErased={() => {
            eraseEverything();
            onAccountDeleted();
          }}
        />
      )}
      {profile === 'details' && <EditDetailsScreen onBack={() => setProfile('profile')} />}
      {profile === 'notifications' && <NotificationSettingsScreen onBack={() => setProfile('profile')} />}
      {profile === 'centres' && <CentresScreen onBack={() => setProfile('profile')} />}
    </View>
  );
}

registerRootComponent(PreviewApp);

/**
 * Browser preview entry (not part of the shipped app).
 * Renders the same screens inside an iPhone 17 Pro frame for review.
 * Built with `npm run preview`.
 */
import React from 'react';
import { registerRootComponent } from 'expo';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SplashScreen } from '../src/screens/SplashScreen';

function PreviewApp() {
  return (
    <SafeAreaProvider>
      <SplashScreen />
    </SafeAreaProvider>
  );
}

registerRootComponent(PreviewApp);

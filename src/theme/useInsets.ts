import { Platform } from 'react-native';
import { useSafeAreaInsets, type EdgeInsets } from 'react-native-safe-area-context';

declare global {
  // eslint-disable-next-line no-var
  var __AIRESE_PREVIEW_INSETS__: EdgeInsets | undefined;
}

/** iPhone 17 Pro: status bar + Dynamic Island on top, home indicator below. */
const IPHONE_17_PRO: EdgeInsets = { top: 62, bottom: 34, left: 0, right: 0 };

/**
 * Safe-area insets. In a browser there are none, so when the app runs inside
 * the iPhone frame (/iphone.html or the shared preview) we use the iPhone's.
 */
export function useInsets(): EdgeInsets {
  const insets = useSafeAreaInsets();
  if (Platform.OS === 'web') {
    if (globalThis.__AIRESE_PREVIEW_INSETS__) return globalThis.__AIRESE_PREVIEW_INSETS__;
    if (typeof location !== 'undefined' && location.search.includes('frame=iphone')) return IPHONE_17_PRO;
  }
  return insets;
}

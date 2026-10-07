import { useEffect, type RefObject } from 'react';
import { Platform } from 'react-native';

/**
 * Mobile browsers have their own long-press behaviour (iOS text selection and callout, Android's
 * context menu). Mid-hold it cancels the touch, so press-and-hold controls never finish.
 * Web only; native apps don't do this.
 */
export const holdSafeStyle =
  Platform.OS === 'web' ? ({ userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none', touchAction: 'none', WebkitTapHighlightColor: 'transparent' } as object) : null;

/** Blocks the long-press context menu on a view (web only). */
export function useNoContextMenu(ref: RefObject<unknown>) {
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const el = ref.current as HTMLElement | null;
    if (!el?.addEventListener) return;
    const block = (e: Event) => e.preventDefault();
    el.addEventListener('contextmenu', block);
    return () => el.removeEventListener('contextmenu', block);
  }, [ref]);
}

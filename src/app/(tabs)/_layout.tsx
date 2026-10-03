import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { colors } from '../../theme';

/**
 * Home: two tabs in the platform's own bottom tab bar (iOS tab bar / Android navigation bar).
 * Icons: SF Symbols on iOS, Material Symbols on Android. Web uses _layout.web.tsx.
 */
export default function TabsLayout() {
  return (
    <NativeTabs tintColor={colors.accent} iconColor={colors.textMuted}>
      <NativeTabs.Trigger name="record">
        <NativeTabs.Trigger.Icon sf={{ default: 'mic', selected: 'mic.fill' }} md="mic" />
        <NativeTabs.Trigger.Label>Record</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="history">
        <NativeTabs.Trigger.Icon sf="clock.arrow.circlepath" md="history" />
        <NativeTabs.Trigger.Label>History</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

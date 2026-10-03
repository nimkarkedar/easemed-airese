import { Tabs } from 'expo-router';
import { TabBar, type TabItem } from '../../components';
import { colors } from '../../theme';

// Web / browser preview: the same two tabs with an iOS-style bar (native tabs only exist on iOS and Android).
const ITEMS: TabItem[] = [
  { key: 'record', label: 'Record', icon: 'mic', iconSelected: 'mic_fill' },
  { key: 'history', label: 'History', icon: 'history' },
];

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.background } }}
      tabBar={({ state, navigation }) => (
        <TabBar items={ITEMS} selected={state.routes[state.index].name} onSelect={(key) => navigation.navigate(key)} />
      )}
    >
      <Tabs.Screen name="record" />
      <Tabs.Screen name="history" />
    </Tabs>
  );
}

import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { DetailPage, FormDivider, FormGroup, PAGE_SIDE, PermissionSheet, SettingRow, SettingSwitch } from '../components';
import { usePermissionStatus } from '../lib/permissionStatus';
import { setNotificationPref, useNotificationPrefs, type NotificationPrefs } from '../lib/profile';
import { space } from '../theme';

const OPTIONS: { k: keyof NotificationPrefs; title: string }[] = [
  { k: 'nightReady', title: 'Tell me when my results are ready' },
  { k: 'stillRecording', title: 'Remind me to stop recording' },
  { k: 'bedtime', title: 'Remind me to record each night' },
];

/**
 * Notifications (Profile → Notifications): the system permission first ("Turn on" while it's off),
 * then which ones to get. The switches are greyed out until the permission is on. Turning all
 * notifications off happens in the phone's Settings (iOS doesn't let an app do it).
 */
export function NotificationSettingsScreen({ onBack }: { onBack: () => void }) {
  const prefs = useNotificationPrefs();
  const on = usePermissionStatus('notifications') === 'granted';
  const [sheet, setSheet] = useState(false);

  return (
    <>
      <DetailPage backLabel="Profile" title="Notifications" onBack={onBack}>
        <View style={styles.body}>
          {!on && (
            <FormGroup title="Permission">
              <SettingRow icon="notifications" title="Notifications are off" detail="Turn them on to get any of these." action={{ label: 'Turn on', onPress: () => setSheet(true) }} />
            </FormGroup>
          )}
          <FormGroup title="Send me" footer={on ? 'To turn off all notifications, use your phone’s Settings.' : undefined}>
            {OPTIONS.map((o, i) => (
              <React.Fragment key={o.k}>
                {i > 0 && <FormDivider />}
                <SettingSwitch title={o.title} value={on && prefs[o.k]} enabled={on} onChange={(v) => setNotificationPref(o.k, v)} />
              </React.Fragment>
            ))}
          </FormGroup>
        </View>
      </DetailPage>
      <PermissionSheet kind="notifications" visible={sheet} onAllowed={() => setSheet(false)} onNotNow={() => setSheet(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: PAGE_SIDE, marginTop: space.xl, gap: space.xl },
});

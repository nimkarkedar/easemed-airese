import React from 'react';
import { View } from 'react-native';
import { space } from '../theme';
import { AppText } from './AppText';
import { Button } from './Button';

/**
 * The page's next step (PRD §13), for a sticky footer. The label follows the level of concern:
 * "Keep tracking" for ordinary nights, "Talk to a sleep care team" only for a repeated pattern.
 * Never urgent wording unless Clinical defines when it's needed.
 */
export function CareCTA({ concern, onPress }: { concern: boolean; onPress: () => void }) {
  return (
    <View>
      <Button label={concern ? 'Talk to a sleep care team' : 'Keep tracking'} onPress={onPress} />
      <AppText variant="caption" color="textMuted" style={{ textAlign: 'center', marginTop: space.sm }}>
        Powered by The Air Station
      </AppText>
    </View>
  );
}

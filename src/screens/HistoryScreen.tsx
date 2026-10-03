import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { PageTitle, TAB_BAR_CLEARANCE } from '../components';
import { colors, space, useInsets } from '../theme';

/** History tab. Placeholder until past nights are designed. */
export function HistoryScreen() {
  const insets = useInsets();
  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + space.lg, paddingBottom: TAB_BAR_CLEARANCE }}>
        <PageTitle title="History" />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
});

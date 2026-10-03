import React, { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View, type TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AppText, BottomSheet, Button, FormDivider, FormGroup, FormInput, InfoButton } from '../components';
import { setProfile } from '../lib/profile';
import { colors, space, useInsets } from '../theme';

const SIDE = space.gutter; // standard screen edge

/** Four digits, from 1900 to this year. */
function isValidYear(year: string) {
  const y = Number(year);
  return year.length === 4 && y >= 1900 && y <= new Date().getFullYear();
}

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());

/**
 * Last onboarding step (Figma "iPhone 16 & 17 Pro - 6"): name, year of birth and email.
 * Native grouped form (iOS Settings style, see components/Form). Year of birth is one plain
 * number input: no wheels or calendars. (i) explains why we ask.
 * Email can be verified, or the user can simply continue.
 */
export function DetailsScreen({ onDone }: { onDone?: () => void }) {
  const insets = useInsets();
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [year, setYear] = useState('');
  const [email, setEmail] = useState('');
  const [yearError, setYearError] = useState<string>();
  const [emailError, setEmailError] = useState<string>();
  const [whyOpen, setWhyOpen] = useState(false);

  const lastRef = useRef<TextInput>(null);
  const yearRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);

  // Latest year, read synchronously: focus jumps (and the blur check runs) before state re-renders.
  const yearNow = useRef('');
  const checkYear = () => {
    const y = yearNow.current;
    if (!y || isValidYear(y)) return setYearError(undefined);
    setYearError(y.length < 4 ? 'Use four digits, like 1985.' : 'That year doesn’t look right. Check it and try again.');
  };
  const checkEmail = () => setEmailError(!email || isValidEmail(email) ? undefined : 'Check your email address.');

  const submit = () => {
    checkYear();
    checkEmail();
    const yearOk = !yearNow.current || isValidYear(yearNow.current);
    const emailOk = !email || isValidEmail(email);
    if (!yearOk || !emailOk) return;
    setProfile({ firstName: first, lastName: last, birthYear: yearNow.current, email: email.trim() });
    onDone?.();
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingTop: insets.top + space.xxl, paddingBottom: space.xxl, paddingHorizontal: SIDE }}
        >
          <AppText variant="headline" accessibilityRole="header">
            Great! One last thing…
          </AppText>
          <AppText color="textMuted" style={{ marginTop: space.xs }}>
            Before we begin
          </AppText>

          <View style={styles.fields}>
            <FormGroup title="Name">
              <FormInput
                placeholder="First name"
                value={first}
                onChangeText={setFirst}
                autoCapitalize="words"
                autoComplete="given-name"
                textContentType="givenName"
                returnKeyType="next"
                onSubmitEditing={() => lastRef.current?.focus()}
              />
              <FormDivider />
              <FormInput
                ref={lastRef}
                placeholder="Last name"
                value={last}
                onChangeText={setLast}
                autoCapitalize="words"
                autoComplete="family-name"
                textContentType="familyName"
                returnKeyType="next"
                onSubmitEditing={() => yearRef.current?.focus()}
              />
            </FormGroup>

            <FormGroup
              title="Year of birth"
              titleAction={<InfoButton size={24} onPress={() => setWhyOpen(true)} label="Why we ask for your year of birth" />}
              error={yearError}
            >
              <FormInput
                ref={yearRef}
                placeholder="YYYY"
                accessibilityLabel="Year of birth"
                value={year}
                onChangeText={(v) => {
                  const y = v.replace(/\D/g, '').slice(0, 4);
                  yearNow.current = y;
                  setYear(y);
                  if (yearError) setYearError(undefined);
                  if (y.length === 4) emailRef.current?.focus();
                }}
                keyboardType="number-pad"
                autoComplete="birthdate-year"
                maxLength={4}
                onBlur={checkYear}
              />
            </FormGroup>

            <FormGroup title="Email" footer="Verify to get your report" error={emailError}>
              <FormInput
                ref={emailRef}
                placeholder="name@example.com"
                accessibilityLabel="Email address"
                value={email}
                onChangeText={(v) => {
                  setEmail(v);
                  if (emailError) setEmailError(undefined);
                }}
                onBlur={checkEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="done"
                trailing={
                  // Optional: verify now, or just continue. Flow to be designed.
                  <Pressable onPress={() => {}} hitSlop={12} accessibilityRole="button" accessibilityLabel="Verify your email to get your report">
                    <AppText variant="button" color="accent">
                      Verify
                    </AppText>
                  </Pressable>
                }
              />
            </FormGroup>
          </View>
        </ScrollView>

        <View style={{ paddingHorizontal: SIDE, paddingTop: space.lg, paddingBottom: insets.bottom + space.xxl }}>
          <Button label="Begin your journey" onPress={submit} />
        </View>
      </KeyboardAvoidingView>

      {/* Draft copy: plain, factual, calm (docs/BRAND.md). To be confirmed by design and clinical. */}
      <BottomSheet visible={whyOpen} onClose={() => setWhyOpen(false)}>
        <AppText variant="heading">Why we ask for your year of birth</AppText>
        <AppText color="textMuted" style={{ marginTop: space.sm }}>
          Sleep and breathing change with age, so a doctor needs it to read your sleep report. It stays on your phone and is only added to a report when you choose to share one.
        </AppText>
        <Button label="Got it" onPress={() => setWhyOpen(false)} style={{ marginTop: space.xl }} />
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  fields: { marginTop: space.xxl, gap: space.xl },
});

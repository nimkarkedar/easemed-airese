import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View, type KeyboardTypeOptions, type TextInputProps } from 'react-native';
import { Button, DetailPage, FormDivider, FormGroup, FormInput, PAGE_SIDE } from '../components';
import { isValidEmail, isValidPhone, isValidYear, setProfile, useProfile, type Profile } from '../lib/profile';
import { space } from '../theme';

type Errors = Partial<Record<keyof Profile, string>>;

const CHECKS: Partial<Record<keyof Profile, (v: string) => string | undefined>> = {
  birthYear: (v) => (!v || isValidYear(v) ? undefined : v.length < 4 ? 'Use four digits, like 1985.' : 'That year doesn’t look right. Check it and try again.'),
  email: (v) => (!v || isValidEmail(v) ? undefined : 'Check your email address.'),
  phone: (v) => (!v || isValidPhone(v) ? undefined : 'Check your phone number, including the country code.'),
};

/**
 * Your details (Profile → Edit details): name, year of birth, email, phone and where you live.
 * Edits are a draft: Save checks them and keeps them; Back leaves without changing anything.
 * Each field is checked when you leave it, and all of them again on Save.
 */
export function EditDetailsScreen({ onBack }: { onBack: () => void }) {
  const saved = useProfile();
  const [draft, setDraft] = useState<Profile>(saved);
  const [errors, setErrors] = useState<Errors>({});

  const set = (k: keyof Profile, v: string) => {
    setDraft((d) => ({ ...d, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };
  const check = (k: keyof Profile) => setErrors((e) => ({ ...e, [k]: CHECKS[k]?.(draft[k].trim()) }));

  const save = (leave: (then: () => void) => void) => {
    const next: Errors = {};
    for (const k of Object.keys(CHECKS) as (keyof Profile)[]) next[k] = CHECKS[k]?.(draft[k].trim());
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;
    setProfile(Object.fromEntries(Object.entries(draft).map(([k, v]) => [k, v.trim()])) as Profile);
    leave(onBack);
  };

  const field = (k: keyof Profile, props: Omit<TextInputProps, 'style' | 'value' | 'onChangeText' | 'keyboardType'> & { keyboardType?: KeyboardTypeOptions; clean?: (v: string) => string }) => {
    const { clean, ...input } = props;
    return <FormInput {...input} value={draft[k]} onChangeText={(v) => set(k, clean ? clean(v) : v)} onBlur={CHECKS[k] ? () => check(k) : undefined} returnKeyType="next" />;
  };

  return (
    <DetailPage backLabel="Profile" title="Your details" onBack={onBack} footer={(leave) => <Button label="Save" onPress={() => save(leave)} />}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.body}>
          <FormGroup title="Name">
            {field('firstName', { placeholder: 'First name', autoComplete: 'given-name', textContentType: 'givenName', autoCapitalize: 'words' })}
            <FormDivider />
            {field('lastName', { placeholder: 'Last name', autoComplete: 'family-name', textContentType: 'familyName', autoCapitalize: 'words' })}
          </FormGroup>

          <FormGroup title="Year of birth" error={errors.birthYear}>
            {field('birthYear', { placeholder: 'YYYY', accessibilityLabel: 'Year of birth', keyboardType: 'number-pad', maxLength: 4, autoComplete: 'birthdate-year', clean: (v) => v.replace(/\D/g, '').slice(0, 4) })}
          </FormGroup>

          <FormGroup title="Email" error={errors.email}>
            {field('email', {
              placeholder: 'name@example.com',
              accessibilityLabel: 'Email address',
              keyboardType: 'email-address',
              autoCapitalize: 'none',
              autoCorrect: false,
              autoComplete: 'email',
              textContentType: 'emailAddress',
            })}
          </FormGroup>

          <FormGroup title="Phone" error={errors.phone}>
            {field('phone', { placeholder: '+44 7700 900123', accessibilityLabel: 'Phone number', keyboardType: 'phone-pad', autoComplete: 'tel', textContentType: 'telephoneNumber' })}
          </FormGroup>

          {/* PRODUCT TO CONFIRM: what phone and location are for, and when they're shared. Copy assumes
              they stay on the phone unless the user asks the care team to call. */}
          <FormGroup title="Where you live" footer="Kept on this phone. Shared with the sleep care team only if you ask them to call you.">
            {field('city', { placeholder: 'City', autoComplete: 'postal-address-locality', textContentType: 'addressCity', autoCapitalize: 'words' })}
            <FormDivider />
            {field('region', { placeholder: 'State or region', autoComplete: 'postal-address-region', textContentType: 'addressState', autoCapitalize: 'words' })}
            <FormDivider />
            {field('country', { placeholder: 'Country', autoComplete: 'country', textContentType: 'countryName', autoCapitalize: 'words' })}
          </FormGroup>
        </View>
      </KeyboardAvoidingView>
    </DetailPage>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: PAGE_SIDE, marginTop: space.xl, gap: space.xl },
});

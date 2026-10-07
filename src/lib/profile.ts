import { useSyncExternalStore } from 'react';
import { recall, remember } from './session';

/**
 * The user's details: name, year of birth and email from onboarding; phone and where they live
 * added later in Profile. Kept in memory for the prototype.
 * Engineering: persist on device (e.g. expo-secure-store / SQLite) in line with "data stays on your phone".
 */
export type Profile = {
  firstName: string;
  lastName: string;
  birthYear: string;
  email: string;
  phone: string;
  city: string;
  region: string; // state, county or province
  country: string;
};

const EMPTY: Profile = { firstName: '', lastName: '', birthYear: '', email: '', phone: '', city: '', region: '', country: '' };

let profile: Profile = { ...EMPTY, ...recall<Partial<Profile>>('profile', {}) };
const listeners = new Set<() => void>();

export function setProfile(next: Partial<Profile>) {
  profile = { ...profile, ...next };
  remember('profile', profile);
  listeners.forEach((l) => l());
}

/** Delete account: back to an empty profile. */
export const clearProfile = () => setProfile(EMPTY);

export function useProfile(): Profile {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => profile,
  );
}

/** "Kedar Nimkar" → "KN". Empty when no name was given. */
export function initials({ firstName, lastName }: Profile) {
  return `${firstName.trim()[0] ?? ''}${lastName.trim()[0] ?? ''}`.toUpperCase();
}

/** Four digits, from 1900 to this year. */
export function isValidYear(year: string) {
  const y = Number(year);
  return year.length === 4 && y >= 1900 && y <= new Date().getFullYear();
}

export const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());

/** Digits, spaces and the usual phone punctuation; at least 7 digits. */
export const isValidPhone = (phone: string) => /^[+\d][\d\s().-]*$/.test(phone.trim()) && phone.replace(/\D/g, '').length >= 7;

// ---------- Notification preferences ----------

/**
 * Which notifications the user wants, on top of the system permission (which has to be on for any
 * of them). Defaults: all on. Engineering: schedule from these (expo-notifications).
 */
export type NotificationPrefs = { nightReady: boolean; stillRecording: boolean; bedtime: boolean };
let prefs: NotificationPrefs = recall('notificationPrefs', { nightReady: true, stillRecording: true, bedtime: false });
const prefListeners = new Set<() => void>();

export function setNotificationPref(key: keyof NotificationPrefs, on: boolean) {
  prefs = { ...prefs, [key]: on };
  remember('notificationPrefs', prefs);
  prefListeners.forEach((l) => l());
}

export function useNotificationPrefs(): NotificationPrefs {
  return useSyncExternalStore(
    (l) => {
      prefListeners.add(l);
      return () => prefListeners.delete(l);
    },
    () => prefs,
  );
}

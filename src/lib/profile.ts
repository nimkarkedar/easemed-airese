import { useSyncExternalStore } from 'react';

/**
 * The user's details from onboarding, kept in memory for the prototype.
 * Engineering: persist on device (e.g. expo-secure-store / SQLite) in line with "data stays on your phone".
 */
export type Profile = { firstName: string; lastName: string; birthYear: string; email: string };

let profile: Profile = { firstName: '', lastName: '', birthYear: '', email: '' };
const listeners = new Set<() => void>();

export function setProfile(next: Partial<Profile>) {
  profile = { ...profile, ...next };
  listeners.forEach((l) => l());
}

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

import { CharacterIndicator, GradeCode, UserAccount } from '../types';

export const ADMIN_ONLY_TABS = [
  'school-profile',
  'teachers',
  'classes',
  'students',
  'settings'
] as const;

export type AdminOnlyTab = (typeof ADMIN_ONLY_TABS)[number];

export function isAdminOnlyTab(tab: string): boolean {
  return (ADMIN_ONLY_TABS as readonly string[]).includes(tab);
}

export function canAccessTab(tab: string, isAdminLoggedIn: boolean): boolean {
  if (!isAdminOnlyTab(tab)) return true;
  return isAdminLoggedIn;
}

export function getPrefixForGrade(
  indicator: Pick<
    CharacterIndicator,
    'defaultDescriptionPrefix' | 'descriptionPrefixA' | 'descriptionPrefixB' | 'descriptionPrefixC'
  >,
  grade: GradeCode | ''
): string {
  if (grade === 'A') {
    return (indicator.descriptionPrefixA || indicator.defaultDescriptionPrefix || '').trim();
  }
  if (grade === 'B') {
    return (indicator.descriptionPrefixB || indicator.defaultDescriptionPrefix || '').trim();
  }
  if (grade === 'C') {
    return (indicator.descriptionPrefixC || indicator.defaultDescriptionPrefix || '').trim();
  }
  return (
    indicator.descriptionPrefixA ||
    indicator.defaultDescriptionPrefix ||
    indicator.descriptionPrefixB ||
    indicator.descriptionPrefixC ||
    ''
  ).trim();
}

export function applyGradePrefixToNotes(
  currentNotes: string,
  indicator: Pick<
    CharacterIndicator,
    'defaultDescriptionPrefix' | 'descriptionPrefixA' | 'descriptionPrefixB' | 'descriptionPrefixC'
  >,
  newGrade: GradeCode
): string {
  const targetPrefix = getPrefixForGrade(indicator, newGrade);
  if (!targetPrefix) return currentNotes;

  const trimmedCurrent = currentNotes.trim();
  if (!trimmedCurrent) {
    return `${targetPrefix} `;
  }

  // Collect all known prefixes for this indicator (longest first to avoid partial matches)
  const knownPrefixes = [
    indicator.descriptionPrefixA,
    indicator.descriptionPrefixB,
    indicator.descriptionPrefixC,
    indicator.defaultDescriptionPrefix
  ]
    .map(p => (p || '').trim())
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);

  for (const existingPrefix of knownPrefixes) {
    if (trimmedCurrent === existingPrefix) {
      return `${targetPrefix} `;
    }
    if (trimmedCurrent.startsWith(existingPrefix)) {
      const rest = trimmedCurrent.slice(existingPrefix.length).trim();
      return rest ? `${targetPrefix} ${rest}` : `${targetPrefix} `;
    }
  }

  // User already wrote completely custom text; preserve it as-is
  return currentNotes;
}

export function authenticateAdmin(
  usernameInput: string,
  passwordInput: string,
  users: UserAccount[]
): UserAccount | null {
  const cleanUser = usernameInput.trim();
  const cleanPass = passwordInput;
  if (!cleanUser || !cleanPass) return null;

  const match = users.find(
    u =>
      u.role === 'admin' &&
      u.username.trim().toLowerCase() === cleanUser.toLowerCase() &&
      (u.password || '') === cleanPass
  );

  return match || null;
}

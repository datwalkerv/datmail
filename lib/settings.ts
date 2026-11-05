import { storage } from 'wxt/utils/storage';

export type Theme = 'dark' | 'light' | 'system';

export interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string;
  /** Lowercase email addresses or `@domain` entries. */
  senders: string[];
}

export interface Settings {
  theme: Theme;
  hideCheckbox: boolean;
  hideStar: boolean;
  hideArchiveSnooze: boolean;
  darkBodies: boolean;
  hideSidePanel: boolean;
  codes: boolean;
  codeExpiryHours: number;
  spam: boolean;
  strictness: 'conservative' | 'balanced';
  allowlist: string[];
  blocklist: string[];
  categories: Category[];
}

export const DEFAULTS: Settings = {
  theme: 'system',
  hideCheckbox: true,
  hideStar: true,
  hideArchiveSnooze: true,
  darkBodies: true,
  hideSidePanel: true,
  codes: true,
  codeExpiryHours: 24,
  spam: true,
  strictness: 'conservative',
  allowlist: [],
  blocklist: [],
  categories: [],
};

// local, not sync: sync caps a single item at 8 KB, which long sender lists can exceed.
const item = storage.defineItem<Partial<Settings>>('local:settings', { fallback: {} });

export const getSettings = async (): Promise<Settings> => ({ ...DEFAULTS, ...(await item.getValue()) });

export const saveSettings = async (patch: Partial<Settings>) =>
  item.setValue({ ...(await getSettings()), ...patch });

export const resetSettings = () => item.removeValue();

export const watchSettings = (cb: (s: Settings) => void) =>
  item.watch((v) => cb({ ...DEFAULTS, ...v }));

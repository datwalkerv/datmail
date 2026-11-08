import { storage } from 'wxt/utils/storage';

export type Theme = 'dark' | 'light' | 'system';

export interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string;
  /** Lowercase email addresses or `@domain` entries. */
  senders: string[];
  /** Words matched (case-insensitive) in the subject or preview line, e.g. "invoice". */
  keywords?: string[];
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
  /** Replaces the old `strictness` key, so existing users move to the new strict default. */
  filtering: 'light' | 'balanced' | 'strict';
  allowlist: string[];
  blocklist: string[];
  categories: Category[];
  /** Set once Money has been offered, so deleting it sticks. */
  moneySeeded?: boolean;
}

/** Built-in category every user starts with: matches money-related mail by keyword. */
export const MONEY: Category = {
  id: 'money',
  name: 'Money',
  color: '#3fb68b',
  senders: [],
  // Gmail search matches whole words, so common inflected forms are listed explicitly.
  keywords: [
    'invoice', 'invoices', 'receipt', 'receipts', 'payment', 'payments', 'refund', 'refunds', 'payout', 'money added', 'money received',
    'számla', 'számlát', 'számlája', 'számlád', 'számlaértesítő', 'e-számla', 'nyugta', 'fizetés', 'fizetési', 'befizetés', 'kifizetés',
    'utalás', 'átutalás', 'jóváírás', 'visszatérítés', 'díjbekérő',
  ],
};

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
  filtering: 'strict',
  allowlist: [],
  blocklist: [],
  categories: [MONEY],
};

/** Stored values over defaults. Users who saved categories before Money existed get it appended (once). */
export function withDefaults(v: Partial<Settings>): Settings {
  const s = { ...DEFAULTS, ...v };
  const hasMoney = s.categories.some((c) => c.id === MONEY.id || c.name.toLowerCase() === 'money');
  if (!v.moneySeeded && !hasMoney) s.categories = [...s.categories, MONEY];
  return s;
}

// local, not sync: sync caps a single item at 8 KB, which long sender lists can exceed.
const item = storage.defineItem<Partial<Settings>>('local:settings', { fallback: {} });

export const getSettings = async (): Promise<Settings> => withDefaults(await item.getValue());

export const saveSettings = async (patch: Partial<Settings>) =>
  item.setValue({ ...(await getSettings()), ...patch, moneySeeded: true });

export const resetSettings = () => item.removeValue();

export const watchSettings = (cb: (s: Settings) => void) =>
  item.watch((v) => cb(withDefaults(v ?? {})));

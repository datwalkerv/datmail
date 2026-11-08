import { matchesSender } from '../detect/match';

// The Filtered panel's "keep" choices live in Gmail's localStorage (this browser only, per the user's request).
const KEY = 'datmail-keep';
export const KEEP_EVENT = 'datmail:keep';

export interface Keep {
  /** Single emails restored with "Restore". */
  threads: string[];
  /** Senders never filtered again ("Don't filter sender"). */
  senders: string[];
}

export function getKeep(): Keep {
  try {
    return { threads: [], senders: [], ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    return { threads: [], senders: [] };
  }
}

export function addKeep(kind: keyof Keep, value: string) {
  const k = getKeep();
  if (!k[kind].includes(value)) k[kind].push(value);
  try {
    localStorage.setItem(KEY, JSON.stringify(k));
  } catch {}
  dispatchEvent(new Event(KEEP_EVENT));
}

export const isKept = (k: Keep, row: { threadId: string; email: string }) =>
  k.threads.includes(row.threadId) || matchesSender(k.senders, row.email);

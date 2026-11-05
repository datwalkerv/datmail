import type { Category } from '../settings';

export interface CodeItem { threadId: string; app: string; code: string; time: number }
export interface FilteredItem { threadId: string; email: string; name: string; subject: string; time: number | null }
export interface BarState {
  inbox: boolean;
  codes: CodeItem[];
  filtered: FilteredItem[];
  categories: Category[];
}

let state: BarState = { inbox: false, codes: [], filtered: [], categories: [] };
let sig = '';
const subs = new Set<() => void>();

export const barStore = {
  get: () => state,
  set(next: BarState) {
    const s = JSON.stringify(next);
    if (s === sig) return; // the observer fires constantly; only re-render on real changes
    sig = s;
    state = next;
    subs.forEach((f) => f());
  },
  subscribe(f: () => void) {
    subs.add(f);
    return () => void subs.delete(f);
  },
};

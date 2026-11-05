import type { Category } from '../settings';
import { matchesSender } from '../detect/match';

export const categoryFor = (cats: Category[], email: string) =>
  email ? cats.find((c) => matchesSender(c.senders, email)) : undefined;

/** Gmail's own search does the filtering, so it covers all mail, not just the loaded page. */
export const categoryQuery = (c: Category) =>
  '{' + c.senders.map((s) => 'from:' + s.trim().replace(/^@/, '')).join(' ') + '}';

export const searchHash = (c: Category) => '#search/' + encodeURIComponent(categoryQuery(c));

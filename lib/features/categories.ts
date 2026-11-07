import type { Category } from '../settings';
import { matchesSender } from '../detect/match';

type RowLike = { email: string; subject: string; snippet: string };

// Keyword must start a word ("számla" hits "Számlaértesítő", "pay" misses "repayment"). \b is ASCII-only, so use \p{L}.
const keywordRe = (k: string) => new RegExp(`(^|[^\\p{L}\\p{N}])${k.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'iu');

/**
 * Gmail search for a category across all mail. Keywords are limited to subjects (bodies caused false hits);
 * results are then narrowed by categoryFor via the row filter, so the list matches the tint exactly.
 */
export function categoryQuery(c: Category) {
  const q = (k: string) => (/\s/.test(k.trim()) ? `"${k.trim()}"` : k.trim());
  const parts = c.senders.map((s) => 'from:' + s.trim().replace(/^@/, ''));
  if (c.keywords?.length) parts.push(`subject:(${c.keywords.map(q).join(' OR ')})`);
  return parts.join(' OR ');
}

export const searchHash = (c: Category) => '#search/' + encodeURIComponent(categoryQuery(c));

/** A row belongs to the first category whose sender list or keywords match it. */
export function categoryFor(cats: Category[], row: RowLike) {
  const text = `${row.subject} ${row.snippet}`;
  return cats.find(
    (c) => (row.email && matchesSender(c.senders, row.email)) || c.keywords?.some((k) => k.trim() && keywordRe(k).test(text)),
  );
}

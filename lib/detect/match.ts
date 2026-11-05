/** Entries are full addresses or `@domain` (which also matches subdomains). */
export function matchesSender(entries: string[], email: string): boolean {
  const e = email.toLowerCase();
  const domain = e.slice(e.indexOf('@') + 1);
  return entries.some((raw) => {
    const x = raw.trim().toLowerCase();
    if (!x) return false;
    if (x.startsWith('@')) return domain === x.slice(1) || domain.endsWith('.' + x.slice(1));
    return x === e;
  });
}

export const isValidSenderEntry = (s: string) => /^(@|[^@\s]+@)[a-z0-9.-]+\.[a-z]{2,}$/i.test(s.trim());

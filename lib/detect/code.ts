// Verification-code extraction from a row's subject + snippet. Pure; no email body is ever read.

// A code is only accepted near one of these words. English + Hungarian; HU words avoid \b (it is ASCII-only).
const KEYWORD =
  /\b(?:codes?|verification|verify|otp|one[- ]time|passcode|pin|security code|log[- ]?in|sign[- ]?in|2fa|two[- ]factor|authenticat\w*|confirm\w*)\b|kód|ellenőrz|megerősít|belépés|bejelentkez|egyszer használatos|azonosító/gi;

// Candidates, most specific first.
const PATTERNS: RegExp[] = [
  /\b[A-Z]{1,3}-\d{4,8}\b/g, // G-482913
  /\b\d{3}[- ]\d{3}\b/g, // 123-456 / 123 456
  /\b\d{4,8}\b/g,
  /\b(?=[A-Z0-9]*\d)(?=[A-Z0-9]*[A-Z])[A-Z0-9]{5,8}\b/g, // AB12CD (uppercase only; mixed case is usually an id or a word)
];

const BEFORE_REJECT =
  /(?:#|no\.?|nr\.?|order|rendelés\w*|invoice|számla\w*|ticket|case|ref\w*|tracking|awb|ft|huf|eur|usd|\$|€|£|tel\.?|phone|telefon\w*|\+)\s*:?\s*$/i;
const AFTER_REJECT = /^\s*(?:ft\b|huf|eur|usd|€|\$|%|forint|ron|lei|db\b|pcs|items?|:\d|\.\d|,\d|\/\d)/i;

// Promo copy ("use code SAVE20 for 20% off") is never a verification code.
const PROMO = /promo(?:tion(?:al)?)? code|coupon|discount|% off|\bsale\b|kupon|kedvezmény|akció/i;

const MAX_DISTANCE = 80;

export function extractCode(subject: string, snippet: string): string | null {
  const text = `${subject} \n ${snippet}`;
  if (PROMO.test(text)) return null;
  const keywords = [...text.matchAll(KEYWORD)].map((m) => m.index!);
  if (!keywords.length) return null;

  let best: { code: string; dist: number } | null = null;
  const taken: [number, number][] = [];
  for (const re of PATTERNS) {
    for (const m of text.matchAll(re)) {
      const start = m.index!;
      const end = start + m[0].length;
      if (taken.some(([a, b]) => start < b && end > a)) continue; // already covered by a more specific pattern
      taken.push([start, end]);
      if (!plausible(text, m[0], start, end)) continue;
      const dist = Math.min(...keywords.map((k) => Math.abs(k - start)));
      if (dist <= MAX_DISTANCE && (!best || dist < best.dist)) best = { code: m[0], dist };
    }
  }
  return best?.code ?? null;
}

function plausible(text: string, code: string, start: number, end: number): boolean {
  const prev = text[start - 1] ?? ' ';
  const next = text[end] ?? ' ';
  if (/[@/.\w-]/.test(prev) || /[@\w]/.test(next)) return false; // part of an email, URL, or bigger token
  if (next === '.' && /\w/.test(text[end + 1] ?? '')) return false; // domain / decimal
  if (BEFORE_REJECT.test(text.slice(Math.max(0, start - 14), start))) return false;
  if (AFTER_REJECT.test(text.slice(end, end + 8))) return false;
  const digits = code.replace(/\D/g, '');
  if (/^\d{4}$/.test(code) && /^(19|20)\d\d$/.test(code)) return false; // a year
  if (/^(\d)\1+$/.test(digits) && digits.length === code.length) return false; // 0000, 111111
  // Part of a longer digit run, like a phone number "30 123 4567".
  if (/\d[\s-]?$/.test(text.slice(Math.max(0, start - 2), start)) || /^[\s-]?\d/.test(text.slice(end, end + 2))) return false;
  return true;
}

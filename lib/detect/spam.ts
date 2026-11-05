// Conservative promo/spam scoring from what the inbox row shows. Pure. False negatives are fine; false positives are not.

export interface SpamInput {
  email: string;
  name: string;
  subject: string;
  snippet: string;
}

// Anything that looks like it matters to the user is never filtered.
const TRANSACTIONAL =
  /invoice|receipt|payment|paid|refund|statement|your order|order (?:#|no|number|confirm|shipped|status)|shipp(?:ed|ing)|deliver|tracking|password|security|verif|sign[- ]?in|log[- ]?in|account|booking|reservation|ticket|appointment|contract|számla|nyugta|fizet|befizet|visszatérít|rendelés|(?<!ingyenes )szállít|kézbesít|csomag|jelszó|biztonsági|fiók|bejelentkez|foglalás|időpont|szerződés|ajánlatkérés/i;

const PROMO_SENDER = /^(?:newsletter|news|marketing|promo(?:tions?)?|offers?|deals?|sales?|campaigns?|mailer|hirlevel|hírlevél|akcio)\b/i;
const NOREPLY_SENDER = /^(?:no-?reply|do-?not-?reply|info|hello|hi|team)\b/i;
const ESP_DOMAIN =
  /(?:mailchimp|mcsv\.net|mcdlv\.net|sendgrid|klaviyo|mailerlite|sendinblue|brevo|hubspot|exacttarget|rsgsv|cmail\d*|createsend|emarsys|salesforce|mktomail|substack)\.|^(?:e|em\d*|email|mail|news|newsletter|info|marketing|promo|m|t)\./i;

const PROMO_PHRASES: RegExp[] = [
  /\d{1,2}\s?%/,
  /% off|\boff\b.*\btoday\b/i,
  /\bsale\b|\bdiscount|\bcoupon|promo code|\bdeals?\b/i,
  /limited time|last chance|ends (?:today|tonight|soon)|don'?t miss|only today/i,
  /free shipping|black friday|cyber monday|new arrivals|shop now|exclusive offer/i,
  /akció|kedvezmény|leárazás|kupon|utolsó esély|ingyenes szállítás|csak ma|ne maradj le|kiárusítás|black friday/i,
];

export function spamScore({ email, name, subject, snippet }: SpamInput): number {
  const local = email.split('@')[0] ?? '';
  const domain = email.split('@')[1] ?? '';
  const text = `${subject} ${snippet}`;
  let score = 0;
  if (PROMO_SENDER.test(local) || PROMO_SENDER.test(name)) score += 0.35;
  else if (NOREPLY_SENDER.test(local)) score += 0.1;
  if (ESP_DOMAIN.test(domain)) score += 0.2;
  const phrases = PROMO_PHRASES.filter((re) => re.test(text)).length;
  score += Math.min(phrases * 0.25, 0.6);
  if (/!{2,}/.test(subject) || capsRatio(subject) > 0.5) score += 0.15;
  return Math.min(score, 1);
}

const capsRatio = (s: string) => {
  const words = s.split(/\s+/).filter((w) => w.length > 3 && /\p{L}/u.test(w));
  return words.length < 3 ? 0 : words.filter((w) => w === w.toUpperCase()).length / words.length;
};

export const THRESHOLD = { conservative: 0.75, balanced: 0.55 } as const;

export interface SpamContext {
  strictness: keyof typeof THRESHOLD;
  /** Sender is allowlisted or belongs to a category. */
  trusted: boolean;
  blocked: boolean;
  hasCode: boolean;
}

export function isSpam(row: SpamInput, ctx: SpamContext): boolean {
  if (ctx.blocked) return true;
  if (ctx.trusted || ctx.hasCode || !row.email) return false;
  if (TRANSACTIONAL.test(`${row.subject} ${row.snippet}`)) return false;
  return spamScore(row) >= THRESHOLD[ctx.strictness];
}

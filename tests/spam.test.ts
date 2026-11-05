import { describe, expect, it } from 'vitest';
import { isSpam } from '../lib/detect/spam';
import { matchesSender } from '../lib/detect/match';
import { timeFromMsgId } from '../lib/gmail/rows';

const ctx = { strictness: 'conservative' as const, trusted: false, blocked: false, hasCode: false };
const row = (email: string, subject: string, snippet = '', name = '') => ({ email, name, subject, snippet });

describe('isSpam', () => {
  it.each([
    row('newsletter@shop.com', 'BLACK FRIDAY: 50% off everything!!!', 'Shop now, limited time'),
    row('promo@em.store.hu', 'Utolsó esély: 30% kedvezmény', 'Ingyenes szállítás csak ma'),
    row('deals@mail.brand.com', 'Exclusive offer just for you', 'Sale ends tonight, use coupon'),
  ])('flags obvious promo %#', (r) => expect(isSpam(r, ctx)).toBe(true));

  it.each([
    row('newsletter@shop.com', 'Your invoice for November', '20% VAT included'),
    row('noreply@shop.com', 'Receipt for your payment', 'Black friday order'),
    row('promo@store.hu', 'Számla: 50% kedvezmény', 'ingyenes szállítás'),
    row('anna@client.com', 'Project kickoff', 'Hi, sharing the brief'),
    row('no-reply@accounts.google.com', 'Security alert', 'New sign-in'),
    row('marketing@x.com', 'Reset your password', 'Limited time link'),
    row('info@notino.hu', 'Black Friday kedvezmény', 'Akció'), // promo, but not loud enough for conservative
  ])('keeps important or borderline %#', (r) => expect(isSpam(r, ctx)).toBe(false));

  it('honours trust, codes, and blocklist', () => {
    const promo = row('newsletter@shop.com', 'BLACK FRIDAY 50% off!!!', 'shop now');
    expect(isSpam(promo, { ...ctx, trusted: true })).toBe(false);
    expect(isSpam(promo, { ...ctx, hasCode: true })).toBe(false);
    expect(isSpam(row('a@b.com', 'hi'), { ...ctx, blocked: true })).toBe(true);
  });

  it('balanced catches more', () => {
    const r = row('info@notino.hu', 'Black Friday kedvezmény 30%', 'Akció');
    expect(isSpam(r, { ...ctx, strictness: 'balanced' })).toBe(true);
  });
});

describe('matchesSender', () => {
  it('matches address and domain entries', () => {
    expect(matchesSender(['Anna@Client.com'], 'anna@client.com')).toBe(true);
    expect(matchesSender(['@client.com'], 'bob@eu.client.com')).toBe(true);
    expect(matchesSender(['@client.com'], 'bob@notclient.com')).toBe(false);
  });
});

describe('timeFromMsgId', () => {
  it('decodes a real id', () => {
    expect(new Date(timeFromMsgId('1a1ad40f1bae2f61')!).toISOString()).toBe('2026-11-05T19:47:56.986Z');
    expect(timeFromMsgId('zz')).toBeNull();
  });
});

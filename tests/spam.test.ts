import { describe, expect, it } from 'vitest';
import { isSpam } from '../lib/detect/spam';
import { matchesSender } from '../lib/detect/match';
import { isKept } from '../lib/features/keep';
import { timeFromMsgId } from '../lib/gmail/rows';

// All fixtures are fictional: example.* domains and made-up names.
const ctx = { level: 'light' as const, trusted: false, blocked: false, hasCode: false };
const row = (email: string, subject: string, snippet = '', name = '') => ({ email, name, subject, snippet });

describe('isSpam (light)', () => {
  it.each([
    row('newsletter@shop.example.com', 'BLACK FRIDAY: 50% off everything!!!', 'Shop now, limited time'),
    row('promo@em.store.example.hu', 'Utolsó esély: 30% kedvezmény', 'Ingyenes szállítás csak ma'),
    row('deals@mail.brand.example.com', 'Exclusive offer just for you', 'Sale ends tonight, use coupon'),
  ])('flags obvious promo %#', (r) => expect(isSpam(r, ctx)).toBe(true));

  it.each([
    row('newsletter@shop.example.com', 'Your invoice for November', '20% VAT included'),
    row('noreply@shop.example.com', 'Receipt for your payment', 'Black friday order'),
    row('promo@store.example.hu', 'Számla: 50% kedvezmény', 'ingyenes szállítás'),
    row('anna@client.example.com', 'Project kickoff', 'Hi, sharing the brief'),
    row('no-reply@accounts.example.com', 'Security alert', 'New sign-in'),
    row('marketing@example.com', 'Reset your password', 'Limited time link'),
    row('info@beauty.example.hu', 'Black Friday kedvezmény', 'Akció'), // promo, but not loud enough for light
  ])('keeps important or borderline %#', (r) => expect(isSpam(r, ctx)).toBe(false));

  it('honours trust, codes, and blocklist', () => {
    const promo = row('newsletter@shop.example.com', 'BLACK FRIDAY 50% off!!!', 'shop now');
    expect(isSpam(promo, { ...ctx, trusted: true })).toBe(false);
    expect(isSpam(promo, { ...ctx, hasCode: true })).toBe(false);
    expect(isSpam(row('a@example.com', 'hi'), { ...ctx, blocked: true })).toBe(true);
  });

  it('balanced catches more', () => {
    const r = row('info@beauty.example.hu', 'Black Friday kedvezmény 30%', 'Akció');
    expect(isSpam(r, { ...ctx, level: 'balanced' })).toBe(true);
  });
});

describe('isSpam (strict: hide all automated mail)', () => {
  const strict = { ...ctx, level: 'strict' as const };

  it.each([
    row('messages-noreply@social.example.com', 'Önnek 1 új meghívása van', 'Nézd meg, ki kereste meg'),
    row('noreply@community.example.com', '1 new notification since 3:23 pm', 'Your community has new posts'),
    row('hello@app.example.com', 'AI that knows your work, wherever you are', "See what's new this month."),
    row('noreply@tm.example.com', 'Próbálj ki 4 új képstílust', 'Színelemzés vagy manga?'),
    row('no-reply@chat.example.com', 'Peter just joined your workspace!', 'Head over to say hi'),
    row('anna@brand.example.com', 'Weekend sale: 30% off', 'Shop now'),
    row('editorial@mkt.travel.example.com', 'How far would you travel for food?', 'The people traveling miles for an ingredient.'),
    row('noreply@email.example.com', "We've updated your account on our apps", "See what's new. You can log in to review the changes."),
    row('coach@training.example.com', 'Where are you?', "Tonight's the night! We're about to kick off an epic LIVE podcast"),
  ])('hides automated %#', (r) => expect(isSpam(r, strict)).toBe(true));

  it.each([
    row('anna@example.com', 'Re: Vágás, szerződés, megrendelő', 'Szia! Most töltöm éppen fel'),
    row('no-reply@accounts.example.com', 'Biztonsági értesítés', 'Új bejelentkezés'),
    row('noreply@bank.example.com', 'Money added to your account', 'Your balance was updated.'),
    row('security@mail.social.example.com', 'New login from Chrome on Mac OS X', 'We noticed a new login'),
    row('ertesites@billing.example.hu', 'Értesítő: Számla érkezett', 'Köszönjük'),
    row('no-reply@accounts.example.com', 'Your account was recovered successfully', 'This is a copy of a security alert'),
    row('noreply@service.example.com', 'Your account has been suspended', 'Action required'),
    row('noreply@email.example.com', 'Your secure link is here', 'Sign in to continue. Click the button below'),
    row('no-reply@service.example.ro', 'Login from new IP address 2001:db8::1', 'We detected'),
    row('noreply@courier.example.ro', 'Azi îți livrăm coletul cu AWB 1234567890123!', 'Vezi PIN-ul și alte informații'),
    row('no-reply@service.example.com', 'Authentication code received', 'Your code is ready'),
  ])('keeps people, money, deliveries and security %#', (r) => expect(isSpam(r, strict)).toBe(false));

  it('keeps codes even from noreply', () => {
    expect(isSpam(row('noreply@stream.example.com', 'Your login code'), { ...strict, hasCode: true })).toBe(false);
  });
});

describe('keep list', () => {
  it('matches a kept thread or sender', () => {
    const k = { threads: ['t1'], senders: ['@social.example.com'] };
    expect(isKept(k, { threadId: 't1', email: 'x@example.com' })).toBe(true);
    expect(isKept(k, { threadId: 't2', email: 'noreply@social.example.com' })).toBe(true);
    expect(isKept(k, { threadId: 't2', email: 'x@example.com' })).toBe(false);
  });
});

describe('matchesSender', () => {
  it('matches address and domain entries', () => {
    expect(matchesSender(['Anna@Client.example.com'], 'anna@client.example.com')).toBe(true);
    expect(matchesSender(['@client.example.com'], 'bob@eu.client.example.com')).toBe(true);
    expect(matchesSender(['@client.example.com'], 'bob@notclient.example.com')).toBe(false);
  });
});

describe('timeFromMsgId', () => {
  it('decodes the send time from a Gmail message id', () => {
    const ms = Date.UTC(2026, 0, 15, 12, 30);
    const id = ((BigInt(ms) << 20n) | 0x5f3an).toString(16); // low 20 bits are not time
    expect(timeFromMsgId(id)).toBe(ms);
    expect(timeFromMsgId('zz')).toBeNull();
  });
});

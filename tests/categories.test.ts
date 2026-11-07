import { describe, expect, it } from 'vitest';
import { categoryFor, categoryQuery } from '../lib/features/categories';

const money = { id: 'm', name: 'Money', color: '#0f0', senders: [], keywords: ['invoice', 'számla'] };
const clients = { id: 'c', name: 'Clients', color: '#00f', senders: ['@client.com'] };
const row = (email: string, subject: string, snippet = '') => ({ email, subject, snippet });

describe('categoryFor', () => {
  it('matches keywords in subject or preview, case-insensitively', () => {
    expect(categoryFor([money], row('a@shop.com', 'Your INVOICE #12'))?.id).toBe('m');
    expect(categoryFor([money], row('a@shop.com', 'Értesítő', 'Számla érkezett'))?.id).toBe('m');
    expect(categoryFor([money], row('a@shop.com', 'Weekly digest'))).toBeUndefined();
  });
  it('first matching category wins; senders still work', () => {
    expect(categoryFor([clients, money], row('bob@client.com', 'invoice'))?.id).toBe('c');
  });
  it('keywords match at a word start only', () => {
    expect(categoryFor([money], row('a@x.hu', 'Számlaértesítő - KBOSS.hu Kft.'))?.id).toBe('m');
    const pay = { ...money, keywords: ['pay'] };
    expect(categoryFor([pay], row('a@x.com', 'Loan repayment schedule'))).toBeUndefined();
    expect(categoryFor([pay], row('a@x.com', 'Pay your bill'))?.id).toBe('m');
  });
  it('search query: senders OR subject keywords, phrases quoted', () => {
    expect(categoryQuery({ ...money, senders: ['@bank.hu'], keywords: ['invoice', 'money added'] })).toBe(
      'from:bank.hu OR subject:(invoice OR "money added")',
    );
    expect(categoryQuery(clients)).toBe('from:client.com');
  });
  it('built-in Money handles real inbox rows', () => {
    const is = (subject: string, snippet = '') => categoryFor([MONEY], row('x@y.com', subject, snippet))?.id === 'money';
    expect(is('Money received from CIRCA TECHNOLOGI', 'Wise. Your account for the world')).toBe(true);
    expect(is('Money added to your account')).toBe(true);
    expect(is("Christmas gift idea: a trip they'll never forget", 'Give your loved ones the joy of travel')).toBe(false);
    expect(is('puffcontent.hu 3 nap múlva lejár', 'Kedves Balog Bálint! Tájékoztatjuk')).toBe(false);
    expect(is('You received a new message')).toBe(false);
  });
});

import { MONEY, withDefaults } from '../lib/settings';

describe('Money default', () => {
  it('new users get it', () => expect(withDefaults({}).categories).toEqual([MONEY]));
  it('existing users get it appended once', () => {
    expect(withDefaults({ categories: [clients] }).categories.map((c) => c.id)).toEqual(['c', 'money']);
  });
  it('deleting it sticks after a save', () => {
    expect(withDefaults({ categories: [clients], moneySeeded: true }).categories).toEqual([clients]);
  });
  it('no duplicate if the user already made a Money category', () => {
    expect(withDefaults({ categories: [{ ...money, id: 'x' }] }).categories).toHaveLength(1);
  });
});

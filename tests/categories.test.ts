import { describe, expect, it } from 'vitest';
import { categoryFor, categoryQuery } from '../lib/features/categories';

const money = { id: 'm', name: 'Money', color: '#0f0', senders: [], keywords: ['invoice', 'számla'] };
const clients = { id: 'c', name: 'Clients', color: '#00f', senders: ['@client.example.com'] };
const row = (email: string, subject: string, snippet = '') => ({ email, subject, snippet });

describe('categoryFor', () => {
  it('matches keywords in subject or preview, case-insensitively', () => {
    expect(categoryFor([money], row('a@shop.example.com', 'Your INVOICE #12'))?.id).toBe('m');
    expect(categoryFor([money], row('a@shop.example.com', 'Értesítő', 'Számla érkezett'))?.id).toBe('m');
    expect(categoryFor([money], row('a@shop.example.com', 'Weekly digest'))).toBeUndefined();
  });
  it('first matching category wins; senders still work', () => {
    expect(categoryFor([clients, money], row('bob@client.example.com', 'invoice'))?.id).toBe('c');
  });
  it('keywords match at a word start only', () => {
    expect(categoryFor([money], row('a@example.hu', 'Számlaértesítő - Example Kft.'))?.id).toBe('m');
    const pay = { ...money, keywords: ['pay'] };
    expect(categoryFor([pay], row('a@example.com', 'Loan repayment schedule'))).toBeUndefined();
    expect(categoryFor([pay], row('a@example.com', 'Pay your bill'))?.id).toBe('m');
  });
  it('search query: senders OR subject keywords, phrases quoted', () => {
    expect(categoryQuery({ ...money, senders: ['@bank.example.hu'], keywords: ['invoice', 'money added'] })).toBe(
      'from:bank.example.hu OR subject:(invoice OR "money added")',
    );
    expect(categoryQuery(clients)).toBe('from:client.example.com');
  });
  it('built-in Money handles typical rows', () => {
    const is = (subject: string, snippet = '') => categoryFor([MONEY], row('x@example.com', subject, snippet))?.id === 'money';
    expect(is('Money received from Example Ltd', 'Your account was credited')).toBe(true);
    expect(is('Money added to your account')).toBe(true);
    expect(is("Christmas gift idea: a trip they'll never forget", 'Give your loved ones the joy of travel')).toBe(false);
    expect(is('example.hu 3 nap múlva lejár', 'Kedves Ügyfelünk! Tájékoztatjuk')).toBe(false);
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

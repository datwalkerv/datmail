import { describe, expect, it } from 'vitest';
import { extractCode } from '../lib/detect/code';

describe('extractCode', () => {
  it.each([
    ['Your verification code', 'Use 482913 to verify your account.', '482913'],
    ['Sign in to Example', 'Your one-time code is 123-456. It expires in 10 minutes.', '123-456'],
    ['G-482913 is your verification code', '', 'G-482913'],
    ['Login code', 'Enter AB12CD to continue', 'AB12CD'],
    ['Ellenőrző kód', 'Az ellenőrző kódod: 5821', '5821'],
    ['Bejelentkezés', 'A belépési kód 73920184, ne add meg senkinek.', '73920184'],
    ['Your code', 'Code: 0042 expires soon', '0042'],
  ])('%s → finds code', (subject, snippet, code) => {
    expect(extractCode(subject, snippet)).toBe(code);
  });

  it.each([
    ['Order #12345 confirmed', 'Thanks for your order 12345, your code for support is below'],
    ['Your secure link is here [2026-01-05 19:59:01]', 'Sign in to continue. Click the button'],
    ['Black Friday', 'Use code SAVE20 for 20% off, only 4999 Ft'],
    ['Call us', 'Login issues? Call +36 30 123 4567 today'],
    ['Weekly digest', 'You have 12345 new followers since 2024'],
    ['New login to your account', 'We noticed a new login from a device you don’t usually use. Mac OS X'],
    ['Számla', 'A 2026/1234 számú számla kód nélkül, 15000 Ft'],
    ['Tracking', 'Your AWB 1234567890123 code tracking update'],
    ['Security alert', 'login from user12345@example.com was recovered'],
  ])('%s → no code', (subject, snippet) => {
    expect(extractCode(subject, snippet)).toBeNull();
  });
});

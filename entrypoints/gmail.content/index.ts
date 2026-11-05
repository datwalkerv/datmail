import themeCss from './theme.css?inline';
import logoSvg from '../../public/icon.svg?raw';
import barCss from '@/lib/features/bar.css?inline';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { getSettings, watchSettings, type Settings } from '@/lib/settings';
import { applyCachedTheme, applyFlags } from '@/lib/features/theme';
import { categoryFor } from '@/lib/features/categories';
import { barStore, type CodeItem, type FilteredItem } from '@/lib/features/store';
import { Bar } from '@/lib/features/bar';
import { isInboxView, parseRow, type Row } from '@/lib/gmail/rows';
import { SEL } from '@/lib/gmail/selectors';
import { extractCode } from '@/lib/detect/code';
import { isSpam } from '@/lib/detect/spam';
import { matchesSender } from '@/lib/detect/match';

export default defineContentScript({
  matches: ['https://mail.google.com/*'],
  runAt: 'document_start',
  // Injected as a <style> by us (not manifest css) so dev reloads pick up theme changes.
  cssInjectionMode: 'manual',
  async main() {
    const style = document.createElement('style');
    style.id = 'datmail-theme';
    style.textContent = themeCss;
    document.documentElement.append(style); // <head> may not exist yet at document_start
    document.documentElement.style.setProperty('--dm-logo', `url("data:image/svg+xml,${encodeURIComponent(logoSvg)}")`);
    // Dev builds only: `postMessage('datmail:dev-reload')` from the page reloads the extension.
    if (import.meta.env.DEV) document.documentElement.dataset.dmDevId = browser.runtime.id;
    if (import.meta.env.DEV)
      addEventListener('message', (e) => e.data === 'datmail:dev-reload' && browser.runtime.sendMessage('dev-reload'));
    applyCachedTheme();
    let settings: Settings = await getSettings();
    applyFlags(settings);

    const host = document.createElement('div');
    host.id = 'datmail-bar';
    const shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML = `<style>${barCss}</style><div></div>`;
    createRoot(shadow.lastElementChild!).render(createElement(Bar));

    let queued = false;
    const schedule = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        scan();
      });
    };

    function setAttr(el: HTMLElement, name: string, value: string | null) {
      if (el.getAttribute(name) === value) return;
      value === null ? el.removeAttribute(name) : el.setAttribute(name, value);
    }

    // The scan runs on every DOM-change frame; detection is cached per row and settings object.
    const codeCache = new WeakMap<Row, string | null>();
    const spamCache = new WeakMap<Row, { s: Settings; spam: boolean }>();
    const codeFor = (row: Row) => {
      if (!codeCache.has(row)) codeCache.set(row, extractCode(row.subject, row.snippet));
      return codeCache.get(row)!;
    };
    function spamFor(row: Row, cat: unknown, code: string | null) {
      const hit = spamCache.get(row);
      if (hit?.s === settings) return hit.spam;
      const spam = isSpam(row, {
        strictness: settings.strictness,
        trusted: !!cat || matchesSender(settings.allowlist, row.email),
        blocked: matchesSender(settings.blocklist, row.email),
        hasCode: !!code,
      });
      spamCache.set(row, { s: settings, spam });
      return spam;
    }

    function scan() {
      const inbox = isInboxView();
      document.documentElement.dataset.dmView = inbox ? 'inbox' : 'other';
      const now = Date.now();
      const expiry = settings.codeExpiryHours * 3600_000;
      const lists = [...document.querySelectorAll<HTMLElement>(SEL.list)].filter((l) => l.offsetParent);
      const visible = new Set(lists);
      const codes: CodeItem[] = [];
      const filtered: FilteredItem[] = [];

      for (const el of document.querySelectorAll<HTMLElement>(SEL.row)) {
        const row = parseRow(el);
        if (!row) continue;
        const cat = categoryFor(settings.categories, row.email);
        setAttr(el, 'data-dm-cat', cat?.id ?? null);
        if (cat) el.style.setProperty('--dm-cat', cat.color);

        const onScreen = visible.has(el.closest<HTMLElement>(SEL.list)!);
        const recent = row.time !== null && now - row.time < expiry;
        const code = settings.codes && recent ? codeFor(row) : null;
        if (code && onScreen && inbox) codes.push({ threadId: row.threadId, app: row.name || row.email, code, time: row.time! });

        const spam = settings.spam && spamFor(row, cat, codeFor(row));
        setAttr(el, 'data-dm-spam', spam ? '' : null);
        if (spam && onScreen) filtered.push({ threadId: row.threadId, email: row.email, name: row.name, subject: row.subject, time: row.time });
      }

      barStore.set({ inbox, codes, filtered, categories: settings.categories });

      const anchor = lists[0];
      if (anchor && host.nextElementSibling !== anchor) anchor.before(host);
    }

    watchSettings((s) => {
      settings = s;
      applyFlags(s);
      schedule();
    });
    // childList only: our own attribute writes must not retrigger the scan.
    new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });
    addEventListener('hashchange', schedule);
    setInterval(schedule, 60_000); // codes expire with time, not with DOM changes
    schedule();
  },
});

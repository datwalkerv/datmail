// Every Gmail DOM assumption lives here. When Gmail ships a UI change, this is the file to fix.
// Verified against live Gmail (hu locale) on 2026-11-05. Never match on visible text: it is localized.
export const SEL = {
  row: 'tr.zA',
  unreadClass: 'zE',
  sender: 'span[email]',
  ids: '[data-legacy-last-message-id]',
  subject: '.bog',
  snippet: '.y2',
  /** A thread-list container; the datmail bar is inserted before the first visible one. */
  list: '.ae4',
  /** Right side of the list toolbar (holds the "1–50 of N" counter); verification codes go first in it. */
  toolbarRight: '.G-atb .Cr',
} as const;

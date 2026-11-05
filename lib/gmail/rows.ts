import { SEL } from './selectors';

export interface Row {
  el: HTMLElement;
  threadId: string;
  msgId: string;
  email: string;
  name: string;
  subject: string;
  snippet: string;
  /** Epoch ms of the latest message, or null if unknown. */
  time: number | null;
}

/** Gmail legacy message ids are hex; the top bits are the send time in ms. */
export function timeFromMsgId(hex: string): number | null {
  if (!/^[0-9a-f]{8,20}$/i.test(hex)) return null;
  const ms = Number(BigInt('0x' + hex) >> 20n);
  return ms > 1.1e12 && ms < Date.now() + 864e5 ? ms : null;
}

const cache = new WeakMap<HTMLElement, Row>();

export function parseRow(el: HTMLElement): Row | null {
  const ids = el.querySelector<HTMLElement>(SEL.ids);
  const msgId = ids?.dataset.legacyLastMessageId;
  if (!ids || !msgId) return null;
  const hit = cache.get(el);
  if (hit?.msgId === msgId) return hit; // Gmail recycles <tr>s, so key the cache on the message id.
  const sender = el.querySelector(SEL.sender);
  const row: Row = {
    el,
    msgId,
    threadId: ids.dataset.legacyThreadId ?? msgId,
    email: (sender?.getAttribute('email') ?? '').toLowerCase(),
    name: sender?.getAttribute('name') || sender?.textContent || '',
    subject: el.querySelector(SEL.subject)?.textContent?.trim() ?? '',
    snippet: (el.querySelector(SEL.snippet)?.textContent ?? '').replace(/^\s*-\s*/, '').trim(),
    time: timeFromMsgId(msgId),
  };
  cache.set(el, row);
  return row;
}

export const isInboxView = (hash = location.hash) => hash === '' || /^#inbox(\/p\d+)?$/.test(hash);

export const openThread = (threadId: string) => {
  location.hash = '#inbox/' + threadId;
};

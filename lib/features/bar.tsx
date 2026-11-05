import { browser } from 'wxt/browser';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { barStore, type CodeItem } from './store';
import { searchHash } from './categories';
import { openThread } from '../gmail/rows';
import { getSettings, saveSettings } from '../settings';

const FRESH_MS = 10 * 60_000;

export function ago(t: number, now: number) {
  const m = Math.max(0, Math.round((now - t) / 60_000));
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h}h ago` : `${Math.round(h / 24)}d ago`;
}

function useNow() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function CodeCard({ item, now }: { item: CodeItem; now: number }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    // "123-456" is typed without the separator; "G-482913" is copied as shown.
    await navigator.clipboard.writeText(/^\d{3}[- ]\d{3}$/.test(item.code) ? item.code.replace(/\D/g, '') : item.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };
  return (
    // The whole pill copies (no dead zones between pointer and text cursor); the app name opens the email instead.
    <div className={'code-pill' + (now - item.time < FRESH_MS ? ' fresh' : '')} onClick={copy}>
      <button className="app" onClick={(e) => (e.stopPropagation(), openThread(item.threadId))} title="Open email">
        {item.app}
      </button>
      <button className="code" aria-label={`Copy code ${item.code}`} title="Copy">
        {item.code}
      </button>
      <span className="time">{copied ? 'Copied' : ago(item.time, now)}</span>
    </div>
  );
}

/** Lives in Gmail's toolbar, left of the "1–50 of N" counter. */
export function Codes() {
  const s = useSyncExternalStore(barStore.subscribe, barStore.get);
  const now = useNow();
  if (!s.inbox || !s.codes.length) return null;
  return (
    <section className="codes" aria-label="Verification codes">
      {s.codes.map((c) => <CodeCard key={c.threadId} item={c} now={now} />)}
    </section>
  );
}

export function Bar() {
  const s = useSyncExternalStore(barStore.subscribe, barStore.get);
  const now = useNow();
  const [open, setOpen] = useState(false);
  const filtered = s.inbox ? s.filtered : [];
  const cats = s.categories.filter((c) => c.senders.length);
  if (!filtered.length && !cats.length) return null;

  const restore = async (email: string) => {
    const { allowlist } = await getSettings();
    await saveSettings({ allowlist: [...new Set([...allowlist, email])] });
  };

  return (
    <div className="bar">
      <div className="strip">
        <nav className="chips" aria-label="Categories">
          {cats.map((c) => {
            const active = location.hash === searchHash(c);
            return (
              <button
                key={c.id}
                className={'chip' + (active ? ' active' : '')}
                style={{ ['--c' as string]: c.color }}
                onClick={() => (location.hash = active ? '#inbox' : searchHash(c))}
              >
                <span className="dot" />
                {c.icon && <span>{c.icon}</span>}
                {c.name}
              </button>
            );
          })}
        </nav>
        {filtered.length > 0 && (
          <button className="pill" aria-expanded={open} onClick={() => setOpen(!open)}>
            Filtered <span className="count">{filtered.length}</span>
          </button>
        )}
        <button className="gear" aria-label="datmail settings" onClick={() => browser.runtime.sendMessage('open-options')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></svg>
        </button>
      </div>
      {open && filtered.length > 0 && (
        <ul className="filtered" aria-label="Filtered emails">
          {filtered.map((f) => (
            <li key={f.threadId}>
              <span className="from" title={f.email}>{f.name || f.email}</span>
              <span className="subj">{f.subject}</span>
              <span className="time">{f.time ? ago(f.time, now) : ''}</span>
              <button onClick={() => openThread(f.threadId)}>Open</button>
              <button className="primary" onClick={() => restore(f.email)}>Restore</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

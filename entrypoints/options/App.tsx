import { useEffect, useState, type ReactNode } from 'react';
import { DEFAULTS, MONEY, getSettings, resetSettings, saveSettings, watchSettings, type Category, type Settings } from '@/lib/settings';
import { applyFlags } from '@/lib/features/theme';
import { isValidSenderEntry } from '@/lib/detect/match';

const SECTIONS = ['Appearance', 'Inbox', 'Categories', 'General'] as const;
type Section = (typeof SECTIONS)[number];

const SWATCHES = ['#4f8cff', '#3fb68b', '#a879f0', '#f0954a', '#2fc1d3', '#e5677a', '#d8b43c', '#8b8d94'];
const PRESETS: Omit<Category, 'id' | 'senders'>[] = [
  { name: 'Clients', color: '#4f8cff' },
  MONEY, // default, offered again here if deleted
  { name: 'Personal', color: '#a879f0' },
  { name: 'Important', color: '#f0954a' },
  { name: 'Projects', color: '#2fc1d3' },
];

export function App() {
  const [s, setS] = useState<Settings | null>(null);
  const [section, setSection] = useState<Section>('Appearance');

  useEffect(() => {
    getSettings().then((v) => (setS(v), applyFlags(v)));
    return watchSettings((v) => (setS(v), applyFlags(v)));
  }, []);
  if (!s) return null;

  const set = (patch: Partial<Settings>) => {
    setS({ ...s, ...patch });
    saveSettings(patch);
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl gap-12 px-6 py-14 max-sm:flex-col max-sm:gap-6 max-sm:px-4 max-sm:py-8">
      <aside className="w-44 shrink-0">
        <div className="mb-8 flex items-center gap-2 px-2 text-[15px] font-semibold tracking-tight">
          <img src="/icon.svg" alt="" className="size-6" /> datmail
        </div>
        <nav className="flex flex-col gap-0.5 max-sm:flex-row max-sm:overflow-x-auto">
          {SECTIONS.map((x) => (
            <button
              key={x}
              onClick={() => setSection(x)}
              className={`rounded-md px-2 py-1.5 text-left transition-colors ${section === x ? 'bg-selected text-fg' : 'text-muted hover:bg-hover hover:text-fg'}`}
            >
              {x}
            </button>
          ))}
        </nav>
      </aside>

      <main className="min-w-0 flex-1">
        <h1 className="mb-6 text-xl font-semibold tracking-tight">{section}</h1>
        {section === 'Appearance' && (
          <Group>
            <Row label="Theme" hint="System follows your OS. For best results keep Gmail's own theme on Default.">
              <Segmented value={s.theme} options={['light', 'dark', 'system']} onChange={(theme) => set({ theme })} />
            </Row>
            <Row label="Darken email content" hint="In dark mode, emails designed for white backgrounds are shown dark. Images keep their colors.">
              <Toggle on={s.darkBodies} onChange={(darkBodies) => set({ darkBodies })} />
            </Row>
            <Row label="Hide side panel" hint="Removes Calendar, Keep, Tasks and Contacts on the right.">
              <Toggle on={s.hideSidePanel} onChange={(hideSidePanel) => set({ hideSidePanel })} />
            </Row>
            <Row label="Hide checkboxes" hint="Select rows with the x key; checkboxes reappear on selected rows.">
              <Toggle on={s.hideCheckbox} onChange={(hideCheckbox) => set({ hideCheckbox })} />
            </Row>
            <Row label="Move star to the right" hint="Shows next to delete on hover. Starred emails keep their star before the date.">
              <Toggle on={s.hideStar} onChange={(hideStar) => set({ hideStar })} />
            </Row>
            <Row label="Hide Archive and Snooze buttons" hint="Keyboard shortcuts (e, b) still work.">
              <Toggle on={s.hideArchiveSnooze} onChange={(hideArchiveSnooze) => set({ hideArchiveSnooze })} />
            </Row>
          </Group>
        )}

        {section === 'Inbox' && (
          <>
            <Group title="Verification codes">
              <Row label="Detect codes" hint="Shows recent one-time codes above the inbox, one click to copy.">
                <Toggle on={s.codes} onChange={(codes) => set({ codes })} />
              </Row>
              <Row label="Keep codes for">
                <select
                  value={s.codeExpiryHours}
                  onChange={(e) => set({ codeExpiryHours: Number(e.target.value) })}
                  className="rounded-md border border-line-strong bg-raised px-2 py-1 text-fg"
                >
                  {[1, 6, 12, 24, 48].map((h) => <option key={h} value={h}>{h} hours</option>)}
                </select>
              </Row>
            </Group>
            <Group title="Filtering">
              <Row label="Filter the inbox" hint="Hidden from the inbox view only, listed under Filtered. Nothing is deleted or moved.">
                <Toggle on={s.spam} onChange={(spam) => set({ spam })} />
              </Row>
              <Row label="Strictness" hint="Strict hides all automated mail (notifications, newsletters, social). Light only hides loud marketing. People, invoices, payments, security alerts, codes and your categories are never hidden.">
                <Segmented value={s.filtering} options={['light', 'balanced', 'strict']} onChange={(filtering) => set({ filtering })} />
              </Row>
              <ListRow label="Never filter" hint="Addresses or @domain, one per line." value={s.allowlist} onChange={(allowlist) => set({ allowlist })} />
              <ListRow label="Always filter" value={s.blocklist} onChange={(blocklist) => set({ blocklist })} />
            </Group>
          </>
        )}

        {section === 'Categories' && <Categories cats={s.categories} onChange={(categories) => set({ categories })} />}

        {section === 'General' && (
          <>
            <Group>
              <Row label="Privacy" hint="datmail reads only what Gmail already shows in your inbox list, processes it in this browser, and stores nothing but these settings. No network requests, no analytics." />
              <Row label="Permissions" hint="storage: keeps these settings. mail.google.com: lets datmail restyle Gmail. Nothing else." />
            </Group>
            <Group>
              <Row label="Reset all settings" hint="Restores defaults and removes your categories and lists.">
                <button
                  onClick={() => confirm('Reset all datmail settings?') && (resetSettings(), setS(DEFAULTS))}
                  className="rounded-md border border-line-strong px-3 py-1 text-[13px] text-fg hover:bg-hover"
                >
                  Reset
                </button>
              </Row>
            </Group>
          </>
        )}
      </main>
    </div>
  );
}

function Group({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="mb-8">
      {title && <h2 className="mb-2 px-1 text-xs font-medium uppercase tracking-wider text-faint">{title}</h2>}
      <div className="divide-y divide-line rounded-lg border border-line bg-surface">{children}</div>
    </section>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6 px-4 py-3.5 max-sm:flex-col max-sm:items-start max-sm:gap-3">
      <div className="min-w-0">
        <div className="text-fg">{label}</div>
        {hint && <div className="mt-0.5 text-[13px] text-muted">{hint}</div>}
      </div>
      {children && <div className="shrink-0">{children}</div>}
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`relative h-5 w-9 rounded-full border transition-colors ${on ? 'border-muted' : 'border-line-strong'}`}
    >
      <span className={`absolute top-1/2 size-3.5 -translate-y-1/2 rounded-full transition-[left,background-color] ${on ? 'left-[18px] bg-fg' : 'left-[2px] bg-faint'}`} />
    </button>
  );
}

function Segmented<T extends string>({ value, options, onChange }: { value: T; options: T[]; onChange: (v: T) => void }) {
  return (
    <div className="flex rounded-md border border-line bg-bg p-0.5" role="radiogroup">
      {options.map((o) => (
        <button
          key={o}
          role="radio"
          aria-checked={o === value}
          onClick={() => onChange(o)}
          className={`rounded px-3 py-1 text-[13px] capitalize transition-colors ${o === value ? 'bg-raised text-fg shadow-sm' : 'text-muted hover:text-fg'}`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

/** One sender per line. Saves valid lines on blur; invalid lines are kept in the box and flagged. */
function SenderList({ value, onChange, keywords }: { value: string[]; onChange: (v: string[]) => void; keywords?: boolean }) {
  const [text, setText] = useState(value.join('\n'));
  useEffect(() => setText(value.join('\n')), [value.join('\n')]);
  const valid = keywords ? () => true : isValidSenderEntry;
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const bad = lines.filter((l) => !valid(l));
  return (
    <div className="w-full">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => onChange([...new Set(lines.filter(valid).map((l) => l.toLowerCase()))])}
        rows={Math.min(8, Math.max(3, lines.length + 1))}
        placeholder={keywords ? 'invoice\nszámla' : 'anna@client.com\n@client.com'}
        spellCheck={false}
        className="w-full resize-y rounded-md border border-line-strong bg-bg px-3 py-2 font-mono text-[13px] text-fg placeholder:text-faint focus:border-accent focus:outline-none"
      />
      {bad.length > 0 && <div className="mt-1 text-[12px] text-[#e5677a]">Not an address or @domain: {bad.join(', ')}</div>}
    </div>
  );
}

function ListRow({ label, hint, value, onChange }: { label: string; hint?: string; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="px-4 py-3.5">
      <div className="text-fg">{label}</div>
      {hint && <div className="mb-2 mt-0.5 text-[13px] text-muted">{hint}</div>}
      <div className={hint ? '' : 'mt-2'}>
        <SenderList value={value} onChange={onChange} />
      </div>
    </div>
  );
}

function Categories({ cats, onChange }: { cats: Category[]; onChange: (c: Category[]) => void }) {
  const [editing, setEditing] = useState<string | null>(null);
  const update = (id: string, patch: Partial<Category>) => onChange(cats.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const add = (p: Omit<Category, 'id' | 'senders'>) => {
    const c = { ...p, id: crypto.randomUUID(), senders: [] };
    onChange([...cats, c]);
    setEditing(c.id);
  };
  const unused = PRESETS.filter((p) => !cats.some((c) => c.name.toLowerCase() === p.name.toLowerCase()));

  return (
    <>
      <p className="mb-6 text-muted">Emails from these senders, or mentioning these keywords, get a subtle color accent, and a chip above the inbox that lists all of them.</p>
      {cats.length === 0 && <div className="mb-6 rounded-lg border border-dashed border-line-strong px-4 py-8 text-center text-muted">No categories yet. Start from a preset below.</div>}
      {cats.length > 0 && (
        <div className="mb-6 divide-y divide-line rounded-lg border border-line bg-surface">
          {cats.map((c) => (
            <div key={c.id}>
              <button onClick={() => setEditing(editing === c.id ? null : c.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-hover">
                <span className="size-2.5 rounded-full" style={{ background: c.color }} />
                {c.icon && <span>{c.icon}</span>}
                <span className="flex-1 text-fg">{c.name || 'Untitled'}</span>
                <span className="text-[13px] text-faint">{c.senders.length} sender{c.senders.length === 1 ? '' : 's'}
                  {c.keywords?.length ? ` · ${c.keywords.length} keyword${c.keywords.length === 1 ? '' : 's'}` : ''}</span>
              </button>
              {editing === c.id && (
                <div className="space-y-4 border-t border-line bg-bg/40 px-4 py-4">
                  <div className="flex gap-3 max-sm:flex-col">
                    <input
                      value={c.icon ?? ''}
                      onChange={(e) => update(c.id, { icon: [...e.target.value].slice(-2).join('') || undefined })}
                      placeholder="☺"
                      aria-label="Icon (emoji)"
                      className="w-12 rounded-md border border-line-strong bg-bg px-2 py-1.5 text-center"
                    />
                    <input
                      value={c.name}
                      onChange={(e) => update(c.id, { name: e.target.value })}
                      aria-label="Name"
                      className="flex-1 rounded-md border border-line-strong bg-bg px-3 py-1.5 text-fg focus:border-accent focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Color">
                    {SWATCHES.map((col) => (
                      <button
                        key={col}
                        role="radio"
                        aria-checked={c.color === col}
                        aria-label={col}
                        onClick={() => update(c.id, { color: col })}
                        className={`size-6 rounded-full transition-transform hover:scale-110 ${c.color === col ? 'ring-2 ring-fg ring-offset-2 ring-offset-bg' : ''}`}
                        style={{ background: col }}
                      />
                    ))}
                    <input type="color" value={c.color} onChange={(e) => update(c.id, { color: e.target.value })} aria-label="Custom color" className="size-6 cursor-pointer rounded-full bg-transparent" />
                  </div>
                  <div>
                    <div className="mb-1.5 text-[13px] text-muted">Senders, one per line (address or @domain)</div>
                    <SenderList value={c.senders} onChange={(senders) => update(c.id, { senders })} />
                  </div>
                  <div>
                    <div className="mb-1.5 text-[13px] text-muted">Keywords in the subject or preview, one per line</div>
                    <SenderList keywords value={c.keywords ?? []} onChange={(keywords) => update(c.id, { keywords })} />
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={() => confirm(`Delete "${c.name}"?`) && onChange(cats.filter((x) => x.id !== c.id))}
                      className="rounded-md px-3 py-1 text-[13px] text-[#e5677a] hover:bg-hover"
                    >
                      Delete category
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {unused.map((p) => (
          <button key={p.name} onClick={() => add(p)} className="flex items-center gap-2 rounded-md border border-line px-3 py-1.5 text-[13px] text-muted hover:bg-hover hover:text-fg">
            <span className="size-2 rounded-full" style={{ background: p.color }} /> {p.name}
          </button>
        ))}
        <button onClick={() => add({ name: 'New category', color: SWATCHES[0]! })} className="rounded-md border border-line px-3 py-1.5 text-[13px] text-fg hover:bg-hover">
          + New category
        </button>
      </div>
    </>
  );
}

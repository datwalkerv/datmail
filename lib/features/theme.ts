import type { Settings } from '../settings';

const root = document.documentElement;
const media = matchMedia('(prefers-color-scheme: dark)');
let current: Settings | null = null;

function setFlag(name: string, on: boolean) {
  on ? root.setAttribute(name, '') : root.removeAttribute(name);
}

export function applyFlags(s: Settings) {
  current = s;
  const theme = s.theme === 'system' ? (media.matches ? 'dark' : 'light') : s.theme;
  root.dataset.dmTheme = theme;
  setFlag('data-dm-hide-checkbox', s.hideCheckbox);
  setFlag('data-dm-hide-star', s.hideStar);
  setFlag('data-dm-hide-actions', s.hideArchiveSnooze);
  setFlag('data-dm-dark-bodies', s.darkBodies);
  setFlag('data-dm-hide-side-panel', s.hideSidePanel);
  // Page-origin cache so the next load paints the right theme before storage answers.
  try {
    localStorage.setItem('datmail-theme', theme);
  } catch {}
}

export function applyCachedTheme() {
  try {
    const t = localStorage.getItem('datmail-theme');
    if (t) root.dataset.dmTheme = t;
  } catch {}
}

media.addEventListener('change', () => current && applyFlags(current));

import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  // Dev loop: load .output/chrome-mv3-dev unpacked in your own Chrome; `npm run dev` hot-reloads it.
  webExt: { disabled: true },
  vite: () => ({ plugins: [tailwindcss()] }),
  manifest: {
    name: 'datmail',
    description: 'A calmer, faster, beautiful Gmail. Everything runs locally.',
    // storage: settings + categories. Gmail access comes from the content script match only.
    permissions: ['storage'],
  },
});

import { defineConfig } from 'vitest/config';
import { WxtVitest } from 'wxt/testing/vitest-plugin';

// WxtVitest provides a fake `browser`, so modules that touch wxt storage can be imported in tests.
export default defineConfig({ plugins: [WxtVitest()], test: { include: ['tests/**/*.test.ts'] } });

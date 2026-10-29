import { defineConfig } from '@playwright/test';

// Optional: point Playwright at a preinstalled Chromium (e.g. sandboxed CI images)
// without changing the default `playwright install` flow for everyone else.
const chromiumExecutable = process.env.PW_CHROMIUM_EXECUTABLE;
// Ports are overridable so a shared machine with other servers on 4173 does not
// silently test the wrong app (`reuseExistingServer` would attach to it).
const devPort = Number(process.env.KD_E2E_PORT ?? 4173);
const pwaPort = Number(process.env.KD_PWA_PORT ?? 4273);
// The production build is served under the GitHub Pages project path.
export const PWA_BASE_PATH = '/kingdom-duel/';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  outputDir: '.playwright-artifacts',
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://127.0.0.1:${devPort}`,
    colorScheme: 'light',
    locale: 'en-US',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    ...(chromiumExecutable ? { launchOptions: { executablePath: chromiumExecutable } } : {}),
  },
  webServer: [
    {
      command: `npm run dev -- --host 127.0.0.1 --port ${devPort} --strictPort`,
      url: `http://127.0.0.1:${devPort}`,
      reuseExistingServer: true,
    },
    {
      // A fresh production build, so the service worker and precache list are real.
      command: `npx vite build --outDir tmp/e2e-pwa-dist --emptyOutDir && npx vite preview --outDir tmp/e2e-pwa-dist --base ${PWA_BASE_PATH} --host 127.0.0.1 --port ${pwaPort} --strictPort`,
      url: `http://127.0.0.1:${pwaPort}${PWA_BASE_PATH}`,
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
  projects: [
    {
      name: 'mobile-390x700',
      testIgnore: /pwa\.spec\.ts/,
      use: { viewport: { width: 390, height: 700 }, hasTouch: true, isMobile: true },
    },
    {
      name: 'mobile-390x844',
      testIgnore: /pwa\.spec\.ts/,
      use: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true },
    },
    {
      name: 'pwa-offline',
      testMatch: /pwa\.spec\.ts/,
      use: {
        baseURL: `http://127.0.0.1:${pwaPort}${PWA_BASE_PATH}`,
        viewport: { width: 390, height: 844 },
        hasTouch: true,
        isMobile: true,
        serviceWorkers: 'allow',
      },
    },
  ],
});

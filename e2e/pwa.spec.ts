import { expect, test, type Page } from '@playwright/test';

/**
 * Runs against a production build served under the GitHub Pages project path
 * (see the `pwa-offline` project in playwright.config.ts).
 */

async function waitForControllingWorker(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  // clients.claim() hands the open page to the worker; a reload guarantees it.
  if (!(await page.evaluate(() => !!navigator.serviceWorker.controller))) await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
}

test('manifest and icons are served relative to the Pages base path', async ({ page, request, baseURL }) => {
  await page.goto('./');
  const manifestHref = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(manifestHref).toBe('./manifest.webmanifest');
  const manifestUrl = new URL(manifestHref!, page.url()).href;
  expect(manifestUrl).toBe(`${baseURL}manifest.webmanifest`);

  const manifest = await (await request.get(manifestUrl)).json();
  expect(manifest.name).toBe('Kingdom Duel');
  expect(manifest.display).toBe('standalone');
  expect(manifest.start_url).toBe('./');
  expect(manifest.icons.map((icon: { purpose: string }) => icon.purpose)).toEqual(['any', 'any', 'maskable']);
  for (const icon of manifest.icons as Array<{ src: string; sizes: string }>) {
    const response = await request.get(new URL(icon.src, manifestUrl).href);
    expect(response.status(), icon.src).toBe(200);
    expect(response.headers()['content-type']).toContain('image/png');
    const bytes = await response.body();
    const [width, height] = icon.sizes.split('x').map(Number);
    expect(bytes.readUInt32BE(16), `${icon.src} width`).toBe(width);
    expect(bytes.readUInt32BE(20), `${icon.src} height`).toBe(height);
  }
});

test('service worker precaches the build and the game reloads offline', async ({ page, context, baseURL }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('./');
  await expect(page.locator('.title-stage')).toBeVisible();
  await waitForControllingWorker(page);

  const registration = await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    return { scope: reg?.scope, script: reg?.active?.scriptURL };
  });
  expect(registration.scope).toBe(baseURL);
  expect(registration.script).toBe(`${baseURL}sw.js`);

  const cached = await page.evaluate(async () => {
    const keys = await caches.keys();
    const cache = await caches.open(keys.find((key) => key.startsWith('kingdom-duel-'))!);
    return (await cache.keys()).map((request) => new URL(request.url).pathname);
  });
  expect(cached).toContain('/kingdom-duel/index.html');
  expect(cached.some((path) => /\/kingdom-duel\/assets\/index-.*\.js$/.test(path))).toBe(true);
  expect(cached).toContain('/kingdom-duel/assets/gems/sun.webp');

  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('.title-stage')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Kingdom Duel' })).toBeVisible();

  // Gem art comes from the cache, not the network.
  const spriteOk = await page.evaluate(async () => (await fetch('assets/gems/sun.webp')).ok);
  expect(spriteOk).toBe(true);

  // A full duel starts and is playable offline.
  await page.locator('[data-action="new-standard-run"]').click();
  await expect(page.getByLabel('Playable match-3 board')).toBeVisible();
  await expect(page.locator('[data-cell]')).toHaveCount(64);
  if (process.env.KD_SHOTS) await page.screenshot({ path: `${process.env.KD_SHOTS}/pwa-offline-battle-390x844.png` });
  const loaded = await page.evaluate(() =>
    new Promise<boolean>((resolve) => {
      const image = new Image();
      image.onload = () => resolve(image.naturalWidth > 0);
      image.onerror = () => resolve(false);
      image.src = new URL('assets/gems/moon.webp', window.location.href).href;
    }),
  );
  expect(loaded).toBe(true);

  // Deep links with a query string fall back to the cached shell too.
  await page.goto('./?view=moodboard');
  await expect(page.locator('main')).toBeVisible();

  await context.setOffline(false);
  expect(errors).toEqual([]);
});

test('sound preferences persist across reloads and audio unlocks on the first gesture', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('html')).toHaveAttribute('data-audio', 'locked');

  await page.locator('[data-action="toggle-music"]').click();
  await expect(page.locator('[data-action="toggle-music"]')).toHaveText('Music: on');
  await expect(page.locator('html')).toHaveAttribute('data-audio', 'running');
  await expect(page.locator('html')).toHaveAttribute('data-music', 'on');

  await page.locator('[data-action="toggle-sound"]').click();
  await expect(page.locator('[data-action="toggle-sound"]')).toHaveText('Sound: off');
  await expect(page.locator('html')).toHaveAttribute('data-audio', 'muted');

  await page.reload();
  await expect(page.locator('[data-action="toggle-sound"]')).toHaveText('Sound: off');
  await expect(page.locator('[data-action="toggle-music"]')).toHaveText('Music: off');
  await expect(page.locator('html')).toHaveAttribute('data-audio', 'muted');
  const stored = await page.evaluate(() => JSON.parse(window.localStorage.getItem('kingdom-duel.audio.v1') ?? 'null'));
  expect(stored).toEqual({ muted: true, music: true });

  // The cockpit toggle mirrors the same preference.
  await page.locator('[data-action="new-standard-run"]').click();
  const cockpit = page.locator('.sound-toggle');
  await expect(cockpit).toHaveAttribute('aria-label', 'Sound off');
  await cockpit.click();
  await expect(cockpit).toHaveAttribute('aria-label', 'Sound on');
  await expect(page.locator('html')).toHaveAttribute('data-audio', 'running');
});

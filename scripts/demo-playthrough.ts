/**
 * Automated demo playthrough: drives the real UI in Chromium, choosing each
 * player action with the spell-aware simulator policy, and captures screenshots.
 *
 *   npm run dev -- --host 127.0.0.1 --port 4173   # in another terminal
 *   DEMO_URL=http://127.0.0.1:4173/ DEMO_SHOTS=/tmp/kingdom-shots \
 *     PW_CHROMIUM_EXECUTABLE=/path/to/chromium npm run demo:play
 *
 * Optional env: DEMO_VIEWPORT=390x844 (default) or 1280x800, DEMO_SEED=<number>,
 * DEMO_MODE=standard|daily, DEMO_MOTION=1 (keep animations), DEMO_MAX_ACTIONS.
 */
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium, type Page } from '@playwright/test';
import { buildRunDuelRules } from '../src/run/rules';
import { createRun, createRunDuel, dailyRunKey, dailyRunSeed } from '../src/run/run';
import { RUN_SAVE_KEY } from '../src/run/storage';
import type { RunSave } from '../src/run/types';
import { RUN_SCHEMA_VERSION } from '../src/run/version';
import { choosePlayerAction } from './sim-player';

const url = process.env.DEMO_URL ?? 'http://127.0.0.1:4173/';
const shots = process.env.DEMO_SHOTS ?? 'tmp/demo-shots';
const [width, height] = (process.env.DEMO_VIEWPORT ?? '390x844').split('x').map(Number);
const mobile = width < 600;
const mode = process.env.DEMO_MODE === 'daily' ? 'daily' : 'standard';
const maxActions = Number(process.env.DEMO_MAX_ACTIONS ?? 400);
const prefix = `${process.env.DEMO_PREFIX ?? `${mode}-${width}x${height}`}`;
let shotIndex = 0;

async function shot(page: Page, name: string): Promise<void> {
  shotIndex += 1;
  const file = join(shots, `${prefix}-${String(shotIndex).padStart(2, '0')}-${name}.png`);
  await page.screenshot({ path: file });
  console.log(`  shot ${file}`);
}

async function readSave(page: Page): Promise<RunSave | null> {
  return page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) ?? 'null'), RUN_SAVE_KEY);
}

async function waitForSettled(page: Page): Promise<'player' | 'terminal' | 'reward' | 'result' | 'title'> {
  for (let attempt = 0; attempt < 400; attempt++) {
    if (await page.locator('[aria-label="Run result"]').count()) return 'result';
    if (await page.locator('[data-action^="choose-upgrade:"]').count()) return 'reward';
    if (await page.locator('[data-action="continue-run"]').count()) return 'terminal';
    if (await page.locator('.board-frame.is-ready').count()) return 'player';
    if (await page.locator('.title-stage').count()) return 'title';
    await page.waitForTimeout(100);
  }
  throw new Error('UI never settled');
}

async function main(): Promise<void> {
  mkdirSync(shots, { recursive: true });
  const executablePath = process.env.PW_CHROMIUM_EXECUTABLE;
  const browser = await chromium.launch(executablePath ? { executablePath } : {});
  const context = await browser.newContext({
    viewport: { width, height },
    hasTouch: mobile,
    isMobile: mobile,
    reducedMotion: process.env.DEMO_MOTION ? 'no-preference' : 'reduce',
  });
  const page = await context.newPage();
  page.on('pageerror', (error) => console.error('PAGE ERROR', error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') console.error('CONSOLE', message.text());
  });

  if (process.env.DEMO_SEED) {
    const seed = Number(process.env.DEMO_SEED);
    const key = mode === 'daily' ? dailyRunKey() : null;
    const run = createRun(key ? dailyRunSeed(key) : seed, mode, key);
    const save: RunSave = { version: RUN_SCHEMA_VERSION, run, duel: createRunDuel(run) };
    await page.addInitScript(({ key: storageKey, value }) => {
      if (!window.sessionStorage.getItem('demo-seeded')) {
        window.localStorage.setItem(storageKey, value);
        window.sessionStorage.setItem('demo-seeded', '1');
      }
    }, { key: RUN_SAVE_KEY, value: JSON.stringify(save) });
  }

  await page.goto(url);
  await page.waitForTimeout(300);
  await shot(page, 'boot');

  let actions = 0;
  let lastEncounter = -1;
  while (actions < maxActions) {
    const state = await waitForSettled(page);
    if (state === 'title') {
      const button = page.locator(mode === 'daily' ? '[data-action="new-daily-run"]' : '[data-action="continue-run-save"], [data-action="new-standard-run"]').first();
      await button.click();
      continue;
    }
    if (state === 'result') {
      await page.waitForTimeout(400);
      await shot(page, 'run-result');
      break;
    }
    if (state === 'reward') {
      await shot(page, 'reward');
      await page.locator('[data-action^="choose-upgrade:"]').first().click();
      continue;
    }
    if (state === 'terminal') {
      await page.waitForTimeout(400);
      await shot(page, 'battle-end');
      await page.locator('[data-action="continue-run"]').first().click();
      continue;
    }

    const save = await readSave(page);
    if (!save) throw new Error('No save found while it is the player turn');
    if (save.run.encounterIndex !== lastEncounter) {
      lastEncounter = save.run.encounterIndex;
      await shot(page, `encounter-${lastEncounter + 1}-start`);
    }
    const rules = buildRunDuelRules(save.run);
    const result = choosePlayerAction(save.duel, 'spell-aware', rules);
    const entry = result.state.actionLog[result.state.actionLog.length - 1];
    if (!entry || entry.action.type === 'enemy_turn') throw new Error('Policy produced no player action');
    const action = entry.action;
    if (action.type === 'swap') {
      await page.locator(`[data-cell="${action.from.y * 8 + action.from.x}"]`).click();
      await page.locator(`[data-cell="${action.to.y * 8 + action.to.x}"]`).click();
    } else if (action.type === 'cast') {
      await page.locator(`[data-spell="${action.abilityId}"]`).click();
      const target = page.locator(`[data-cell="${action.target.y * 8 + action.target.x}"]`);
      await target.click();
      if (actions < 40) await shot(page, `spell-armed-${action.abilityId}`);
      await target.click();
    }
    actions += 1;
    if (actions === 1) await shot(page, 'first-move');
  }

  console.log(`Demo playthrough finished after ${actions} player actions.`);
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

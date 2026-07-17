import { expect, test, type Page } from '@playwright/test';
import { findLegalMoves } from '../src/engine/board';
import { applySwap } from '../src/engine/duel';
import type { DuelState } from '../src/engine/types';
import { RUN_ENCOUNTERS } from '../src/run/content';
import {
  chooseRunUpgrade,
  createRun,
  createRunDuel,
  dailyRunSeed,
  resolveRunBattle,
} from '../src/run/run';
import { buildRunDuelRules } from '../src/run/rules';
import { RUN_SAVE_KEY } from '../src/run/storage';
import type { RunSave, RunState } from '../src/run/types';
import { DAILY_CHALLENGE_VERSION, RUN_SCHEMA_VERSION } from '../src/run/version';

const FIXED_SEED = 2007;

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

test('mobile battle performs a legal tap move and persists it', async ({ page }) => {
  const run = createRun(FIXED_SEED);
  const duel = createRunDuel(run);
  const move = findLegalMoves(duel.board)[0];
  expect(move, 'fixed seed must expose a legal opening move').toBeTruthy();
  await injectSave(page, { version: RUN_SCHEMA_VERSION, run, duel });

  await page.goto('/');

  await expect(page.getByText('Kingdom Duel', { exact: true })).toBeVisible();
  await expect(page.locator('.game-brand span')).toHaveText('Run 1/4 · Glass Edge');
  await expect(page.getByLabel('Playable match-3 board')).toBeVisible();
  await expect(page.locator('[data-cell]')).toHaveCount(64);
  await expect(page.locator('[data-spell]')).toHaveCount(3);
  await expectNoHorizontalOverflow(page);

  await page.locator(`[data-cell="${boardIndex(move.from)}"]`).click();
  await page.locator(`[data-cell="${boardIndex(move.to)}"]`).click();

  await expect.poll(() => savedActionCount(page)).toBeGreaterThan(0);
  const saved = await readSave(page);
  expect(saved.run.encounterIndex).toBe(0);
  expect(saved.duel.actionLog[0]?.accepted).toBe(true);
});

test('pending enemy turn resumes from the saved state', async ({ page }) => {
  const run = createRun(FIXED_SEED + 1);
  const duel = pendingEnemyDuel(run);
  const initialActionCount = duel.actionLog.length;
  await injectSave(page, { version: RUN_SCHEMA_VERSION, run, duel });

  await page.goto('/');

  await expect.poll(() => savedActionCount(page)).toBeGreaterThan(initialActionCount);
  const resumed = await readSave(page);
  expect(resumed.duel.actionLog.some((entry) => entry.action.actor === 'enemy' && entry.accepted)).toBe(true);
  await expectNoHorizontalOverflow(page);
});

test('reward choice advances the route and persists the prism', async ({ page }) => {
  const opening = createRun(FIXED_SEED + 2);
  const terminalDuel = winningDuel(opening);
  const reward = resolveRunBattle(opening, terminalDuel);
  await injectSave(page, { version: RUN_SCHEMA_VERSION, run: reward, duel: terminalDuel });

  await page.goto('/');

  await expect(page.getByRole('main').getByText('Prism choice', { exact: true })).toBeVisible();
  const choices = page.locator('[data-action^="choose-upgrade:"]');
  await expect(choices).toHaveCount(3);
  await choices.first().click();

  await expect(page.locator('.game-brand span')).toContainText('Run 2/4 · Moon Lock');
  const saved = await readSave(page);
  expect(saved.run.phase).toBe('battle');
  expect(saved.run.encounterIndex).toBe(1);
  expect(saved.run.selectedUpgradeIds).toHaveLength(1);
  await expectNoHorizontalOverflow(page);
});

test('completed run renders its result and starts a fresh run', async ({ page }) => {
  const completed = completedRunSave(FIXED_SEED + 3);
  await injectSave(page, completed);

  await page.goto('/');

  await expect(page.getByLabel('Run result')).toBeVisible();
  await expect(page.getByText('Run complete', { exact: true })).toBeVisible();
  await expect(page.getByText(`4/${RUN_ENCOUNTERS.length} victories`, { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'New standard run' }).click();

  await expect(page.locator('.game-brand span')).toHaveText('Run 1/4 · Glass Edge');
  const saved = await readSave(page);
  expect(saved.run.phase).toBe('battle');
  expect(saved.run.battles).toHaveLength(0);
  await expectNoHorizontalOverflow(page);
});

test('daily save exposes the pinned daily contract', async ({ page }) => {
  const dailyKey = '2026-07-14';
  const run = createRun(dailyRunSeed(dailyKey), 'daily', dailyKey);
  const terminalDuel = winningDuel(run);
  const reward = resolveRunBattle(run, terminalDuel);
  await injectSave(page, { version: RUN_SCHEMA_VERSION, run: reward, duel: terminalDuel });

  await page.goto('/');

  await expect(page.getByText(`Daily ${dailyKey} · ${DAILY_CHALLENGE_VERSION}`, { exact: true })).toBeVisible();
  await expect(page.locator('[data-action^="choose-upgrade:"]')).toHaveCount(3);
  await expectNoHorizontalOverflow(page);
});

async function injectSave(page: Page, save: RunSave): Promise<void> {
  await page.addInitScript(({ key, value }) => {
    window.localStorage.setItem(key, value);
  }, { key: RUN_SAVE_KEY, value: JSON.stringify(save) });
}

async function readSave(page: Page): Promise<RunSave> {
  return page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) ?? 'null') as RunSave, RUN_SAVE_KEY);
}

async function savedActionCount(page: Page): Promise<number> {
  return page.evaluate((key) => {
    const raw = window.localStorage.getItem(key);
    if (!raw) return 0;
    return (JSON.parse(raw) as RunSave).duel.actionLog.length;
  }, RUN_SAVE_KEY);
}

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

function boardIndex(cell: { x: number; y: number }): number {
  return cell.y * 8 + cell.x;
}

function winningDuel(run: RunState): DuelState {
  const duel = createRunDuel(run);
  return { ...duel, winner: 'player', enemy: { ...duel.enemy, hp: 0 } };
}

function pendingEnemyDuel(run: RunState): DuelState {
  const duel = createRunDuel(run);
  const rules = buildRunDuelRules(run);
  for (const move of findLegalMoves(duel.board)) {
    const result = applySwap(duel, move.from, move.to, rules);
    if (!result.state.winner && result.state.current === 'enemy') return result.state;
  }
  throw new Error('fixed seed must expose a legal move that transfers the turn');
}

function completedRunSave(seed: number): RunSave {
  let run = createRun(seed);
  let terminalDuel = winningDuel(run);

  for (let index = 0; index < RUN_ENCOUNTERS.length; index++) {
    terminalDuel = winningDuel(run);
    run = resolveRunBattle(run, terminalDuel);
    if (run.phase === 'reward') run = chooseRunUpgrade(run, run.rewardOptions[0]);
  }

  return { version: RUN_SCHEMA_VERSION, run, duel: terminalDuel };
}

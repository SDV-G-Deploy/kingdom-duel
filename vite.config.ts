import { execSync } from 'node:child_process';
import { defineConfig } from 'vite';

function gitCommit(): string {
  try {
    return execSync('git rev-parse --short=12 HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

function gitDirty(): boolean {
  try {
    return execSync('git status --porcelain', { encoding: 'utf8' }).trim().length > 0;
  } catch {
    return true;
  }
}

export default defineConfig({
  base: './',
  define: {
    __KINGDOM_DUEL_BUILD_COMMIT__: JSON.stringify(process.env.KINGDOM_DUEL_BUILD_COMMIT ?? gitCommit()),
    __KINGDOM_DUEL_BUILD_TIME__: JSON.stringify(process.env.KINGDOM_DUEL_BUILD_TIME ?? 'unknown'),
    __KINGDOM_DUEL_BUILD_DIRTY__: JSON.stringify(process.env.KINGDOM_DUEL_BUILD_DIRTY ? process.env.KINGDOM_DUEL_BUILD_DIRTY === 'true' : gitDirty()),
  },
});

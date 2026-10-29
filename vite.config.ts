import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { defineConfig, type Plugin } from 'vite';

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

function listFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? listFiles(path) : [path];
  });
}

/**
 * Emits sw.js with a precache list of every built and public file plus a
 * content hash, so each deploy gets a fresh cache and offline reload works
 * on the first revisit.
 */
function serviceWorkerPlugin(): Plugin {
  let publicDir = '';
  return {
    name: 'kingdom-duel-service-worker',
    apply: 'build',
    enforce: 'post',
    configResolved(config) {
      publicDir = config.publicDir;
    },
    generateBundle(_options, bundle) {
      const hash = createHash('sha256');
      const files = new Map<string, string | Uint8Array>();
      for (const output of Object.values(bundle)) {
        files.set(output.fileName, output.type === 'chunk' ? output.code : output.source);
      }
      for (const path of publicDir ? listFiles(publicDir) : []) {
        files.set(relative(publicDir, path).split('\\').join('/'), readFileSync(path));
      }
      files.delete('sw.js');
      const precache = [...files.keys()].filter((name) => !name.endsWith('.map')).sort();
      for (const name of precache) {
        hash.update(name);
        hash.update(files.get(name) ?? '');
      }
      const template = readFileSync(new URL('./src/pwa/sw-template.js', import.meta.url), 'utf8');
      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: template
          .replace('__KD_VERSION__', hash.digest('hex').slice(0, 12))
          .replace('__KD_PRECACHE__', JSON.stringify(precache, null, 2)),
      });
    },
  };
}

export default defineConfig(({ command }) => ({
  base: './',
  plugins: [serviceWorkerPlugin()],
  define: {
    __KINGDOM_DUEL_BUILD_COMMIT__: JSON.stringify(process.env.KINGDOM_DUEL_BUILD_COMMIT ?? gitCommit()),
    __KINGDOM_DUEL_BUILD_TIME__: JSON.stringify(process.env.KINGDOM_DUEL_BUILD_TIME ?? 'unknown'),
    __KINGDOM_DUEL_BUILD_DIRTY__: JSON.stringify(process.env.KINGDOM_DUEL_BUILD_DIRTY ? process.env.KINGDOM_DUEL_BUILD_DIRTY === 'true' : gitDirty()),
    __KINGDOM_DUEL_SW__: JSON.stringify(command === 'build'),
  },
}));

declare const __KINGDOM_DUEL_SW__: boolean | undefined;

/** Registers the offline service worker in production builds only (dev stays uncached). */
export function registerServiceWorker(): void {
  if (typeof __KINGDOM_DUEL_SW__ !== 'boolean' || !__KINGDOM_DUEL_SW__) return;
  if (!('serviceWorker' in navigator)) return;
  if (new URLSearchParams(window.location.search).has('no-sw')) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      // Offline support is progressive; the game works without it.
    });
  });
}

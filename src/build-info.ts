declare const __KINGDOM_DUEL_BUILD_COMMIT__: string | undefined;
declare const __KINGDOM_DUEL_BUILD_TIME__: string | undefined;
declare const __KINGDOM_DUEL_BUILD_DIRTY__: boolean | undefined;

export type BuildIdentity = {
  appVersion: string;
  buildCommit: string;
  buildTime: string;
  dirty: boolean;
};

export const BUILD_IDENTITY: BuildIdentity = {
  appVersion: '0.0.1',
  buildCommit: typeof __KINGDOM_DUEL_BUILD_COMMIT__ === 'string' ? __KINGDOM_DUEL_BUILD_COMMIT__ : 'dev',
  buildTime: typeof __KINGDOM_DUEL_BUILD_TIME__ === 'string' ? __KINGDOM_DUEL_BUILD_TIME__ : 'dev',
  dirty: typeof __KINGDOM_DUEL_BUILD_DIRTY__ === 'boolean' ? __KINGDOM_DUEL_BUILD_DIRTY__ : true,
};

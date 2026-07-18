import type { BuiltInAbilityId, Cell, TileKind } from '../engine/types';

export type GemKind = TileKind;
type CharacterSlot = 'hero' | 'enemy';
type AssetSlot = {
  path: string;
  src: string | null;
};

export const BOARD_PATTERN: GemKind[] = [
  'sun', 'shield', 'sword', 'moon', 'crown', 'sun', 'shade', 'shield',
  'sword', 'moon', 'sun', 'shield', 'sword', 'crown', 'moon', 'sun',
  'shield', 'sword', 'crown', 'shade', 'moon', 'sun', 'shield', 'crown',
  'moon', 'sun', 'shield', 'sword', 'crown', 'shade', 'sun', 'moon',
  'crown', 'shield', 'sun', 'moon', 'sword', 'shield', 'crown', 'shade',
  'sun', 'moon', 'shield', 'crown', 'sword', 'sun', 'moon', 'shield',
  'shade', 'crown', 'sun', 'sword', 'shield', 'moon', 'crown', 'sun',
  'shield', 'moon', 'sword', 'crown', 'sun', 'shade', 'shield', 'moon',
];

export const GEM_KINDS: GemKind[] = ['sword', 'shield', 'sun', 'moon', 'crown', 'shade', 'aether'];

const characterAssetSlots: Record<CharacterSlot, AssetSlot> = {
  hero: { path: 'assets/characters/aurora-knight.webp', src: 'assets/characters/aurora-knight.webp' },
  enemy: { path: 'assets/characters/shade-knight.webp', src: 'assets/characters/shade-knight.webp' },
};

const gemAssetSlots: Record<GemKind, AssetSlot> = {
  sword: { path: 'assets/gems/sword.webp', src: 'assets/gems/sword.webp' },
  shield: { path: 'assets/gems/shield.webp', src: 'assets/gems/shield.webp' },
  sun: { path: 'assets/gems/sun.webp', src: 'assets/gems/sun.webp' },
  moon: { path: 'assets/gems/moon.webp', src: 'assets/gems/moon.webp' },
  crown: { path: 'assets/gems/crown.webp', src: 'assets/gems/crown.webp' },
  shade: { path: 'assets/gems/shade.webp', src: 'assets/gems/shade.webp' },
  aether: { path: 'assets/gems/aether.webp', src: 'assets/gems/aether.webp' },
};

const spellAssetSlots: Record<BuiltInAbilityId, AssetSlot> = {
  sun_bloom: { path: 'assets/spells/sun-bloom.webp', src: 'assets/spells/sun-bloom.webp' },
  glass_ward: { path: 'assets/spells/glass-ward.webp', src: 'assets/spells/glass-ward.webp' },
  crown_strike: { path: 'assets/spells/crown-strike.webp', src: 'assets/spells/crown-strike.webp' },
  veil_rift: { path: 'assets/spells/veil-rift.webp', src: null },
  lunar_lock: { path: 'assets/spells/lunar-lock.webp', src: null },
  eclipse_surge: { path: 'assets/spells/eclipse-surge.webp', src: null },
};

export function gemLabel(kind: GemKind): string {
  if (kind === 'sword') return 'Sword';
  if (kind === 'shield') return 'Shield';
  if (kind === 'sun') return 'Sun';
  if (kind === 'moon') return 'Moon';
  if (kind === 'crown') return 'Crown';
  if (kind === 'shade') return 'Shade';
  return 'Aether';
}

export function renderPortraitSlot(slot: CharacterSlot, characterId?: string): string {
  const asset = characterAssetSlots[slot];
  const variant = characterId ? ` portrait-variant-${characterId.replace(/[^a-z0-9-]/gi, '-').toLowerCase()}` : '';
  return `
    <span class="portrait-slot portrait-${slot}${variant} ${asset.src ? 'has-asset' : ''}" aria-hidden="true" data-asset-path="${asset.path}"${assetStyle(asset.src)}>
      <span class="portrait-fallback"></span>
    </span>
  `;
}

export function renderSpellIcon(abilityId: string, shortLabel: string, gem: string): string {
  const asset = spellAssetSlots[abilityId as BuiltInAbilityId];
  const assetPath = asset?.path ?? `assets/spells/${abilityId.replace(/_/g, '-')}.webp`;
  const assetSrc = asset?.src ?? null;
  return `
    <i class="spell-gem spell-gem-${gem} ${assetSrc ? 'has-asset' : ''}" aria-hidden="true" data-asset-path="${assetPath}"${assetStyle(assetSrc)}>
      <span class="spell-gem-fallback">${shortLabel}</span>
    </i>
  `;
}

export function renderGem(kind: GemKind, index?: number, classes: string[] = []): string {
  const asset = gemAssetSlots[kind];
  return `
    <button class="gem gem-${kind} ${asset.src ? 'has-sprite' : ''} ${classes.join(' ')}" type="button" aria-label="${gemLabel(kind)} tile"${index === undefined ? '' : ` data-cell="${index}"`}>
      <span class="gem-sprite-slot" aria-hidden="true" data-asset-path="${asset.path}"${assetStyle(asset.src)}></span>
      <span class="gem-fallback" aria-hidden="true">
        <span class="gem-shine"></span>
        <span class="gem-symbol gem-symbol-${kind}"></span>
      </span>
    </button>
  `;
}

export function cellKey(cell: Cell): string {
  return `${cell.x},${cell.y}`;
}

export function cellFromBoardIndex(index: number, width: number): Cell {
  return { x: index % width, y: Math.floor(index / width) };
}

export function sameCell(a: Cell | null, b: Cell): boolean {
  return !!a && a.x === b.x && a.y === b.y;
}

function assetStyle(src: string | null): string {
  if (!src) return '';
  const assetUrl = new URL(src, window.location.href).toString();
  return ` style="--asset-url: url('${assetUrl}')"`;
}

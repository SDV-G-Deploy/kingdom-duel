import type { DuelRules } from '../engine/types';

export type ContentValidationIssue = {
  path: string;
  message: string;
};

const TILE_KINDS = new Set(['sword', 'shield', 'sun', 'moon', 'crown', 'shade', 'aether']);
const BASE_TILE_KINDS = new Set(['sword', 'shield', 'sun', 'moon', 'crown', 'shade']);
const MANA_KINDS = new Set(['sun', 'moon', 'crown']);

export class ContentValidationError extends Error {
  constructor(readonly issues: ContentValidationIssue[]) {
    super(`Invalid duel content:\n${issues.map((issue) => `- ${issue.path}: ${issue.message}`).join('\n')}`);
    this.name = 'ContentValidationError';
  }
}

export function assertValidDuelRules(value: unknown): asserts value is DuelRules {
  const issues = validateDuelRules(value);
  if (issues.length) throw new ContentValidationError(issues);
}

export function validateDuelRules(value: unknown): ContentValidationIssue[] {
  const issues: ContentValidationIssue[] = [];
  if (!isRecord(value)) return [{ path: 'rules', message: 'must be an object' }];

  validateBoard(value.board, issues);
  validateMatch(value.match, issues);
  validateTileRegistry(value.tiles, issues);

  const passives = isRecord(value.passives) ? value.passives : null;
  if (!passives) {
    issues.push({ path: 'passives', message: 'must be a passive registry object' });
  } else {
    for (const [key, passive] of Object.entries(passives)) validatePassive(key, passive, issues);
  }

  const abilities = isRecord(value.abilities) ? value.abilities : null;
  if (!abilities) {
    issues.push({ path: 'abilities', message: 'must be an ability registry object' });
  } else {
    for (const [key, ability] of Object.entries(abilities)) validateAbility(key, ability, issues);
  }

  const actors = isRecord(value.actors) ? value.actors : null;
  if (!actors) {
    issues.push({ path: 'actors', message: 'must contain player and enemy definitions' });
  } else {
    validateCombatant('actors.player', actors.player, 'hero', abilities, passives, issues);
    validateCombatant('actors.enemy', actors.enemy, 'enemy', abilities, passives, issues);
    if (isRecord(actors.player) && isRecord(actors.enemy) && actors.player.id === actors.enemy.id) {
      issues.push({ path: 'actors', message: 'player and enemy IDs must be different' });
    }
  }

  if (!Array.isArray(value.openingLog) || !value.openingLog.every((entry) => typeof entry === 'string')) {
    issues.push({ path: 'openingLog', message: 'must be an array of strings' });
  }

  return issues;
}

function validateBoard(value: unknown, issues: ContentValidationIssue[]): void {
  if (!isRecord(value)) {
    issues.push({ path: 'board', message: 'must be an object' });
    return;
  }
  validateInteger(value.width, 'board.width', 3, issues);
  validateInteger(value.height, 'board.height', 3, issues);
}

function validateMatch(value: unknown, issues: ContentValidationIssue[]): void {
  if (!isRecord(value)) {
    issues.push({ path: 'match', message: 'must be an object' });
    return;
  }
  validateInteger(value.extraTurnLength, 'match.extraTurnLength', 3, issues);
  validateInteger(value.specialCreateLength, 'match.specialCreateLength', 3, issues);
  if (
    Number.isInteger(value.extraTurnLength) &&
    Number.isInteger(value.specialCreateLength) &&
    Number(value.specialCreateLength) < Number(value.extraTurnLength)
  ) {
    issues.push({ path: 'match.specialCreateLength', message: 'must be >= match.extraTurnLength' });
  }
  validateInteger(value.maxCascades, 'match.maxCascades', 0, issues);
}

function validateTileRegistry(value: unknown, issues: ContentValidationIssue[]): void {
  if (!isRecord(value)) {
    issues.push({ path: 'tiles', message: 'must be a tile-rule registry object' });
    return;
  }
  for (const tile of TILE_KINDS) {
    validateTileRule(tile, value[tile], issues);
  }
}

function validateTileRule(tile: string, value: unknown, issues: ContentValidationIssue[]): void {
  const path = `tiles.${tile}`;
  if (!isRecord(value)) {
    issues.push({ path, message: 'definition is required' });
    return;
  }
  validateNonEmptyString(value.label, `${path}.label`, issues);
  validateFiniteNumber(value.enemyScorePerTile, `${path}.enemyScorePerTile`, Number.NEGATIVE_INFINITY, issues);

  if (!isRecord(value.effect)) {
    issues.push({ path: `${path}.effect`, message: 'must be an effect object' });
    return;
  }
  const effectPath = `${path}.effect`;
  if (tile === 'aether' && value.effect.type !== 'special') {
    issues.push({ path: `${effectPath}.type`, message: 'aether must use the special effect type' });
  }
  if (tile !== 'aether' && value.effect.type === 'special') {
    issues.push({ path: `${effectPath}.type`, message: 'special effect type is reserved for aether' });
  }
  if (value.effect.type === 'damage' || value.effect.type === 'guard') {
    validateFiniteNumber(value.effect.amountPerTile, `${effectPath}.amountPerTile`, 0, issues);
    return;
  }
  if (value.effect.type === 'mana') {
    if (!MANA_KINDS.has(String(value.effect.mana))) {
      issues.push({ path: `${effectPath}.mana`, message: 'must be a mana tile' });
    }
    validateFiniteNumber(value.effect.amountPerTile, `${effectPath}.amountPerTile`, 0, issues);
    return;
  }
  if (value.effect.type === 'risky_damage') {
    validateFiniteNumber(value.effect.amountPerTile, `${effectPath}.amountPerTile`, 0, issues);
    validateFiniteNumber(value.effect.playerBacklashPerTile, `${effectPath}.playerBacklashPerTile`, 0, issues);
    return;
  }
  if (value.effect.type === 'special') {
    validateFiniteNumber(value.effect.damage, `${effectPath}.damage`, 0, issues);
    validateInteger(value.effect.radius, `${effectPath}.radius`, 0, issues);
    if (value.effect.actorModifiers !== undefined) {
      if (!isRecord(value.effect.actorModifiers)) {
        issues.push({ path: `${effectPath}.actorModifiers`, message: 'must be an actor modifier object' });
      } else {
        for (const [actor, modifier] of Object.entries(value.effect.actorModifiers)) {
          if ((actor !== 'player' && actor !== 'enemy') || !isRecord(modifier)) {
            issues.push({ path: `${effectPath}.actorModifiers.${actor}`, message: 'must be a player or enemy modifier object' });
            continue;
          }
          if (modifier.damage !== undefined) validateFiniteNumber(modifier.damage, `${effectPath}.actorModifiers.${actor}.damage`, 0, issues);
          if (modifier.radius !== undefined) validateInteger(modifier.radius, `${effectPath}.actorModifiers.${actor}.radius`, 0, issues);
          if (modifier.extraTurn !== undefined && typeof modifier.extraTurn !== 'boolean') {
            issues.push({ path: `${effectPath}.actorModifiers.${actor}.extraTurn`, message: 'must be a boolean when provided' });
          }
        }
      }
    }
    return;
  }
  issues.push({ path: `${effectPath}.type`, message: 'unknown tile effect type' });
}

function validateCombatant(
  path: string,
  value: unknown,
  expectedKind: 'hero' | 'enemy',
  abilities: Record<string, unknown> | null,
  passives: Record<string, unknown> | null,
  issues: ContentValidationIssue[],
): void {
  if (!isRecord(value)) {
    issues.push({ path, message: 'must be an object' });
    return;
  }
  validateNonEmptyString(value.id, `${path}.id`, issues);
  validateNonEmptyString(value.name, `${path}.name`, issues);
  if (value.kind !== expectedKind) issues.push({ path: `${path}.kind`, message: `must be "${expectedKind}"` });
  validateInteger(value.hp, `${path}.hp`, 1, issues);
  validateInteger(value.guard, `${path}.guard`, 0, issues);

  if (value.passiveId !== null && typeof value.passiveId !== 'string') {
    issues.push({ path: `${path}.passiveId`, message: 'must be a passive ID or null' });
  } else if (typeof value.passiveId === 'string' && (!passives || !isRecord(passives[value.passiveId]))) {
    issues.push({ path: `${path}.passiveId`, message: `references unknown passive "${value.passiveId}"` });
  }

  if (!Array.isArray(value.abilityIds) || !value.abilityIds.every((id) => typeof id === 'string')) {
    issues.push({ path: `${path}.abilityIds`, message: 'must be an array of ability IDs' });
  } else {
    if (new Set(value.abilityIds).size !== value.abilityIds.length) {
      issues.push({ path: `${path}.abilityIds`, message: 'must not contain duplicates' });
    }
    for (const abilityId of value.abilityIds) {
      if (!abilities || !isRecord(abilities[abilityId])) {
        issues.push({ path: `${path}.abilityIds`, message: `references unknown ability "${abilityId}"` });
      }
    }
  }

  if (expectedKind === 'enemy') {
    if (!isRecord(value.ai)) {
      issues.push({ path: `${path}.ai`, message: 'must be an AI profile object' });
    } else {
      validateFiniteNumber(value.ai.extraTurnScore, `${path}.ai.extraTurnScore`, 0, issues);
      if (value.ai.tileScores !== undefined) {
        if (!isRecord(value.ai.tileScores)) {
          issues.push({ path: `${path}.ai.tileScores`, message: 'must be a base-tile score object' });
        } else {
          for (const [tile, score] of Object.entries(value.ai.tileScores)) {
            if (!BASE_TILE_KINDS.has(tile)) {
              issues.push({ path: `${path}.ai.tileScores.${tile}`, message: 'must reference a base tile kind' });
            } else {
              validateFiniteNumber(score, `${path}.ai.tileScores.${tile}`, 0, issues);
            }
          }
        }
      }
    }
  }
}

function validateAbility(key: string, value: unknown, issues: ContentValidationIssue[]): void {
  const path = `abilities.${key}`;
  if (!isRecord(value)) {
    issues.push({ path, message: 'must be an object' });
    return;
  }
  if (value.id !== key) issues.push({ path: `${path}.id`, message: `must match registry key "${key}"` });
  validateNonEmptyString(value.name, `${path}.name`, issues);
  if (value.target !== 'cell' && value.target !== 'row') {
    issues.push({ path: `${path}.target`, message: 'must be "cell" or "row"' });
  }
  validateManaCost(value.cost, `${path}.cost`, issues);
  validatePresentation(value.presentation, `${path}.presentation`, issues);

  if (!Array.isArray(value.effects) || value.effects.length === 0) {
    issues.push({ path: `${path}.effects`, message: 'must contain at least one effect' });
    return;
  }
  value.effects.forEach((effect, index) => validateAbilityEffect(effect, `${path}.effects[${index}]`, value.target, issues));
}

function validateAbilityEffect(
  value: unknown,
  path: string,
  target: unknown,
  issues: ContentValidationIssue[],
): void {
  if (!isRecord(value)) {
    issues.push({ path, message: 'must be an object' });
    return;
  }
  if (value.type === 'gain_guard') {
    validateInteger(value.amount, `${path}.amount`, 0, issues);
    return;
  }
  if (value.type === 'convert_tiles') {
    validateInteger(value.radius, `${path}.radius`, 0, issues);
    if (!BASE_TILE_KINDS.has(String(value.to))) issues.push({ path: `${path}.to`, message: 'must be a base tile kind' });
    if (value.from !== undefined && !TILE_KINDS.has(String(value.from))) {
      issues.push({ path: `${path}.from`, message: 'must be a known tile kind' });
    }
    if (target !== 'cell') issues.push({ path, message: 'convert_tiles requires cell targeting' });
    if (value.shape !== undefined && value.shape !== 'square' && value.shape !== 'cross') {
      issues.push({ path: `${path}.shape`, message: 'must be "square" or "cross"' });
    }
    return;
  }
  if (value.type === 'clear_row') {
    if (target !== 'row') issues.push({ path, message: 'clear_row requires row targeting' });
    return;
  }
  issues.push({ path: `${path}.type`, message: 'unknown effect type' });
}

function validatePassive(key: string, value: unknown, issues: ContentValidationIssue[]): void {
  const path = `passives.${key}`;
  if (!isRecord(value)) {
    issues.push({ path, message: 'must be an object' });
    return;
  }
  if (value.id !== key) issues.push({ path: `${path}.id`, message: `must match registry key "${key}"` });
  validateNonEmptyString(value.name, `${path}.name`, issues);
  validateNonEmptyString(value.description, `${path}.description`, issues);
  if (value.trigger !== 'special_created') {
    issues.push({ path: `${path}.trigger`, message: 'must be "special_created"' });
  }
  if (!Array.isArray(value.effects) || value.effects.length === 0) {
    issues.push({ path: `${path}.effects`, message: 'must contain at least one effect' });
    return;
  }
  for (const [index, effect] of value.effects.entries()) {
    const effectPath = `${path}.effects[${index}]`;
    if (!isRecord(effect) || effect.type !== 'gain_guard') {
      issues.push({ path: effectPath, message: 'must be a gain_guard effect' });
      continue;
    }
    validateInteger(effect.amount, `${effectPath}.amount`, 0, issues);
  }
}

function validateManaCost(value: unknown, path: string, issues: ContentValidationIssue[]): void {
  if (!isRecord(value)) {
    issues.push({ path, message: 'must be an object' });
    return;
  }
  for (const [mana, amount] of Object.entries(value)) {
    if (!MANA_KINDS.has(mana)) {
      issues.push({ path: `${path}.${mana}`, message: 'unknown mana kind' });
    } else {
      validateInteger(amount, `${path}.${mana}`, 0, issues);
    }
  }
}

function validatePresentation(value: unknown, path: string, issues: ContentValidationIssue[]): void {
  if (!isRecord(value)) {
    issues.push({ path, message: 'must be an object' });
    return;
  }
  validateInteger(value.order, `${path}.order`, 0, issues);
  if (!MANA_KINDS.has(String(value.gem))) issues.push({ path: `${path}.gem`, message: 'must be a mana tile' });
  for (const field of ['shortLabel', 'roleLabel', 'actionLabel', 'readyHint', 'targetHint', 'previewHint']) {
    validateNonEmptyString(value[field], `${path}.${field}`, issues);
  }
}

function validateNonEmptyString(value: unknown, path: string, issues: ContentValidationIssue[]): void {
  if (typeof value !== 'string' || value.trim().length === 0) issues.push({ path, message: 'must be a non-empty string' });
}

function validateInteger(value: unknown, path: string, minimum: number, issues: ContentValidationIssue[]): void {
  if (!Number.isInteger(value) || Number(value) < minimum) {
    issues.push({ path, message: `must be an integer >= ${minimum}` });
  }
}

function validateFiniteNumber(value: unknown, path: string, minimum: number, issues: ContentValidationIssue[]): void {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < minimum) {
    issues.push({ path, message: `must be a finite number >= ${minimum}` });
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

import { cloneBoard, findLegalMoves, findMatches, getTile, setTile } from './board';
import { abilityTargetCells, cellsAround, matchReward } from './rewards';
import type {
  AbilityDefinition,
  ActorState,
  BaseTileKind,
  Board,
  Cell,
  DuelRules,
  DuelState,
  EnemyAbilityThreat,
  EnemyIntent,
  ManaCost,
  MovePreview,
  TileKind,
} from './types';

export type MovePreviewer = (board: Board, from: Cell, to: Cell, rules: DuelRules, actor?: 'player' | 'enemy') => MovePreview;

export function chooseEnemyIntent(
  state: DuelState,
  rules: DuelRules,
  previewMove: MovePreviewer,
): EnemyIntent | null {
  const threat = enemyAbilityThreat(state, rules);
  const abilityIntent = chooseEnemyAbilityIntent(state, rules, threat);
  if (abilityIntent) return abilityIntent;

  const ranked = findLegalMoves(state.board)
    .map((move) => {
      const preview = previewMove(state.board, move.from, move.to, rules, 'enemy');
      return preview.valid ? { ...move, preview, score: scoreMovePreview(preview, rules) } : null;
    })
    .filter((move): move is {
      from: Cell;
      to: Cell;
      preview: Extract<MovePreview, { valid: true }>;
      score: number;
    } => !!move)
    .sort((a, b) => b.score - a.score || a.from.y - b.from.y || a.from.x - b.from.x);

  const best = ranked[0];
  return best ? { type: 'swap', from: best.from, to: best.to, preview: best.preview, abilityThreat: threat } : null;
}

function enemyAbilityThreat(state: DuelState, rules: DuelRules): EnemyAbilityThreat | null {
  const threats = state.enemy.abilityIds.map((abilityId) => {
    const ability = rules.abilities[abilityId];
    const current: ManaCost = {
      ...(ability.cost.sun ? { sun: state.enemy.sun } : {}),
      ...(ability.cost.moon ? { moon: state.enemy.moon } : {}),
      ...(ability.cost.crown ? { crown: state.enemy.crown } : {}),
    };
    const required = (ability.cost.sun ?? 0) + (ability.cost.moon ?? 0) + (ability.cost.crown ?? 0);
    const charged = Math.min(state.enemy.sun, ability.cost.sun ?? 0) +
      Math.min(state.enemy.moon, ability.cost.moon ?? 0) +
      Math.min(state.enemy.crown, ability.cost.crown ?? 0);
    return {
      abilityId,
      name: ability.name,
      current,
      cost: ability.cost,
      ready: canPayCost(state.enemy, ability.cost),
      ratio: required > 0 ? charged / required : 1,
    };
  });

  const best = threats.sort((a, b) => Number(b.ready) - Number(a.ready) || b.ratio - a.ratio)[0];
  if (!best) return null;
  const { ratio: _ratio, ...threat } = best;
  return threat;
}

function chooseEnemyAbilityIntent(
  state: DuelState,
  rules: DuelRules,
  threat: EnemyAbilityThreat | null,
): Extract<EnemyIntent, { type: 'ability' }> | null {
  if (!threat?.ready) return null;
  const ability = rules.abilities[threat.abilityId];
  const targets = ability.target === 'row'
    ? Array.from({ length: state.board.height }, (_, y) => ({ x: 0, y }))
    : Array.from({ length: state.board.width * state.board.height }, (_, index) => ({
        x: index % state.board.width,
        y: Math.floor(index / state.board.width),
      }));
  const ranked = targets
    .map((target) => ({ target, score: scoreEnemyAbilityTarget(state.board, ability, target, rules) }))
    .sort((a, b) => b.score - a.score || a.target.y - b.target.y || a.target.x - b.target.x);
  const best = ranked[0];
  if (!best) return null;
  return {
    type: 'ability',
    abilityId: ability.id,
    target: best.target,
    cells: abilityTargetCells(state.board, ability, best.target),
    summary: ability.target === 'row' ? `${ability.name} · row ${best.target.y + 1}` : ability.name,
    abilityThreat: threat,
  };
}

function scoreEnemyAbilityTarget(
  source: Board,
  ability: AbilityDefinition,
  target: Cell,
  rules: DuelRules,
): number {
  const board = cloneBoard(source);
  let score = 0;
  for (const effect of ability.effects) {
    if (effect.type === 'gain_guard') {
      score += effect.amount * 3;
    } else if (effect.type === 'convert_tiles') {
      const cells = cellsAround(board, target, effect.radius).filter((cell) =>
        (effect.shape !== 'cross' || cell.x === target.x || cell.y === target.y) &&
        (effect.from === undefined || getTile(board, cell) === effect.from),
      );
      for (const cell of cells) {
        if (getTile(board, cell) !== effect.to) score += 1;
        setTile(board, cell, effect.to);
      }
    } else {
      for (let x = 0; x < board.width; x++) {
        const tile = getTile(board, { x, y: target.y });
        score += tileScore(tile, rules) + 1;
      }
    }
  }
  return score + scoreMatches(findMatches(board), rules);
}

function scoreMovePreview(preview: Extract<MovePreview, { valid: true }>, rules: DuelRules): number {
  if (preview.matches[0]?.tile === 'aether') return preview.score;
  return scoreMatches(preview.matches, rules);
}

function scoreMatches(matches: Extract<MovePreview, { valid: true }>['matches'], rules: DuelRules): number {
  let score = 0;
  for (const match of matches) {
    const reward = matchReward(match, rules);
    const value = reward.effectAmount;
    score += value + value * tileScore(match.tile, rules);
    if (reward.extraTurn) score += rules.actors.enemy.ai.extraTurnScore;
    if (reward.createsSpecial) score += rules.tiles.aether.enemyScorePerTile;
  }
  return score;
}

function tileScore(tile: TileKind, rules: DuelRules): number {
  if (tile === 'aether') return rules.tiles.aether.enemyScorePerTile;
  return rules.actors.enemy.ai.tileScores?.[tile as BaseTileKind] ?? rules.tiles[tile].enemyScorePerTile;
}

function canPayCost(actor: ActorState, cost: ManaCost): boolean {
  return actor.sun >= (cost.sun ?? 0) && actor.moon >= (cost.moon ?? 0) && actor.crown >= (cost.crown ?? 0);
}

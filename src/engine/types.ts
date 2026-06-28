export type TileKind = 'sword' | 'shield' | 'sun' | 'moon' | 'crown' | 'shade';
export type ActorId = 'player' | 'enemy';

export type Cell = {
  x: number;
  y: number;
};

export type Board = {
  width: number;
  height: number;
  tiles: TileKind[];
};

export type MatchGroup = {
  tile: TileKind;
  cells: Cell[];
};

export type ActorState = {
  id: ActorId;
  name: string;
  hp: number;
  maxHp: number;
  guard: number;
  sun: number;
  moon: number;
  crown: number;
};

export type ActorSnapshot = Pick<ActorState, 'hp' | 'maxHp' | 'guard' | 'sun' | 'moon' | 'crown'>;

export type BattleLogEntry = {
  id: number;
  turn: number;
  actor: ActorId | 'system';
  summary: string;
  detail: string;
  events: string[];
  before: {
    player: ActorSnapshot;
    enemy: ActorSnapshot;
  };
  after: {
    player: ActorSnapshot;
    enemy: ActorSnapshot;
  };
};

export type ActorTemplate = {
  name: string;
  hp: number;
  guard: number;
};

export type ManaTile = 'sun' | 'moon' | 'crown';
export type SpellId = 'sun_bloom' | 'glass_ward' | 'crown_strike';

export type ManaCost = Partial<Record<ManaTile, number>>;

export type TileEffect =
  | { type: 'damage'; amountPerTile: number }
  | { type: 'guard'; amountPerTile: number }
  | { type: 'mana'; mana: ManaTile; amountPerTile: number }
  | { type: 'risky_damage'; amountPerTile: number; playerBacklashPerTile: number };

export type TileRule = {
  label: string;
  effect: TileEffect;
  enemyScorePerTile: number;
};

export type EnemyProfile = {
  name: string;
  extraTurnScore: number;
};

export type SpellRule =
  | {
      id: 'sun_bloom';
      name: string;
      cost: ManaCost;
      target: 'cell';
      radius: number;
      convertTo: TileKind;
    }
  | {
      id: 'glass_ward';
      name: string;
      cost: ManaCost;
      target: 'cell';
      guard: number;
      radius: number;
      fromTile: TileKind;
      convertTo: TileKind;
    }
  | {
      id: 'crown_strike';
      name: string;
      cost: ManaCost;
      target: 'row';
    };

export type DuelRules = {
  board: {
    width: number;
    height: number;
  };
  actors: Record<ActorId, ActorTemplate>;
  tiles: Record<TileKind, TileRule>;
  match: {
    extraTurnLength: number;
    maxCascades: number;
  };
  enemy: EnemyProfile;
  spells: Record<SpellId, SpellRule>;
  openingLog: string[];
};

export type DuelState = {
  board: Board;
  player: ActorState;
  enemy: ActorState;
  current: ActorId;
  turn: number;
  seed: number;
  selected: Cell | null;
  winner: ActorId | null;
  log: string[];
  history: BattleLogEntry[];
};

export type DuelEvent =
  | { type: 'invalid_swap'; from: Cell; to: Cell }
  | { type: 'invalid_spell'; spell: SpellId; reason: string }
  | { type: 'spell_cast'; actor: ActorId; spell: SpellId; target: Cell }
  | { type: 'tiles_converted'; actor: ActorId; from?: TileKind; to: TileKind; cells: Cell[] }
  | { type: 'row_cleared'; actor: ActorId; row: number; cells: Cell[] }
  | { type: 'swap'; actor: ActorId; from: Cell; to: Cell }
  | { type: 'match'; actor: ActorId; tile: TileKind; cells: Cell[] }
  | { type: 'damage'; actor: ActorId; target: ActorId; amount: number }
  | { type: 'guard'; actor: ActorId; amount: number }
  | { type: 'mana'; actor: ActorId; tile: 'sun' | 'moon' | 'crown'; amount: number }
  | { type: 'backlash'; actor: ActorId; amount: number }
  | { type: 'extra_turn'; actor: ActorId }
  | { type: 'cascade'; count: number }
  | { type: 'board_refilled' }
  | { type: 'enemy_intent'; text: string }
  | { type: 'battle_ended'; winner: ActorId };

export type SwapResult = {
  state: DuelState;
  events: DuelEvent[];
};

export type PreviewEffect = {
  label: string;
  value: number;
  tone: 'damage' | 'guard' | 'mana' | 'risk';
};

export type MovePreview =
  | {
      valid: false;
      from: Cell;
      to: Cell;
      reason: string;
    }
  | {
      valid: true;
      from: Cell;
      to: Cell;
      matches: MatchGroup[];
      effects: PreviewEffect[];
      extraTurn: boolean;
      summary: string;
      score: number;
    };

export type EnemyIntent = {
  from: Cell;
  to: Cell;
  preview: Extract<MovePreview, { valid: true }>;
};

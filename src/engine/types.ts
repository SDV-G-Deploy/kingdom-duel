export type BaseTileKind = 'sword' | 'shield' | 'sun' | 'moon' | 'crown' | 'shade';
export type SpecialTileKind = 'aether';
export type TileKind = BaseTileKind | SpecialTileKind;
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
  definitionId: string;
  name: string;
  hp: number;
  maxHp: number;
  guard: number;
  sun: number;
  moon: number;
  crown: number;
  abilityIds: AbilityId[];
  passiveId: PassiveId | null;
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

export type CombatantDefinition = {
  id: string;
  name: string;
  hp: number;
  guard: number;
  abilityIds: AbilityId[];
  passiveId: PassiveId | null;
};

export type ManaTile = 'sun' | 'moon' | 'crown';
export type AbilityId = string;
export type BuiltInAbilityId =
  | 'sun_bloom'
  | 'glass_ward'
  | 'crown_strike'
  | 'veil_rift'
  | 'lunar_lock'
  | 'eclipse_surge';
export type PassiveId = string;
export type BuiltInPassiveId = 'prism_guard';

export type ManaCost = Partial<Record<ManaTile, number>>;

export type HeroDefinition = CombatantDefinition & {
  kind: 'hero';
};

export type EnemyDefinition = CombatantDefinition & {
  kind: 'enemy';
  ai: {
    extraTurnScore: number;
    tileScores?: Partial<Record<BaseTileKind, number>>;
  };
};

export type TileEffect =
  | { type: 'damage'; amountPerTile: number }
  | { type: 'guard'; amountPerTile: number }
  | { type: 'mana'; mana: ManaTile; amountPerTile: number }
  | { type: 'risky_damage'; amountPerTile: number; playerBacklashPerTile: number }
  | {
      type: 'special';
      damage: number;
      radius: number;
      actorModifiers?: Partial<Record<ActorId, { damage?: number; radius?: number; extraTurn?: boolean }>>;
    };

export type TileRule = {
  label: string;
  effect: TileEffect;
  enemyScorePerTile: number;
};

export type AbilityEffect =
  | { type: 'gain_guard'; amount: number }
  | { type: 'convert_tiles'; radius: number; shape?: 'square' | 'cross'; to: BaseTileKind; from?: TileKind }
  | { type: 'clear_row' };

export type PassiveEffect = { type: 'gain_guard'; amount: number };

export type PassiveDefinition = {
  id: PassiveId;
  name: string;
  description: string;
  trigger: 'special_created';
  effects: PassiveEffect[];
};

export type AbilityPresentation = {
  order: number;
  gem: ManaTile;
  shortLabel: string;
  roleLabel: string;
  actionLabel: string;
  readyHint: string;
  targetHint: string;
  previewHint: string;
};

export type AbilityDefinition = {
  id: AbilityId;
  name: string;
  cost: ManaCost;
  target: 'cell' | 'row';
  effects: AbilityEffect[];
  presentation: AbilityPresentation;
};

export type DuelRules = {
  board: {
    width: number;
    height: number;
  };
  actors: {
    player: HeroDefinition;
    enemy: EnemyDefinition;
  };
  tiles: Record<TileKind, TileRule>;
  match: {
    extraTurnLength: number;
    specialCreateLength: number;
    maxCascades: number;
  };
  abilities: Record<AbilityId, AbilityDefinition>;
  passives: Record<PassiveId, PassiveDefinition>;
  openingLog: string[];
};

export type DuelRuntimeMode = 'interactive' | 'simulation';

export type GameAction =
  | { type: 'swap'; actor: ActorId; from: Cell; to: Cell }
  | { type: 'cast'; actor: ActorId; abilityId: AbilityId; target: Cell }
  | { type: 'refill'; actor: ActorId };

export type ActionRejectionCode =
  | 'battle_ended'
  | 'not_actor_turn'
  | 'target_outside_board'
  | 'tiles_not_adjacent'
  | 'swap_creates_no_match'
  | 'unknown_ability'
  | 'ability_not_equipped'
  | 'not_enough_mana'
  | 'legal_moves_available';

export type ActionRejection = {
  code: ActionRejectionCode;
  message: string;
};

export type ActionRecord = {
  id: number;
  turn: number;
  action: GameAction;
  accepted: boolean;
  rejection?: ActionRejection;
  events: DuelEvent[];
};

export type DuelState = {
  initialSeed: number;
  mode: DuelRuntimeMode;
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
  actionLog: ActionRecord[];
};

export type DuelEvent =
  | { type: 'invalid_swap'; from: Cell; to: Cell }
  | { type: 'invalid_spell'; spell: AbilityId; reason: string }
  | { type: 'spell_cast'; actor: ActorId; spell: AbilityId; target: Cell }
  | { type: 'tiles_converted'; actor: ActorId; from?: TileKind; to: TileKind; cells: Cell[] }
  | { type: 'row_cleared'; actor: ActorId; row: number; cells: Cell[] }
  | { type: 'swap'; actor: ActorId; from: Cell; to: Cell }
  | { type: 'match'; actor: ActorId; tile: TileKind; cells: Cell[] }
  | { type: 'damage'; actor: ActorId; target: ActorId; source: TileKind; amount: number; blocked: number; hpDamage: number }
  | { type: 'guard'; actor: ActorId; amount: number }
  | { type: 'mana'; actor: ActorId; tile: 'sun' | 'moon' | 'crown'; amount: number }
  | { type: 'backlash'; actor: ActorId; amount: number }
  | { type: 'extra_turn'; actor: ActorId }
  | { type: 'turn_changed'; from: ActorId; to: ActorId; turn: number }
  | { type: 'cascade'; count: number }
  | { type: 'tiles_fallen'; cells: Cell[] }
  | { type: 'board_refilled' }
  | { type: 'special_created'; actor: ActorId; tile: SpecialTileKind; cell: Cell; matchLength: number }
  | { type: 'special_activated'; actor: ActorId; tile: SpecialTileKind; cell: Cell; cells: Cell[] }
  | { type: 'passive_triggered'; actor: ActorId; passiveId: PassiveId }
  | { type: 'enemy_intent'; text: string }
  | { type: 'action_rejected'; action: GameAction['type']; code: ActionRejectionCode; reason: string }
  | { type: 'battle_ended'; winner: ActorId };

export type ResolutionSnapshot = {
  board: Board;
  player: ActorState;
  enemy: ActorState;
  current: ActorId;
  turn: number;
  seed: number;
  winner: ActorId | null;
};

export type ResolutionFrameKind =
  | 'swap'
  | 'ability'
  | 'ability_effect'
  | 'cascade'
  | 'match'
  | 'damage'
  | 'guard'
  | 'mana'
  | 'backlash'
  | 'fall'
  | 'refill'
  | 'special'
  | 'turn'
  | 'battle_end';

export type ResolutionFrame = {
  index: number;
  kind: ResolutionFrameKind;
  events: DuelEvent[];
  snapshot: ResolutionSnapshot;
};

export type Resolution = {
  state: DuelState;
  events: DuelEvent[];
  frames: ResolutionFrame[];
  rejection?: ActionRejection;
};

export type SwapResult = Resolution;

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

export type EnemyAbilityThreat = {
  abilityId: AbilityId;
  name: string;
  current: ManaCost;
  cost: ManaCost;
  ready: boolean;
};

export type EnemyIntent =
  | {
      type: 'swap';
      from: Cell;
      to: Cell;
      preview: Extract<MovePreview, { valid: true }>;
      abilityThreat: EnemyAbilityThreat | null;
    }
  | {
      type: 'ability';
      abilityId: AbilityId;
      target: Cell;
      cells: Cell[];
      summary: string;
      abilityThreat: EnemyAbilityThreat;
    };

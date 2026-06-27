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
};

export type DuelEvent =
  | { type: 'invalid_swap'; from: Cell; to: Cell }
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


export const GAME_LOG_LIMIT = 20;

export type GameLogKind = 'reward' | 'battle' | 'interaction' | 'travel' | 'system';

export interface GameLogEntry {
  id: string;
  kind: GameLogKind;
  message: string;
}

export interface GameLogState {
  sessionPlayerId: string | null;
  nextId: number;
  entries: readonly GameLogEntry[];
}

export function createGameLogState(sessionPlayerId: string | null): GameLogState {
  return { sessionPlayerId, nextId: 1, entries: [] };
}

export const initialGameLogState: GameLogState = createGameLogState(null);

export function beginProfileGameLogSession(_current: GameLogState, playerId: string): GameLogState {
  return createGameLogState(playerId);
}

export function beginImportedSaveGameLogSession(_current: GameLogState, playerId: string): GameLogState {
  return appendGameLogEntry(createGameLogState(playerId), 'system', 'Save imported');
}

export function resetProfileGameLogSession(_current: GameLogState): GameLogState {
  return createGameLogState(null);
}

export function appendGameLogEntry(state: GameLogState, kind: GameLogKind, message: string): GameLogState {
  const entry = { id: `game-log-${state.nextId}`, kind, message: message.trim() };
  if (!entry.message) return state;

  return {
    sessionPlayerId: state.sessionPlayerId,
    nextId: state.nextId + 1,
    entries: [...state.entries, entry].slice(-GAME_LOG_LIMIT)
  };
}

export function formatGameLogEntry(entry: GameLogEntry): string {
  return `${gameLogKindLabel[entry.kind]}: ${entry.message}`;
}

export const gameLogKindLabel: Record<GameLogKind, string> = {
  reward: 'Reward',
  battle: 'Battle',
  interaction: 'Interaction',
  travel: 'Travel',
  system: 'System'
};

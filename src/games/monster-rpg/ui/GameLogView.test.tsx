import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { appendGameLogEntry, createGameLogState, type GameLogKind, type GameLogState } from './gameLog';
import { GameLogHistory, GameLogStatus } from './GameLogView';

function typedLog(): GameLogState {
  return (['reward', 'battle', 'interaction', 'travel', 'system'] as GameLogKind[]).reduce<GameLogState>(
    (log, kind) => appendGameLogEntry(log, kind, `${kind} message`),
    createGameLogState('player-a')
  );
}

describe('Game Log HUD', () => {
  it('renders the newest typed entry as the live one-line status', () => {
    const markup = renderToStaticMarkup(<GameLogStatus gameLog={typedLog()} />);

    expect(markup).toContain('aria-live="polite"');
    expect(markup).toContain('data-kind="system"');
    expect(markup).toContain('System: system message');
    expect(markup).not.toContain('Reward: reward message');
  });

  it('uses native keyboard-expandable details and summary semantics for typed history', () => {
    const markup = renderToStaticMarkup(<GameLogHistory gameLog={typedLog()} />);

    expect(markup).toContain('<details');
    expect(markup).toContain('<summary>Game Log');
    expect(markup).not.toContain('<details open=""');
    for (const kind of ['reward', 'battle', 'interaction', 'travel', 'system']) {
      expect(markup).toContain(`data-kind="${kind}"`);
      expect(markup).toContain(`monster-game-log-${kind}`);
    }
    expect(markup.indexOf('system message')).toBeLessThan(markup.indexOf('reward message'));
    expect(markup).not.toContain('filter');
  });
});

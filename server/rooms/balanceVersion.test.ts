import { describe, expect, test } from 'vitest';
import { assertBalanceVersion as assertBattleBalanceVersion } from './BattleRoom';
import { assertBalanceVersion as assertLocationBalanceVersion, TRANSITION_TOKEN_TTL_MS } from './LocationRoom';
import { CURRENT_BALANCE_VERSION, GAME_BALANCE_CONFIG } from '../../src/games/monster-rpg/sim/gameBalance';

test('location transition TTL consumes the central balance config', () => {
  expect(TRANSITION_TOKEN_TTL_MS).toBe(GAME_BALANCE_CONFIG.maps.transitionTokenTtlMs);
});

for (const [name, assertBalanceVersion] of [['location', assertLocationBalanceVersion], ['battle', assertBattleBalanceVersion]] as const) {
  describe(`${name} balance compatibility`, () => {
    test('accepts the current version and rejects wrong, absent, and future versions before room mutation', () => {
      expect(() => assertBalanceVersion(CURRENT_BALANCE_VERSION)).not.toThrow();
      for (const version of [0, undefined, CURRENT_BALANCE_VERSION + 1]) {
        let rejected = false;
        try { assertBalanceVersion(version); } catch (error) {
          rejected = true;
          expect(error).toMatchObject({ code: 409 });
          expect((error as Error).message).toBe(JSON.stringify({ code: 'BALANCE_VERSION_MISMATCH', serverBalanceVersion: CURRENT_BALANCE_VERSION, clientBalanceVersion: typeof version === 'number' ? version : null }));
        }
        expect(rejected).toBe(true);
      }
    });
  });
}

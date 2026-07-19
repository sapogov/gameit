import { describe, expect, test } from 'vitest';
import { assertBalanceVersion as assertBattleBalanceVersion } from './BattleRoom';
import { assertBalanceVersion as assertLocationBalanceVersion, TRANSITION_TOKEN_TTL_MS } from './LocationRoom';
import { GAME_BALANCE_CONFIG } from '../../src/games/monster-rpg/sim/gameBalance';

test('location transition TTL consumes the central balance config', () => {
  expect(TRANSITION_TOKEN_TTL_MS).toBe(GAME_BALANCE_CONFIG.maps.transitionTokenTtlMs);
});

for (const [name, assertBalanceVersion] of [['location', assertLocationBalanceVersion], ['battle', assertBattleBalanceVersion]] as const) {
  describe(`${name} balance compatibility`, () => {
    test('accepts v1 and rejects wrong, absent, and future versions before room mutation', () => {
      expect(() => assertBalanceVersion(1)).not.toThrow();
      for (const version of [0, undefined, 2]) {
        let rejected = false;
        try { assertBalanceVersion(version); } catch (error) {
          rejected = true;
          expect(error).toMatchObject({ code: 409 });
          expect((error as Error).message).toBe(JSON.stringify({ code: 'BALANCE_VERSION_MISMATCH', serverBalanceVersion: 1, clientBalanceVersion: typeof version === 'number' ? version : null }));
        }
        expect(rejected).toBe(true);
      }
    });
  });
}

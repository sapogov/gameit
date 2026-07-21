import { describe, expect, test } from 'vitest';
import { parseSaveCommand } from './authorityProtocol';
describe('authority protocol', () => {
  test('validates the versioned command envelope', () => {
    expect(parseSaveCommand({ intentId: 'a_1', expectedRevision: 0, intent: { type: 'move' } })).toBeNull();
    expect(parseSaveCommand({ intentId: 'farm_1', expectedRevision: 0, intent: { type: 'attemptFarmTheft', farmId: 'canonical-farm' } })).toBeNull();
    expect(parseSaveCommand({ intentId: '', expectedRevision: -1, intent: { type: 1 } })).toBeNull();
  });
});

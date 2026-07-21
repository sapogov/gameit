import { describe, expect, test } from 'vitest';
import { loadAuthorityEnabled } from './runtime';

describe('authority maintenance flag', () => {
  test('defaults enabled and accepts only exact boolean strings', () => {
    expect(loadAuthorityEnabled()).toBe(true);
    expect(loadAuthorityEnabled('true')).toBe(true);
    expect(loadAuthorityEnabled('false')).toBe(false);
    expect(() => loadAuthorityEnabled('TRUE')).toThrow('exactly true or false');
    expect(() => loadAuthorityEnabled('0')).toThrow('exactly true or false');
  });
});

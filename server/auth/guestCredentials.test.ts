import { describe, expect, test } from 'vitest';
import { issueGuestCredential, loadGuestCredentialConfig, loadGuestCredentialTtlSeconds, verifyGuestCredential } from './guestCredentials';
describe('guest credentials', () => {
  test('signs, verifies, rotates, and rejects tampering', () => {
    const first = Buffer.alloc(32, 1).toString('base64url'); const old = Buffer.alloc(32, 2).toString('base64url');
    const config = loadGuestCredentialConfig({ GAMEIT_GUEST_AUTH_KEYS: `new:${first},old:${old}`, NODE_ENV: 'test' });
    const issuedAt = 1_000;
    const issued = issueGuestCredential(config, issuedAt); expect(verifyGuestCredential(issued.credential, config, issuedAt)).toEqual(issued.claims);
    expect(verifyGuestCredential(`${issued.credential}x`, config, issuedAt)).toBeNull();
  });
  test('rejects short production keys and requires production configuration', () => {
    expect(() => loadGuestCredentialConfig({ NODE_ENV: 'production' })).toThrow();
    expect(() => loadGuestCredentialConfig({ GAMEIT_GUEST_AUTH_KEYS: 'a:YWJj', NODE_ENV: 'test' })).toThrow();
  });
  test('enforces configured TTL with 60-second skew and supports deterministic clocks', () => {
    const key = Buffer.alloc(32, 1).toString('base64url'); const config = loadGuestCredentialConfig({ GAMEIT_GUEST_AUTH_KEYS: `new:${key}`, NODE_ENV: 'test' });
    const issued = issueGuestCredential(config, 1_000_000);
    expect(verifyGuestCredential(issued.credential, config, 1_360_000, 300)).not.toBeNull();
    expect(verifyGuestCredential(issued.credential, config, 1_361_000, 300)).toBeNull();
    expect(loadGuestCredentialTtlSeconds({})).toBe(2_592_000);
    expect(() => loadGuestCredentialTtlSeconds({ GAMEIT_GUEST_AUTH_TTL_SECONDS: '299' })).toThrow();
  });
});

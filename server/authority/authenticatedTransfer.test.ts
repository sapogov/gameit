import { describe, expect, test } from 'vitest';
import { loadGuestCredentialConfig } from '../auth/guestCredentials';
import { signAuthenticatedTransfer, verifyAuthenticatedTransfer } from './authenticatedTransfer';

describe('authenticated transfer envelope', () => {
  const key = Buffer.alloc(32, 4).toString('base64url');
  const config = loadGuestCredentialConfig({ GAMEIT_GUEST_AUTH_KEYS: `new:${key}`, NODE_ENV: 'test' });
  test('binds all canonical fields and rejects tampering before import', () => {
    const envelope = signAuthenticatedTransfer({ playerId: 'player-a', revision: 2, rosterRevision: 1, issuedAt: 1, payload: '{"safe":true}' }, config);
    expect(verifyAuthenticatedTransfer(JSON.stringify(envelope), config)).toEqual(envelope);
    expect(verifyAuthenticatedTransfer(JSON.stringify({ ...envelope, playerId: 'player-b' }), config)).toBeNull();
  });
  test('key removal revokes old transfer envelopes', () => {
    const envelope = signAuthenticatedTransfer({ playerId: 'player-a', revision: 0, rosterRevision: 0, issuedAt: 1, payload: '{}' }, config);
    const replacement = loadGuestCredentialConfig({ GAMEIT_GUEST_AUTH_KEYS: `other:${Buffer.alloc(32, 5).toString('base64url')}`, NODE_ENV: 'test' });
    expect(verifyAuthenticatedTransfer(JSON.stringify(envelope), replacement)).toBeNull();
  });
});

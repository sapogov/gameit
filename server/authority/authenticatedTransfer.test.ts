import { createHmac } from 'node:crypto';
import { describe, expect, test } from 'vitest';
import { loadGuestCredentialConfig } from '../auth/guestCredentials';
import {
  MAX_AUTHENTICATED_TRANSFER_AGE_MS,
  MAX_AUTHENTICATED_TRANSFER_FUTURE_SKEW_MS,
  isAuthenticatedTransferFresh,
  signAuthenticatedTransfer,
  verifyAuthenticatedTransfer,
} from './authenticatedTransfer';

describe('authenticated transfer envelope', () => {
  const key = Buffer.alloc(32, 4).toString('base64url');
  const config = loadGuestCredentialConfig({ GAMEIT_GUEST_AUTH_KEYS: `new:${key}`, NODE_ENV: 'test' });
  test('signs and verifies the v1 golden envelope', () => {
    const envelope = signAuthenticatedTransfer({ playerId: 'player-a', revision: 2, rosterRevision: 1, issuedAt: 1, payload: '{"safe":true}' }, config);
    expect(envelope).toMatchObject({ v: 1, kid: 'new', playerId: 'player-a', revision: 2, rosterRevision: 1, issuedAt: 1, payload: '{"safe":true}' });
    expect(verifyAuthenticatedTransfer(JSON.stringify(envelope), config)).toEqual(envelope);
  });

  test('verifies a previously signed v1 envelope and rejects tampering', () => {
    const unsigned = { v: 1 as const, kid: 'new', playerId: 'player-a', revision: 2, rosterRevision: 1, issuedAt: 1, payload: '{"safe":true}' };
    const fields = ['gameit.monster-rpg.transfer.v1', unsigned.kid, unsigned.playerId, String(unsigned.revision), String(unsigned.rosterRevision), String(unsigned.issuedAt), unsigned.payload];
    const mac = createHmac('sha256', Buffer.alloc(32, 4)).update(fields.map((field) => `${Buffer.byteLength(field, 'utf8')}:${field}`).join('|')).digest('base64url');
    const envelope = { ...unsigned, mac };
    expect(verifyAuthenticatedTransfer(JSON.stringify(envelope), config)).toEqual(envelope);
    expect(verifyAuthenticatedTransfer(JSON.stringify({ ...envelope, playerId: 'player-b' }), config)).toBeNull();
    expect(verifyAuthenticatedTransfer(JSON.stringify({ ...envelope, v: 2 }), config)).toBeNull();
  });
  test('key removal revokes old transfer envelopes', () => {
    const envelope = signAuthenticatedTransfer({ playerId: 'player-a', revision: 0, rosterRevision: 0, issuedAt: 1, payload: '{}' }, config);
    const replacement = loadGuestCredentialConfig({ GAMEIT_GUEST_AUTH_KEYS: `other:${Buffer.alloc(32, 5).toString('base64url')}`, NODE_ENV: 'test' });
    expect(verifyAuthenticatedTransfer(JSON.stringify(envelope), replacement)).toBeNull();
  });

  test('enforces authenticated transfer freshness boundaries with injected time', () => {
    const now = 4_000_000_000;
    const envelope = { issuedAt: now - MAX_AUTHENTICATED_TRANSFER_AGE_MS };
    expect(isAuthenticatedTransferFresh(envelope, now)).toBe(true);
    expect(isAuthenticatedTransferFresh({ issuedAt: envelope.issuedAt - 1 }, now)).toBe(false);
    expect(isAuthenticatedTransferFresh({ issuedAt: now + MAX_AUTHENTICATED_TRANSFER_FUTURE_SKEW_MS }, now)).toBe(true);
    expect(isAuthenticatedTransferFresh({ issuedAt: now + MAX_AUTHENTICATED_TRANSFER_FUTURE_SKEW_MS + 1 }, now)).toBe(false);
    expect(isAuthenticatedTransferFresh({ issuedAt: now - 101 }, now, 100)).toBe(false);
  });
});

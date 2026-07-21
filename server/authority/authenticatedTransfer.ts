import { createHmac, timingSafeEqual } from 'node:crypto';
import type { GuestCredentialConfig } from '../auth/guestCredentials';

export interface AuthenticatedTransferEnvelope { v: 1; kid: string; playerId: string; revision: number; rosterRevision: number; issuedAt: number; payload: string; mac: string }
export const MAX_AUTHENTICATED_TRANSFER_BYTES = 256 * 1024;

export function signAuthenticatedTransfer(input: Omit<AuthenticatedTransferEnvelope, 'v' | 'kid' | 'mac'>, config: GuestCredentialConfig): AuthenticatedTransferEnvelope {
  const key = config.keys[0];
  const envelope = { v: 1 as const, kid: key.kid, ...input };
  return { ...envelope, mac: mac(canonical(envelope), key.key) };
}

/** Size is checked on raw input before parsing; removed keys immediately revoke prior exports. */
export function verifyAuthenticatedTransfer(raw: unknown, config: GuestCredentialConfig): AuthenticatedTransferEnvelope | null {
  if (typeof raw !== 'string' || Buffer.byteLength(raw, 'utf8') > MAX_AUTHENTICATED_TRANSFER_BYTES) return null;
  let value: unknown;
  try { value = JSON.parse(raw); } catch { return null; }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const envelope = value as Partial<AuthenticatedTransferEnvelope>;
  if (envelope.v !== 1 || typeof envelope.kid !== 'string' || typeof envelope.playerId !== 'string'
    || typeof envelope.revision !== 'number' || !Number.isSafeInteger(envelope.revision) || envelope.revision < 0
    || typeof envelope.rosterRevision !== 'number' || !Number.isSafeInteger(envelope.rosterRevision) || envelope.rosterRevision < 0
    || typeof envelope.issuedAt !== 'number' || !Number.isSafeInteger(envelope.issuedAt) || envelope.issuedAt < 0
    || typeof envelope.payload !== 'string' || typeof envelope.mac !== 'string') return null;
  const key = config.keys.find((entry) => entry.kid === envelope.kid);
  if (!key || Buffer.byteLength(envelope.payload, 'utf8') > MAX_AUTHENTICATED_TRANSFER_BYTES) return null;
  const unsigned = { v: 1 as const, kid: envelope.kid, playerId: envelope.playerId, revision: envelope.revision, rosterRevision: envelope.rosterRevision, issuedAt: envelope.issuedAt, payload: envelope.payload };
  return equal(envelope.mac, mac(canonical(unsigned), key.key)) ? envelope as AuthenticatedTransferEnvelope : null;
}

function canonical(value: Omit<AuthenticatedTransferEnvelope, 'mac'>): string {
  return ['gameit.monster-rpg.transfer.v1', value.kid, value.playerId, String(value.revision), String(value.rosterRevision), String(value.issuedAt), value.payload].map((field) => `${Buffer.byteLength(field, 'utf8')}:${field}`).join('|');
}
function mac(value: string, key: Buffer) { return createHmac('sha256', key).update(value).digest('base64url'); }
function equal(left: string, right: string) { const a = Buffer.from(left); const b = Buffer.from(right); return a.length === b.length && timingSafeEqual(a, b); }

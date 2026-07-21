import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';

export interface GuestCredentialClaims { v: 1; sub: string; iat: number; nonce: string }
export interface GuestCredentialKey { kid: string; key: Buffer }
export interface GuestCredentialConfig { keys: readonly GuestCredentialKey[]; ephemeral: boolean }
export const GUEST_AUTH_CLOCK_SKEW_SECONDS = 60;
const DEFAULT_TTL_SECONDS = 30 * 24 * 60 * 60;
const MIN_TTL_SECONDS = 300;
const MAX_TTL_SECONDS = 90 * 24 * 60 * 60;

const prefix = 'g1';

/** Reads the rotating signing-key ring. This is deliberately server-only. */
export function loadGuestCredentialConfig(env: NodeJS.ProcessEnv = process.env): GuestCredentialConfig {
  const configured = env.GAMEIT_GUEST_AUTH_KEYS;
  if (!configured) {
    if (env.NODE_ENV === 'production') throw new Error('GAMEIT_GUEST_AUTH_KEYS is required in production');
    // Ephemeral development credentials intentionally do not survive a restart.
    console.warn('GAMEIT_GUEST_AUTH_KEYS is unset; using an ephemeral development guest-auth key');
    return { keys: [{ kid: 'dev', key: Buffer.from(randomUUID() + randomUUID()) }], ephemeral: true };
  }
  const keys = configured.split(',').map((entry) => {
    const separator = entry.indexOf(':');
    if (separator <= 0 || separator === entry.length - 1) throw new Error('Invalid GAMEIT_GUEST_AUTH_KEYS entry');
    const kid = entry.slice(0, separator);
    if (!/^[A-Za-z0-9_-]+$/.test(kid)) throw new Error('Invalid guest-auth key id');
    let key: Buffer;
    try { key = Buffer.from(entry.slice(separator + 1), 'base64url'); } catch { throw new Error('Invalid guest-auth key encoding'); }
    if (key.length < 32) throw new Error('Guest-auth keys must decode to at least 32 bytes');
    return { kid, key };
  });
  if (new Set(keys.map((entry) => entry.kid)).size !== keys.length) throw new Error('Guest-auth key ids must be unique');
  return { keys, ephemeral: false };
}

export function loadGuestCredentialTtlSeconds(env: NodeJS.ProcessEnv = process.env): number {
  const raw = env.GAMEIT_GUEST_AUTH_TTL_SECONDS;
  if (raw === undefined) return DEFAULT_TTL_SECONDS;
  if (!/^\d+$/.test(raw)) throw new Error('GAMEIT_GUEST_AUTH_TTL_SECONDS must be an integer');
  const ttl = Number(raw);
  if (!Number.isSafeInteger(ttl) || ttl < MIN_TTL_SECONDS || ttl > MAX_TTL_SECONDS) throw new Error('GAMEIT_GUEST_AUTH_TTL_SECONDS must be between 300 and 7776000');
  return ttl;
}

export function issueGuestCredential(config: GuestCredentialConfig, now = Date.now(), sub: string = randomUUID()): { credential: string; claims: GuestCredentialClaims } {
  const claims: GuestCredentialClaims = { v: 1, sub, iat: Math.floor(now / 1000), nonce: randomUUID() };
  const key = config.keys[0];
  const encoded = Buffer.from(JSON.stringify(claims)).toString('base64url');
  const unsigned = `${prefix}.${key.kid}.${encoded}`;
  return { credential: `${unsigned}.${sign(unsigned, key.key)}`, claims };
}

export function verifyGuestCredential(credential: unknown, config: GuestCredentialConfig, now = Date.now(), ttlSeconds = DEFAULT_TTL_SECONDS): GuestCredentialClaims | null {
  if (typeof credential !== 'string') return null;
  const parts = credential.split('.');
  if (parts.length !== 4 || parts[0] !== prefix) return null;
  const key = config.keys.find((entry) => entry.kid === parts[1]);
  if (!key || !constantTimeEqual(parts[3], sign(parts.slice(0, 3).join('.'), key.key))) return null;
  try {
    const claims = JSON.parse(Buffer.from(parts[2], 'base64url').toString('utf8')) as GuestCredentialClaims;
    if (!(claims?.v === 1 && isUuid(claims.sub) && isUuid(claims.nonce) && Number.isSafeInteger(claims.iat) && claims.iat > 0)) return null;
    const nowSeconds = Math.floor(now / 1000);
    return claims.iat <= nowSeconds + GUEST_AUTH_CLOCK_SKEW_SECONDS && claims.iat + ttlSeconds + GUEST_AUTH_CLOCK_SKEW_SECONDS >= nowSeconds ? claims : null;
  } catch { return null; }
}

function sign(value: string, key: Buffer): string { return createHmac('sha256', key).update(value).digest('base64url'); }
function constantTimeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left); const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}
function isUuid(value: unknown): value is string { return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value); }

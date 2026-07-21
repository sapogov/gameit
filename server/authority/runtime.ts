import { loadGuestCredentialConfig, loadGuestCredentialTtlSeconds } from '../auth/guestCredentials';
import { PlayerAuthority } from './playerAuthority';
import { ProcessLocalPlayerAuthorityRepository } from './playerRepository';
import { randomInt } from 'node:crypto';

export function loadAuthorityEnabled(value = process.env.MONSTER_RPG_SERVER_AUTHORITY_V1): boolean {
  if (value === undefined) return true;
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new Error('MONSTER_RPG_SERVER_AUTHORITY_V1 must be exactly true or false');
}

/** One process-local authority boundary shared by all Colyseus rooms. */
export const authorityRepository = new ProcessLocalPlayerAuthorityRepository();
export const guestCredentialConfig = loadGuestCredentialConfig();
export const guestCredentialTtlSeconds = loadGuestCredentialTtlSeconds();
export const authorityEnabled = loadAuthorityEnabled();
export const playerAuthority = new PlayerAuthority(authorityRepository, () => new Date(), guestCredentialConfig, () => randomInt(0, 0x1_0000_0000) / 0x1_0000_0000);

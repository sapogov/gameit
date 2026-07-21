import { loadGuestCredentialConfig, loadGuestCredentialTtlSeconds } from '../auth/guestCredentials';
import { PlayerAuthority } from './playerAuthority';
import { ProcessLocalPlayerAuthorityRepository } from './playerRepository';

/** One process-local authority boundary shared by all Colyseus rooms. */
export const authorityRepository = new ProcessLocalPlayerAuthorityRepository();
export const guestCredentialConfig = loadGuestCredentialConfig();
export const guestCredentialTtlSeconds = loadGuestCredentialTtlSeconds();
export const playerAuthority = new PlayerAuthority(authorityRepository, () => new Date(), guestCredentialConfig);

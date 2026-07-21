import { Client, Room, ServerError } from 'colyseus';
import { issueGuestCredential, verifyGuestCredential } from '../auth/guestCredentials';
import { authorityEnabled, guestCredentialConfig, guestCredentialTtlSeconds, playerAuthority } from '../authority/runtime';
import { authorityReady, parseCorrelatedAuthorityRequest, parseSaveCommand } from '../../src/games/monster-rpg/network/authorityProtocol';
import type { AvatarId } from '../../src/games/monster-rpg/sim';

type AccountJoin = { credential?: string };

/** Authentication and canonical save commands intentionally live outside location/battle rooms. */
export class AccountRoom extends Room {
  maxClients = 1;
  private principal = '';

  onCreate() {
    this.onMessage('bootstrapProfile', async (client, value: unknown) => {
      if (!authorityEnabled) return client.send('authorityResult', { status: 'rejected', code: 'AUTHORITY_MAINTENANCE' });
      if (!isProfile(value)) return client.send('authorityResult', { status: 'rejected', code: 'INVALID_COMMAND' });
      client.send('authorityReady', authorityReady('authenticated', await playerAuthority.bootstrapProfile({ sub: this.principal }, value)));
    });
    this.onMessage('saveCommand', async (client, value: unknown) => {
      if (!authorityEnabled) return client.send('authorityResult', { status: 'rejected', code: 'AUTHORITY_MAINTENANCE' });
      const command = parseSaveCommand(value);
      client.send('authorityResult', command ? await playerAuthority.execute({ sub: this.principal }, command) : { status: 'rejected', code: 'INVALID_COMMAND' });
    });
    this.onMessage('importLegacySave', async (client, value: unknown) => {
      if (!authorityEnabled) return client.send('authorityResult', { status: 'rejected', code: 'AUTHORITY_MAINTENANCE' });
      if (typeof value !== 'string') return client.send('authorityResult', { status: 'rejected', code: 'INVALID_COMMAND' });
      const result = await playerAuthority.importLegacySave({ sub: this.principal }, value);
      client.send('authorityResult', result.ok
        ? { status: 'applied', snapshot: result.snapshot }
        : { status: 'rejected', code: result.code === 'ALREADY_INITIALIZED' ? 'REJECTED' : 'INVALID_COMMAND' });
    });
    this.onMessage('exportAuthenticatedSave', async (client, value: unknown) => {
      const request = parseCorrelatedAuthorityRequest(value);
      if (!request) return client.send('authenticatedTransferResult', { requestId: '', error: 'INVALID_COMMAND' });
      const envelope = await playerAuthority.exportAuthenticatedSave({ sub: this.principal });
      client.send('authenticatedTransferResult', envelope ? { requestId: request.requestId, result: JSON.stringify(envelope) } : { requestId: request.requestId, error: 'AUTHORITY_REQUIRED' });
    });
    this.onMessage('importAuthenticatedSave', async (client, value: unknown) => {
      if (!authorityEnabled) return client.send('authenticatedTransferResult', { requestId: '', error: 'AUTHORITY_MAINTENANCE' });
      const request = parseCorrelatedAuthorityRequest(value);
      if (!request || typeof request.payload !== 'string') return client.send('authenticatedTransferResult', { requestId: request?.requestId ?? '', error: 'INVALID_COMMAND' });
      const result = await playerAuthority.importAuthenticatedExport({ sub: this.principal }, request.payload);
      client.send('authenticatedTransferResult', result.ok ? { requestId: request.requestId, result: result.snapshot } : { requestId: request.requestId, error: result.code });
    });
  }

  async onJoin(client: Client, options?: AccountJoin) {
    const verified = authenticateAccountJoin(options?.credential);
    const issued = verified ? issueGuestCredential(guestCredentialConfig, Date.now(), verified.sub) : issueGuestCredential(guestCredentialConfig);
    this.principal = issued.claims.sub;
    const snapshot = (await playerAuthority.snapshot({ sub: this.principal })) ?? undefined;
    client.send('authorityReady', authorityReady(verified ? 'authenticated' : 'created', snapshot, issued.credential));
  }
}

export function authenticateAccountJoin(credential: unknown) {
  const verified = verifyGuestCredential(credential, guestCredentialConfig, Date.now(), guestCredentialTtlSeconds);
  if (credential !== undefined && !verified) throw new ServerError(401, 'Invalid guest credential');
  return verified;
}


function isProfile(value: unknown): value is { name: string; avatar: AvatarId } {
  if (!value || typeof value !== 'object') return false;
  const profile = value as { name?: unknown; avatar?: unknown };
  return typeof profile.name === 'string' && (profile.avatar === 'scout' || profile.avatar === 'ranger' || profile.avatar === 'keeper');
}

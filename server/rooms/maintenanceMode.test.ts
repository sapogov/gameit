import { describe, expect, test, vi } from 'vitest';
import { ServerError } from 'colyseus';

vi.mock('../authority/runtime', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../authority/runtime')>()),
  authorityEnabled: false
}));

import { issueGuestCredential } from '../auth/guestCredentials';
import { guestCredentialConfig, playerAuthority } from '../authority/runtime';
import { AccountRoom } from './AccountRoom';
import { BattleRoom } from './BattleRoom';
import { LocationRoom } from './LocationRoom';

type RegisteredHandlers = Map<string, (client: unknown, value: unknown) => unknown>;

function accountHarness() {
  const room = new AccountRoom();
  const handlers: RegisteredHandlers = new Map();
  (room as unknown as { onMessage: (type: string, handler: (client: unknown, value: unknown) => unknown) => void }).onMessage = (type, handler) => handlers.set(type, handler);
  room.onCreate();
  return { room, handlers };
}

function client() {
  return { send: vi.fn(), sessionId: 'maintenance-client' };
}

describe('authority maintenance mode', () => {
  test('allows account credential renewal, canonical snapshot reads, and authenticated exports', async () => {
    const issued = issueGuestCredential(guestCredentialConfig);
    const snapshot = await playerAuthority.bootstrapProfile({ sub: issued.claims.sub }, { name: 'Maintained', avatar: 'scout' });
    const { room, handlers } = accountHarness();
    const joined = client();

    await room.onJoin(joined as never, { credential: issued.credential });

    expect(joined.send).toHaveBeenCalledWith('authorityReady', expect.objectContaining({ status: 'authenticated', snapshot }));
    const ready = (joined.send as ReturnType<typeof vi.fn>).mock.calls[0][1] as { credential: string };
    expect(ready.credential).not.toBe(issued.credential);
    expect(ready.credential).toContain(`.${guestCredentialConfig.keys[0].kid}.`);

    await handlers.get('exportAuthenticatedSave')!(joined, { requestId: 'export' });
    expect(joined.send).toHaveBeenLastCalledWith('authenticatedTransferResult', expect.objectContaining({ requestId: 'export', result: expect.any(String) }));
  });

  test('rejects account mutations without a client-local fallback', async () => {
    const { room, handlers } = accountHarness();
    const joined = client();
    await room.onJoin(joined as never);
    const before = (joined.send as ReturnType<typeof vi.fn>).mock.calls.length;

    await handlers.get('bootstrapProfile')!(joined, { name: 'Blocked', avatar: 'scout' });
    await handlers.get('saveCommand')!(joined, { intentId: 'blocked', expectedRevision: 0, intent: { type: 'completeElderDialog' } });
    await handlers.get('importLegacySave')!(joined, '{}');
    await handlers.get('importAuthenticatedSave')!(joined, { requestId: 'import', payload: '{}' });

    expect((joined.send as ReturnType<typeof vi.fn>).mock.calls.slice(before)).toEqual([
      ['authorityResult', { status: 'rejected', code: 'AUTHORITY_MAINTENANCE' }],
      ['authorityResult', { status: 'rejected', code: 'AUTHORITY_MAINTENANCE' }],
      ['authorityResult', { status: 'rejected', code: 'AUTHORITY_MAINTENANCE' }],
      ['authenticatedTransferResult', { requestId: '', error: 'AUTHORITY_MAINTENANCE' }]
    ]);
  });

  test('rejects location and battle room creation with the maintenance code', async () => {
    await expect(new LocationRoom().onCreate()).rejects.toMatchObject({ code: 503, message: JSON.stringify({ code: 'AUTHORITY_MAINTENANCE' }) } satisfies Partial<ServerError>);
    expect(() => new BattleRoom().onCreate()).toThrowError(ServerError);
    expect(() => new BattleRoom().onCreate()).toThrow(JSON.stringify({ code: 'AUTHORITY_MAINTENANCE' }));
  });
});

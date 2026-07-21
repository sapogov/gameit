import { describe, expect, test, vi } from 'vitest';
import { ServerError } from 'colyseus';
import { issueGuestCredential } from '../auth/guestCredentials';
import { guestCredentialConfig, playerAuthority } from '../authority/runtime';
import { AccountRoom, authenticateAccountJoin } from './AccountRoom';
import { authenticateLocationJoin, isFacingFarmPosition } from './LocationRoom';
import { authenticateBattleJoin } from './BattleRoom';
import { PlayerAuthority } from '../authority/playerAuthority';
import { ProcessLocalPlayerAuthorityRepository } from '../authority/playerRepository';

describe('authority room security boundaries', () => {
  test('rejects retired Account command vocabulary without mutating canonical state', async () => {
    const issued = issueGuestCredential(guestCredentialConfig);
    await playerAuthority.bootstrapProfile({ sub: issued.claims.sub }, { name: 'Account', avatar: 'scout' });
    const room = new AccountRoom(); const handlers = new Map<string, (client: never, value: unknown) => Promise<void>>();
    (room as unknown as { onMessage: (type: string, handler: (client: never, value: unknown) => Promise<void>) => void }).onMessage = (type, handler) => handlers.set(type, handler);
    room.onCreate();
    const client = { send: vi.fn(), sessionId: 'retired-intent' };
    await room.onJoin(client as never, { credential: issued.credential });
    const before = await playerAuthority.snapshot({ sub: issued.claims.sub });
    await handlers.get('saveCommand')!(client as never, { intentId: 'retired-move', expectedRevision: before!.revision, intent: { type: 'move', direction: 'east' } });
    await handlers.get('saveCommand')!(client as never, { intentId: 'retired-theft', expectedRevision: before!.revision, intent: { type: 'attemptFarmTheft', farmId: 'foreign' } });
    expect(client.send).toHaveBeenLastCalledWith('authorityResult', { status: 'rejected', code: 'INVALID_COMMAND' });
    expect(await playerAuthority.snapshot({ sub: issued.claims.sub })).toEqual(before);
  });
  test('rejects malformed credentials at account and location joins', () => {
    expect(() => authenticateAccountJoin('forged')).toThrow(ServerError);
    expect(() => authenticateLocationJoin('forged')).toThrow(ServerError);
    expect(authenticateBattleJoin('forged')).toBeNull();
  });

  test('uses credential subject as the only room principal', () => {
    const issued = issueGuestCredential(guestCredentialConfig);
    expect(authenticateLocationJoin(issued.credential).sub).toBe(issued.claims.sub);
    expect(authenticateBattleJoin(issued.credential)?.sub).toBe(issued.claims.sub);
  });

  test('enforces the configured credential TTL at location and battle joins', () => {
    const issuedAt = 1_000_000;
    const expiredAt = issuedAt + 361_000;
    const issued = issueGuestCredential(guestCredentialConfig, issuedAt);
    expect(() => authenticateLocationJoin(issued.credential, expiredAt, 300)).toThrow(ServerError);
    expect(authenticateBattleJoin(issued.credential, expiredAt, 300)).toBeNull();
  });

  test('loads farms only from canonical repository aggregates', async () => {
    const repository = new ProcessLocalPlayerAuthorityRepository(); const authority = new PlayerAuthority(repository, () => new Date(0), undefined, () => 0.5);
    const principal = { sub: '123e4567-e89b-42d3-a456-426614174020' };
    await authority.bootstrapProfile(principal, { name: 'Owner', avatar: 'scout' });
    const aggregate = (await repository.read(principal.sub))!;
    aggregate.save.farms.farms.canonical = { id: 'canonical', ownerPlayerId: principal.sub, farmType: 'magic-dust', resourceId: 'magicDust', mapId: 'home-village', position: { mapId: 'home-village', x: 1, y: 1 }, level: 1, storedResources: {}, theftCooldowns: {}, guardCreatureId: '', productionRatePerMinute: 1, storageCap: 10, lastProductionAt: new Date().toISOString() };
    expect(await repository.compareExchange(principal.sub, 0, aggregate)).toBe(true);
    expect((await authority.findFarm('canonical'))?.playerId).toBe(principal.sub);
    expect(await authority.findFarm('client-invented')).toBeNull();
  });
  test('requires the authenticated room position to face the canonical foreign farm', () => {
    const farm = { id: 'farm', ownerPlayerId: 'owner', farmType: 'magic-dust' as const, resourceId: 'magicDust', mapId: 'home-village' as const, position: { mapId: 'home-village' as const, x: 4, y: 4 }, level: 1, storedResources: {}, theftCooldowns: {}, guardCreatureId: '', productionRatePerMinute: 1, storageCap: 10, lastProductionAt: new Date().toISOString() };
    expect(isFacingFarmPosition({ mapId: 'home-village', x: 3, y: 4, facing: 'east' }, farm)).toBe(true);
    expect(isFacingFarmPosition({ mapId: 'home-village', x: 2, y: 4, facing: 'east' }, farm)).toBe(false);
  });
});

import { describe, expect, test, vi } from 'vitest';
import { createPlayerProfile } from '../../src/games/monster-rpg/sim';
import { loadGuestCredentialConfig } from '../auth/guestCredentials';
import { PlayerAuthority } from '../authority/playerAuthority';
import { ProcessLocalPlayerAuthorityRepository } from '../authority/playerRepository';
import { playerAuthority } from '../authority/runtime';
import { LocationRoom, resolveCanonicalJoinPosition } from './LocationRoom';

const principal = (suffix: string) => ({ sub: `123e4567-e89b-42d3-a456-426614174${suffix}` });
const authorityFor = (repository: ProcessLocalPlayerAuthorityRepository, transferKeys?: ReturnType<typeof loadGuestCredentialConfig>) => new PlayerAuthority(repository, () => new Date(0), transferKeys, () => 0.5);

async function at(authority: PlayerAuthority, repository: ProcessLocalPlayerAuthorityRepository, user: { sub: string }, mapId: 'home-village' | 'world-map', x: number, y: number, facing: 'north' | 'east' | 'south' | 'west' = 'east') {
  await authority.bootstrapProfile(user, { name: 'Mover', avatar: 'scout' });
  const aggregate = (await repository.read(user.sub))!;
  aggregate.save.mapId = mapId;
  aggregate.save.position = { mapId, x, y, facing };
  expect(await repository.compareExchange(user.sub, 0, aggregate)).toBe(true);
}

describe('canonical location movement', () => {
  test('persists normal, blocked, and transition movement only through canonical authority', async () => {
    const repository = new ProcessLocalPlayerAuthorityRepository(); const authority = authorityFor(repository);
    const normal = principal('201'); await at(authority, repository, normal, 'home-village', 27, 10);
    const moved = await authority.applyMovement(normal, 'east', { mapId: 'home-village' });
    expect(moved?.snapshot).toMatchObject({ revision: 1, save: { position: { mapId: 'home-village', x: 28, y: 10, facing: 'east' } } });

    const blocked = principal('202'); await at(authority, repository, blocked, 'world-map', 61, 3, 'south');
    const blockedResult = await authority.applyMovement(blocked, 'east', { mapId: 'world-map' });
    expect(blockedResult?.snapshot).toMatchObject({ revision: 1, save: { position: { mapId: 'world-map', x: 61, y: 3, facing: 'east' } } });

    const transition = principal('203'); await at(authority, repository, transition, 'home-village', 28, 10);
    const transitioned = await authority.applyMovement(transition, 'east', { mapId: 'home-village' });
    expect(transitioned?.transition).toMatchObject({ toMapId: 'world-map' });
    expect(transitioned?.snapshot.save.position.mapId).toBe('world-map');
  });

  test('rejects unknown principal and stale map context without mutation, and retries a CAS race', async () => {
    const repository = new ProcessLocalPlayerAuthorityRepository(); const authority = authorityFor(repository);
    expect(await authority.applyMovement(principal('204'), 'east', { mapId: 'home-village' })).toBeNull();
    const user = principal('205'); await at(authority, repository, user, 'home-village', 27, 10);
    expect(await authority.applyMovement(user, 'east', { mapId: 'world-map' })).toBeNull();
    expect((await authority.snapshot(user))?.revision).toBe(0);
    const original = repository.compareExchange.bind(repository); let attempts = 0;
    vi.spyOn(repository, 'compareExchange').mockImplementation(async (...args) => (++attempts === 1 ? false : original(...args)));
    const result = await authority.applyMovement(user, 'east', { mapId: 'home-village' });
    expect(attempts).toBe(2); expect(result?.snapshot.revision).toBe(1);
  });

  test('rejects missing-session intents and replays before a second authority mutation', async () => {
    const apply = vi.spyOn(playerAuthority, 'applyMovement');
    const client = { sessionId: 'session-a', send: vi.fn() };
    const room = { mapId: 'home-village', moveSequences: new Map([['session-a', 4]]), state: { players: new Map() } };
    const handler = (LocationRoom.prototype as unknown as { handleMoveIntent: (client: unknown, payload: unknown) => Promise<void> }).handleMoveIntent;
    await handler.call(room, client, { direction: 'east', sequence: 5 });
    expect(apply).not.toHaveBeenCalled(); expect(client.send).not.toHaveBeenCalled();
    const player = { profile: { id: 'player-a' }, position: {} };
    room.state.players.set('session-a', player);
    room.moveSequences.set('session-a', 0);
    apply.mockResolvedValue({ snapshot: { save: { position: { mapId: 'home-village', x: 28, y: 10, facing: 'east' } } } } as never);
    await handler.call(room, client, { direction: 'east', sequence: 1 });
    await handler.call(room, client, { direction: 'east', sequence: 1 });
    expect(apply).toHaveBeenCalledTimes(1); expect(room.moveSequences.get('session-a')).toBe(1);
    apply.mockRestore();
  });

  test('reconnect and authenticated transfer expose the current canonical position', async () => {
    const key = Buffer.alloc(32, 9).toString('base64url'); const keys = loadGuestCredentialConfig({ GAMEIT_GUEST_AUTH_KEYS: `active:${key}`, NODE_ENV: 'test' });
    const sourceRepository = new ProcessLocalPlayerAuthorityRepository(); const source = authorityFor(sourceRepository, keys); const user = principal('206');
    await at(source, sourceRepository, user, 'home-village', 27, 10);
    const moved = await source.applyMovement(user, 'east', { mapId: 'home-village' });
    const profile = createPlayerProfile('Mover', 'scout'); profile.playerId = user.sub;
    expect(resolveCanonicalJoinPosition(undefined, moved!.snapshot.save.position, profile, 'home-village')).toEqual(moved!.snapshot.save.position);
    const target = authorityFor(new ProcessLocalPlayerAuthorityRepository(), keys);
    expect(await target.importAuthenticatedSave(user, JSON.stringify(await source.exportAuthenticatedSave(user)))).toMatchObject({ ok: true, snapshot: { save: { position: moved!.snapshot.save.position } } });
  });

  test('rejects a direct room join when the canonical position is bound to another map', () => {
    const profile = createPlayerProfile('Mover', 'scout');
    const canonicalPosition = { mapId: 'home-village' as const, x: 27, y: 10, facing: 'east' as const };

    expect(() => resolveCanonicalJoinPosition(undefined, canonicalPosition, profile, 'world-map')).toThrow('Canonical position is bound to a different map');
  });

  test('rejects a direct room join from an invalid canonical tile', () => {
    const profile = createPlayerProfile('Mover', 'scout');
    const canonicalPosition = { mapId: 'home-village' as const, x: -1, y: 10, facing: 'east' as const };

    expect(() => resolveCanonicalJoinPosition(undefined, canonicalPosition, profile, 'home-village')).toThrow('Invalid canonical position');
  });

  test('leaves the pushed canonical revision usable by the next Account command', async () => {
    const repository = new ProcessLocalPlayerAuthorityRepository(); const authority = authorityFor(repository); const user = principal('207');
    await at(authority, repository, user, 'home-village', 27, 10);
    const moved = await authority.applyMovement(user, 'east', { mapId: 'home-village' });
    const next = await authority.execute(user, { intentId: 'after-move', expectedRevision: moved!.snapshot.revision, intent: { type: 'completeElderDialog' } });
    expect(next).toMatchObject({ status: 'applied', snapshot: { revision: 2 } });
  });
});

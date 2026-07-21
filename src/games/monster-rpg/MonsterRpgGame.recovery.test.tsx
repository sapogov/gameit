import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, expect, test, vi } from 'vitest';
import { createInitialSave, createPlayerProfile } from './sim';
import { clearLegacyBrowserSave, importAuthenticatedRecovery, RecoveryPanel } from './recovery';

const legacyProfileKey = 'gameit.monsterRpg.profile';
const legacySaveKey = 'gameit.monsterRpg.save';

function installStorage(entries: Record<string, string>) {
  const values = new Map(Object.entries(entries));
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key)
  });
  return values;
}

afterEach(() => vi.unstubAllGlobals());

test('renders pending recovery as visible and disables another file selection', () => {
  const markup = renderToStaticMarkup(<RecoveryPanel canRetry={false} onImport={vi.fn()} onRetry={vi.fn()} state="pending" status="Recovering authenticated progress…" />);

  expect(markup).toContain('Recovering authenticated progress…');
  expect(markup).toContain('Recovery in progress…');
  expect(markup).toContain('type="file"');
  expect(markup).toContain('disabled=""');
  expect(markup).not.toContain('Retry recovery');
});

test('renders malformed, tampered, initialized, and cross-account recovery errors', () => {
  for (const reason of ['invalid transfer', 'tampered export', 'already initialized', 'cross principal account']) {
    const markup = renderToStaticMarkup(<RecoveryPanel canRetry onImport={vi.fn()} onRetry={vi.fn()} state="error" status={`Import failed: ${reason}`} />);
    expect(markup).toContain(`Import failed: ${reason}`);
    expect(markup).toContain('Retry recovery');
    expect(markup).toContain('Retry connection');
  }
});

test('retry action preserves and resends the retained authenticated payload to the account boundary', async () => {
  const snapshot = { playerId: 'player-1', revision: 3, rosterRevision: 2, save: createInitialSave(createPlayerProfile('Mira', 'scout')) };
  const account = { importAuthenticatedSave: vi.fn().mockResolvedValue(snapshot) };
  const retry = vi.fn(() => importAuthenticatedRecovery(account, '{"retained":true}'));
  const markup = renderToStaticMarkup(<RecoveryPanel canRetry onImport={vi.fn()} onRetry={retry} state="error" status="Import failed: invalid transfer" />);

  expect(markup).toContain('Retry recovery');
  await retry();
  expect(account.importAuthenticatedSave).toHaveBeenCalledWith('{"retained":true}');
});

test('a successful authority snapshot is returned for adoption and clears only legacy browser saves', async () => {
  const snapshot = { playerId: 'player-1', revision: 3, rosterRevision: 2, save: createInitialSave(createPlayerProfile('Mira', 'scout')) };
  const account = { importAuthenticatedSave: vi.fn().mockResolvedValue(snapshot) };
  const storage = installStorage({ [legacyProfileKey]: 'old-profile', [legacySaveKey]: 'old-save', 'gameit.monsterRpg.guestCredential': 'guest' });

  await expect(importAuthenticatedRecovery(account, '{"authenticated":true}')).resolves.toBe(snapshot);
  clearLegacyBrowserSave();

  expect(storage.get(legacyProfileKey)).toBeUndefined();
  expect(storage.get(legacySaveKey)).toBeUndefined();
  expect(storage.get('gameit.monsterRpg.guestCredential')).toBe('guest');
  expect(renderToStaticMarkup(<RecoveryPanel canRetry={false} onImport={vi.fn()} onRetry={vi.fn()} state="success" status="Authenticated progress recovered." />)).toContain('Recovery complete.');
});

test('a failed recovery leaves legacy browser saves intact', async () => {
  const storage = installStorage({ [legacyProfileKey]: 'old-profile', [legacySaveKey]: 'old-save' });
  const account = { importAuthenticatedSave: vi.fn().mockRejectedValue(new Error('tampered export')) };

  await expect(importAuthenticatedRecovery(account, '{"tampered":true}')).rejects.toThrow('tampered export');
  expect(storage.get(legacyProfileKey)).toBe('old-profile');
  expect(storage.get(legacySaveKey)).toBe('old-save');
});

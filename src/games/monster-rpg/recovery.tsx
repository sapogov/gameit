import type { AccountConnection } from './network';
import type { AuthoritySnapshot } from './network/authorityProtocol';

export type RecoveryState = 'idle' | 'pending' | 'error' | 'success';

export function clearLegacyBrowserSave(): void {
  localStorage.removeItem('gameit.monsterRpg.profile');
  localStorage.removeItem('gameit.monsterRpg.save');
}

export function importAuthenticatedRecovery(account: Pick<AccountConnection, 'importAuthenticatedSave'>, payload: string): Promise<AuthoritySnapshot> {
  return account.importAuthenticatedSave(payload);
}

export function RecoveryPanel({
  status,
  state,
  onImport,
  onRetry,
  canRetry
}: {
  status: string | null;
  state: RecoveryState;
  onImport: (file: File) => void;
  onRetry: () => void;
  canRetry: boolean;
}) {
  const pending = state === 'pending';
  return <section aria-label="Account recovery">
    <h1>Recover progress</h1>
    <p aria-live="polite">{status ?? 'You can recover an authenticated export before creating a character.'}</p>
    <label>Authenticated export<input accept="application/json,.json" disabled={pending} onChange={(event) => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ''; if (file) onImport(file); }} type="file" /></label>
    {pending ? <p>Recovery in progress…</p> : null}
    {state === 'error' && canRetry ? <button onClick={onRetry} type="button">Retry recovery</button> : null}
    {state === 'error' ? <button onClick={() => window.location.reload()} type="button">Retry connection</button> : null}
    {state === 'success' ? <p>Recovery complete.</p> : null}
  </section>;
}

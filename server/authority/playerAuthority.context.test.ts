import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

const source = readFileSync(new URL('./playerAuthority.ts', import.meta.url), 'utf8');

describe('PlayerAuthority mutation context forwarding', () => {
  test('has no ambient time or RNG and forwards one context to every authority mutation seam', () => {
    expect(source).not.toMatch(/\bnew Date\s*\(\s*\)|\bDate\.now\b|\bMath\.random\b/);
    expect(source).toContain('private mutationContext(): AuthorityMutationContext { return { transactionAt: this.now(), rng: this.rng }; }');

    const authorityCalls = [
      'createInitialSave(profile, simulationContext(context))',
      'createInitialSave(aggregate.save.profile, simulationContext(context))',
      'reduce(aggregate.save, command.intent, context)',
      'movementTransition(aggregate, direction, mutationContext)',
      'attemptFacingFarmTheft(simulated, context.transactionAt, simulationContext(context))',
      'applyBattleRewardsToSave(aggregate.save, result, simulationContext(context))',
      'resolveGuardedFarmTheft(foreignFarmState, {',
      'now: context.transactionAt'
    ];
    for (const call of authorityCalls) expect(source).toContain(call);
  });

  test.each([
    'convertStarterCreatureCards', 'buildStarterMagicDustFarm', 'completeVillageElderDialog', 'completeVillageElderOnboarding',
    'activateMaterialCard', 'activateBuffCard', 'buildFarmCardViaElder', 'moveCreatureToActiveParty', 'moveCreatureToStorage',
    'healAllCreaturesAtHospital', 'useReviveItem', 'convertCreatureCardViaElder', 'hatchEgg',
    'confirmStationTravel'
  ])('forwards simulation options for Account reducer intent family: %s', (operation) => {
    const reduceBody = source.slice(source.indexOf('function reduce('), source.indexOf('function movementTransition('));
    expect(reduceBody).toMatch(new RegExp(`${operation}\\([^;]*options`));
  });

  test.each(['claimReward', 'discardItem'])('stamps authority-owned inventory mutation time: %s', (operation) => {
    const reduceBody = source.slice(source.indexOf('function reduce('), source.indexOf('function movementTransition('));
    const branchStart = reduceBody.indexOf(`if (intent.type === '${operation}'`);
    const nextBranch = reduceBody.indexOf('\n  if (', branchStart + 1);
    const branch = reduceBody.slice(branchStart, nextBranch === -1 ? undefined : nextBranch);
    expect(branch).toContain('updatedAt: context.transactionAt.toISOString()');
  });

  test.each(['upgradeFarm', 'assignFarmGuard', 'clearFarmGuard', 'collectFacingFarm'])('forwards the established positional farm clock: %s', (operation) => {
    const reduceBody = source.slice(source.indexOf('function reduce('), source.indexOf('function movementTransition('));
    expect(reduceBody).toMatch(new RegExp(`${operation}\\([^;]*context\\.transactionAt`));
  });
});

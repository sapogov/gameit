import { describe, expect, test } from 'vitest';
import {
  GEN_1_SPECIES_COUNT,
  gen1SpeciesCatalog,
  getSpeciesById,
  getSpeciesBySlug,
  validateSpeciesCatalog
} from './speciesCatalog';
import type { CreatureSpeciesRecord } from './types';

describe('Gen 1 creature species catalog', () => {
  test('contains 147 stable records with the expected MVP polish split', () => {
    expect(validateSpeciesCatalog()).toEqual([]);
    expect(gen1SpeciesCatalog).toHaveLength(GEN_1_SPECIES_COUNT);
    expect(gen1SpeciesCatalog.map((species) => species.id)).toEqual(
      Array.from({ length: GEN_1_SPECIES_COUNT }, (_, index) => index + 1)
    );
    expect(gen1SpeciesCatalog[0]).toMatchObject({ id: 1, slug: 'spriglet', mvpStatus: 'polished' });
    expect(gen1SpeciesCatalog[22]).toMatchObject({ id: 23, slug: 'moss-kin-023', mvpStatus: 'placeholder' });
    expect(gen1SpeciesCatalog[gen1SpeciesCatalog.length - 1]).toMatchObject({ id: 147, slug: 'gust-kin-147' });

    const polished = gen1SpeciesCatalog.filter((species) => species.mvpStatus === 'polished');
    expect(polished.filter((species) => species.rarity === 'common')).toHaveLength(14);
    expect(polished.filter((species) => species.rarity === 'uncommon')).toHaveLength(5);
    expect(polished.filter((species) => species.rarity === 'rare')).toHaveLength(3);
  });

  test('supports numeric ID and readable slug lookups', () => {
    expect(getSpeciesById(20)?.slug).toBe('runebuck');
    expect(getSpeciesBySlug('stormperch')?.id).toBe(21);
  });

  test('validation reports sequence gaps, duplicate IDs, duplicate slugs, invalid taxonomies, and missing attacks', () => {
    const broken = [
      { ...gen1SpeciesCatalog[0], rarity: 'ordinary' },
      { ...gen1SpeciesCatalog[1], id: 1, slug: gen1SpeciesCatalog[0].slug, type: 'void', attackPoolIds: ['missing'] }
    ] as unknown as CreatureSpeciesRecord[];

    expect(validateSpeciesCatalog(broken)).toEqual(
      expect.arrayContaining([
        `catalog must contain ${GEN_1_SPECIES_COUNT} species`,
        'duplicate species id 1',
        'duplicate species slug spriglet',
        'spriglet must use sequential id 2',
        'spriglet has invalid rarity ordinary',
        'spriglet has invalid type void',
        'spriglet references missing attack pool missing'
      ])
    );
  });
});

import { expect, test } from 'vitest';
import { ITEM_DEFINITIONS, validateItemCatalog } from './items';

test('catalog has fourteen unique valid definitions', () => {
  expect(ITEM_DEFINITIONS).toHaveLength(14);
  expect(validateItemCatalog()).toEqual([]);
});

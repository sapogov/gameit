import { describe, expect, it } from 'vitest';
import {
  WILD_ENCOUNTER_MAX_SPAWN_INTERVAL_MS,
  WILD_ENCOUNTER_MIN_SPAWN_INTERVAL_MS,
  canTargetEncounter,
  canEnterTile,
  createWildEncounterSpawn,
  getGameMap,
  getWildEncounterZonesForMap,
  isPositionInsideEncounterZone,
  rollSpawnDelayMs
} from '.';

describe('wild encounter simulation', () => {
  it('rolls natural spawn intervals from 90 to 120 seconds', () => {
    expect(rollSpawnDelayMs(() => 0)).toBe(WILD_ENCOUNTER_MIN_SPAWN_INTERVAL_MS);
    expect(rollSpawnDelayMs(() => 0.999_999)).toBe(WILD_ENCOUNTER_MAX_SPAWN_INTERVAL_MS);
  });

  it('spawns visible encounters on walkable tiles inside their zone', () => {
    const [zone] = getWildEncounterZonesForMap('world-map');
    const spawn = createWildEncounterSpawn(zone, () => 0.42);
    const map = getGameMap(spawn.mapId);

    expect(isPositionInsideEncounterZone(zone, spawn.x, spawn.y)).toBe(true);
    expect(canEnterTile(map, spawn.x, spawn.y)).toBe(true);
  });

  it('targets only the tile in front of the player', () => {
    expect(
      canTargetEncounter(
        { mapId: 'home-village', x: 4, y: 4, facing: 'east' },
        { mapId: 'home-village', x: 5, y: 4 }
      )
    ).toBe(true);
    expect(
      canTargetEncounter(
        { mapId: 'home-village', x: 4, y: 4, facing: 'north' },
        { mapId: 'home-village', x: 5, y: 4 }
      )
    ).toBe(false);
  });
});

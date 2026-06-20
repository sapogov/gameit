import buildingClinic from './pixel/building-clinic.png?url';
import buildingHouse from './pixel/building-house.png?url';
import buildingPostOffice from './pixel/building-post-office.png?url';
import buildingShop from './pixel/building-shop.png?url';
import buildingTavern from './pixel/building-tavern.png?url';
import buildingTownHall from './pixel/building-town-hall.png?url';
import markerDoor from './pixel/marker-door.png?url';
import markerSign from './pixel/marker-sign.png?url';
import terrainField from './pixel/terrain-field.png?url';
import terrainForest from './pixel/terrain-forest.png?url';
import terrainMountain from './pixel/terrain-mountain.png?url';
import terrainTree from './pixel/terrain-tree.png?url';
import terrainWater from './pixel/terrain-water.png?url';
import villageLarge from './pixel/village-large.png?url';
import villageSmall from './pixel/village-small.png?url';

export const monsterRpgAssetKeys = {
  villageSmall: 'monster-rpg.village.small',
  villageLarge: 'monster-rpg.village.large',
  buildingClinic: 'monster-rpg.building.clinic',
  buildingHouse: 'monster-rpg.building.house',
  buildingPostOffice: 'monster-rpg.building.post-office',
  buildingShop: 'monster-rpg.building.shop',
  buildingTavern: 'monster-rpg.building.tavern',
  buildingTownHall: 'monster-rpg.building.town-hall',
  markerDoor: 'monster-rpg.marker.door',
  markerSign: 'monster-rpg.marker.sign',
  terrainField: 'monster-rpg.terrain.field',
  terrainForest: 'monster-rpg.terrain.forest',
  terrainMountain: 'monster-rpg.terrain.mountain',
  terrainTree: 'monster-rpg.terrain.tree',
  terrainWater: 'monster-rpg.terrain.water'
} as const;

export type MonsterRpgAssetKey = (typeof monsterRpgAssetKeys)[keyof typeof monsterRpgAssetKeys];

export const monsterRpgAssetManifest: ReadonlyArray<{ key: MonsterRpgAssetKey; src: string }> = [
  { key: monsterRpgAssetKeys.villageSmall, src: villageSmall },
  { key: monsterRpgAssetKeys.villageLarge, src: villageLarge },
  { key: monsterRpgAssetKeys.buildingClinic, src: buildingClinic },
  { key: monsterRpgAssetKeys.buildingHouse, src: buildingHouse },
  { key: monsterRpgAssetKeys.buildingPostOffice, src: buildingPostOffice },
  { key: monsterRpgAssetKeys.buildingShop, src: buildingShop },
  { key: monsterRpgAssetKeys.buildingTavern, src: buildingTavern },
  { key: monsterRpgAssetKeys.buildingTownHall, src: buildingTownHall },
  { key: monsterRpgAssetKeys.markerDoor, src: markerDoor },
  { key: monsterRpgAssetKeys.markerSign, src: markerSign },
  { key: monsterRpgAssetKeys.terrainField, src: terrainField },
  { key: monsterRpgAssetKeys.terrainForest, src: terrainForest },
  { key: monsterRpgAssetKeys.terrainMountain, src: terrainMountain },
  { key: monsterRpgAssetKeys.terrainTree, src: terrainTree },
  { key: monsterRpgAssetKeys.terrainWater, src: terrainWater }
];

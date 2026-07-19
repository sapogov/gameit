import buildingClinic from './pixel/building-clinic.png?url';
import buildingHouse from './pixel/building-house.png?url';
import buildingPostOffice from './pixel/building-post-office.png?url';
import buildingShop from './pixel/building-shop.png?url';
import buildingTavern from './pixel/building-tavern.png?url';
import buildingTownHall from './pixel/building-town-hall.png?url';
import creatureEncounters from './pixel/creature-encounters.png?url';
import markerDoor from './pixel/marker-door.png?url';
import markerSign from './pixel/marker-sign.png?url';
import terrainField from './pixel/terrain-field.png?url';
import terrainFieldAi1 from './pixel/terrain-field-ai-1.png?url';
import terrainFieldAi2 from './pixel/terrain-field-ai-2.png?url';
import terrainFieldAi3 from './pixel/terrain-field-ai-3.png?url';
import terrainForest from './pixel/terrain-forest.png?url';
import terrainForestAi1 from './pixel/terrain-forest-ai-1.png?url';
import terrainForestAi2 from './pixel/terrain-forest-ai-2.png?url';
import terrainForestAi3 from './pixel/terrain-forest-ai-3.png?url';
import terrainBridgeWater from './pixel/terrain-bridge-water.png?url';
import terrainGrass1 from './pixel/terrain-grass-1.png?url';
import terrainGrass2 from './pixel/terrain-grass-2.png?url';
import terrainGrass3 from './pixel/terrain-grass-3.png?url';
import terrainMountain from './pixel/terrain-mountain.png?url';
import terrainMountainAi1 from './pixel/terrain-mountain-ai-1.png?url';
import terrainMountainAi2 from './pixel/terrain-mountain-ai-2.png?url';
import terrainRoadCurve from './pixel/terrain-road-curve.png?url';
import terrainRoadEnd from './pixel/terrain-road-end.png?url';
import terrainRoadHorizontal from './pixel/terrain-road-horizontal.png?url';
import terrainRoadVertical from './pixel/terrain-road-vertical.png?url';
import terrainShoreline from './pixel/terrain-shoreline.png?url';
import terrainTree from './pixel/terrain-tree.png?url';
import terrainTreeAi1 from './pixel/terrain-tree-ai-1.png?url';
import terrainTreeAi2 from './pixel/terrain-tree-ai-2.png?url';
import terrainWater from './pixel/terrain-water.png?url';
import terrainWaterAi1 from './pixel/terrain-water-ai-1.png?url';
import terrainWaterAi2 from './pixel/terrain-water-ai-2.png?url';
import villageLarge from './pixel/village-large.png?url';
import villageSmall from './pixel/village-small.png?url';
import licensedAssetManifestData from './licensedAssetManifest.json';
import licensedPlayer from './vendor/python-monsters/graphics/characters/player.png?url';
import licensedPixeloidSans from './vendor/python-monsters/graphics/fonts/PixeloidSans.ttf?url';
import licensedGreenTree from './vendor/python-monsters/graphics/objects/green_tree.png?url';

export type LicensedAssetMetadata =
  | { key: string; source: string; type: 'image' }
  | { key: string; source: string; type: 'spritesheet'; frameHeight: number; frameWidth: number }
  | {
      key: string;
      source: string;
      type: 'font';
      family: string;
      format: 'truetype' | 'opentype';
      style: string;
      version: string;
      weight: string;
    };

export const monsterRpgLicensedAssetMetadata = licensedAssetManifestData as readonly LicensedAssetMetadata[];

export const monsterRpgAssetKeys = {
  villageSmall: 'monster-rpg.village.small',
  villageLarge: 'monster-rpg.village.large',
  buildingClinic: 'monster-rpg.building.clinic',
  buildingHouse: 'monster-rpg.building.house',
  buildingPostOffice: 'monster-rpg.building.post-office',
  buildingShop: 'monster-rpg.building.shop',
  buildingTavern: 'monster-rpg.building.tavern',
  buildingTownHall: 'monster-rpg.building.town-hall',
  creatureEncounters: 'monster-rpg.creature.encounters',
  licensedCharacterPlayer: 'monster-rpg.licensed.character.player',
  licensedEnvironmentGreenTree: 'monster-rpg.licensed.environment.green-tree',
  licensedFontPixeloidSans: 'monster-rpg.licensed.font.pixeloid-sans',
  markerDoor: 'monster-rpg.marker.door',
  markerSign: 'monster-rpg.marker.sign',
  terrainBridgeWater: 'monster-rpg.terrain.bridge-water',
  terrainField: 'monster-rpg.terrain.field',
  terrainFieldAi1: 'monster-rpg.terrain.field-ai-1',
  terrainFieldAi2: 'monster-rpg.terrain.field-ai-2',
  terrainFieldAi3: 'monster-rpg.terrain.field-ai-3',
  terrainForest: 'monster-rpg.terrain.forest',
  terrainForestAi1: 'monster-rpg.terrain.forest-ai-1',
  terrainForestAi2: 'monster-rpg.terrain.forest-ai-2',
  terrainForestAi3: 'monster-rpg.terrain.forest-ai-3',
  terrainGrass1: 'monster-rpg.terrain.grass-1',
  terrainGrass2: 'monster-rpg.terrain.grass-2',
  terrainGrass3: 'monster-rpg.terrain.grass-3',
  terrainMountain: 'monster-rpg.terrain.mountain',
  terrainMountainAi1: 'monster-rpg.terrain.mountain-ai-1',
  terrainMountainAi2: 'monster-rpg.terrain.mountain-ai-2',
  terrainRoadCurve: 'monster-rpg.terrain.road-curve',
  terrainRoadEnd: 'monster-rpg.terrain.road-end',
  terrainRoadHorizontal: 'monster-rpg.terrain.road-horizontal',
  terrainRoadVertical: 'monster-rpg.terrain.road-vertical',
  terrainShoreline: 'monster-rpg.terrain.shoreline',
  terrainTree: 'monster-rpg.terrain.tree',
  terrainTreeAi1: 'monster-rpg.terrain.tree-ai-1',
  terrainTreeAi2: 'monster-rpg.terrain.tree-ai-2',
  terrainWater: 'monster-rpg.terrain.water',
  terrainWaterAi1: 'monster-rpg.terrain.water-ai-1',
  terrainWaterAi2: 'monster-rpg.terrain.water-ai-2'
} as const;

export type MonsterRpgAssetKey = (typeof monsterRpgAssetKeys)[keyof typeof monsterRpgAssetKeys];

function getLicensedAssetMetadata<T extends LicensedAssetMetadata['type']>(
  key: MonsterRpgAssetKey,
  type: T
): Extract<LicensedAssetMetadata, { type: T }> {
  const asset = monsterRpgLicensedAssetMetadata.find((entry) => entry.key === key);
  if (!asset || asset.type !== type) throw new Error(`Missing ${type} metadata for ${key}`);
  return asset as Extract<LicensedAssetMetadata, { type: T }>;
}

const licensedPlayerMetadata = getLicensedAssetMetadata(monsterRpgAssetKeys.licensedCharacterPlayer, 'spritesheet');
const licensedFontMetadata = getLicensedAssetMetadata(monsterRpgAssetKeys.licensedFontPixeloidSans, 'font');

export const monsterRpgAssetManifest: ReadonlyArray<{ key: MonsterRpgAssetKey; src: string }> = [
  { key: monsterRpgAssetKeys.licensedEnvironmentGreenTree, src: licensedGreenTree },
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
  { key: monsterRpgAssetKeys.terrainBridgeWater, src: terrainBridgeWater },
  { key: monsterRpgAssetKeys.terrainField, src: terrainField },
  { key: monsterRpgAssetKeys.terrainFieldAi1, src: terrainFieldAi1 },
  { key: monsterRpgAssetKeys.terrainFieldAi2, src: terrainFieldAi2 },
  { key: monsterRpgAssetKeys.terrainFieldAi3, src: terrainFieldAi3 },
  { key: monsterRpgAssetKeys.terrainForest, src: terrainForest },
  { key: monsterRpgAssetKeys.terrainForestAi1, src: terrainForestAi1 },
  { key: monsterRpgAssetKeys.terrainForestAi2, src: terrainForestAi2 },
  { key: monsterRpgAssetKeys.terrainForestAi3, src: terrainForestAi3 },
  { key: monsterRpgAssetKeys.terrainGrass1, src: terrainGrass1 },
  { key: monsterRpgAssetKeys.terrainGrass2, src: terrainGrass2 },
  { key: monsterRpgAssetKeys.terrainGrass3, src: terrainGrass3 },
  { key: monsterRpgAssetKeys.terrainMountain, src: terrainMountain },
  { key: monsterRpgAssetKeys.terrainMountainAi1, src: terrainMountainAi1 },
  { key: monsterRpgAssetKeys.terrainMountainAi2, src: terrainMountainAi2 },
  { key: monsterRpgAssetKeys.terrainRoadCurve, src: terrainRoadCurve },
  { key: monsterRpgAssetKeys.terrainRoadEnd, src: terrainRoadEnd },
  { key: monsterRpgAssetKeys.terrainRoadHorizontal, src: terrainRoadHorizontal },
  { key: monsterRpgAssetKeys.terrainRoadVertical, src: terrainRoadVertical },
  { key: monsterRpgAssetKeys.terrainShoreline, src: terrainShoreline },
  { key: monsterRpgAssetKeys.terrainTree, src: terrainTree },
  { key: monsterRpgAssetKeys.terrainTreeAi1, src: terrainTreeAi1 },
  { key: monsterRpgAssetKeys.terrainTreeAi2, src: terrainTreeAi2 },
  { key: monsterRpgAssetKeys.terrainWater, src: terrainWater },
  { key: monsterRpgAssetKeys.terrainWaterAi1, src: terrainWaterAi1 },
  { key: monsterRpgAssetKeys.terrainWaterAi2, src: terrainWaterAi2 }
];

export const monsterRpgSpriteSheetManifest: ReadonlyArray<{
  key: MonsterRpgAssetKey;
  src: string;
  frameHeight: number;
  frameWidth: number;
}> = [
  {
    key: monsterRpgAssetKeys.creatureEncounters,
    src: creatureEncounters,
    frameHeight: 64,
    frameWidth: 64
  },
  {
    key: monsterRpgAssetKeys.licensedCharacterPlayer,
    src: licensedPlayer,
    frameHeight: licensedPlayerMetadata.frameHeight,
    frameWidth: licensedPlayerMetadata.frameWidth
  }
];

export const monsterRpgFontManifest: ReadonlyArray<{
  family: string;
  format: 'truetype' | 'opentype';
  key: MonsterRpgAssetKey;
  src: string;
  style: string;
  version: string;
  weight: string;
}> = [
  {
    family: licensedFontMetadata.family,
    format: licensedFontMetadata.format,
    key: monsterRpgAssetKeys.licensedFontPixeloidSans,
    src: licensedPixeloidSans,
    style: licensedFontMetadata.style,
    version: licensedFontMetadata.version,
    weight: licensedFontMetadata.weight
  }
];

let fontLoadPromise: Promise<void> | undefined;

export function loadMonsterRpgFonts(): Promise<void> {
  if (fontLoadPromise) return fontLoadPromise;

  fontLoadPromise = Promise.all(
    monsterRpgFontManifest.map(async (asset) => {
      const face = new FontFace(asset.family, `url("${asset.src}") format("${asset.format}")`, {
        style: asset.style,
        weight: asset.weight
      });
      document.fonts.add(await face.load());
    })
  ).then(() => undefined);

  return fontLoadPromise;
}

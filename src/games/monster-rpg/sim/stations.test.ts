import { describe, expect, test } from 'vitest';
import { createInitialSave, createPlayerProfile, importSavePayload } from './saveState';
import {
  STATION_TRAVEL_BASE_COST,
  confirmStationTravel,
  discoverPlayerVillageForStation,
  getPlayerVillageStationDestinationId,
  getStationDestinations,
  getStationTravelCost,
  quoteStationTravel
} from './stations';

describe('Monster RPG station travel', () => {
  test('new saves start with the home village discovered as a station destination', () => {
    const save = createInitialSave(createPlayerProfile('Mira', 'scout'));
    const homeDestinationId = getPlayerVillageStationDestinationId('home-village');

    expect(save.station.discoveredDestinations[homeDestinationId]).toMatchObject({
      kind: 'player-village',
      mapId: 'home-village',
      displayName: 'Home Village',
      level: 1,
      ownerPlayerId: save.profile.playerId
    });
    expect(getStationDestinations(save)).toHaveLength(1);
  });

  test('discovering another player village adds a travel destination without duplicating it', () => {
    const save = createInitialSave(createPlayerProfile('Sol', 'ranger'));
    const discovered = discoverPlayerVillageForStation(save, 'brookhaven-village');
    const discoveredAgain = discoverPlayerVillageForStation(discovered, 'brookhaven-village');
    const destinationId = getPlayerVillageStationDestinationId('brookhaven-village');

    expect(discovered.station.discoveredDestinations[destinationId]).toMatchObject({
      kind: 'player-village',
      mapId: 'brookhaven-village',
      displayName: 'Brookhaven'
    });
    expect(discovered.village.discoveredVillageIds).toContain('brookhaven-village');
    expect(getStationDestinations(discoveredAgain).filter((destination) => destination.id === destinationId)).toHaveLength(1);
  });

  test('travel cost is reversed so higher-level context pays more to lower-level targets', () => {
    expect(getStationTravelCost(6, 2)).toBe(STATION_TRAVEL_BASE_COST + 12);
    expect(getStationTravelCost(2, 6)).toBe(STATION_TRAVEL_BASE_COST);
  });

  test('confirming station travel spends Magic Dust and moves to a safe destination spawn', () => {
    const save = discoverPlayerVillageForStation(createInitialSave(createPlayerProfile('Vera', 'keeper')), 'brookhaven-village');
    const destinationId = getPlayerVillageStationDestinationId('brookhaven-village');
    const fundedSave = {
      ...save,
      inventory: {
        ...save.inventory,
        currencies: { ...save.inventory.currencies, magicDust: 12 }
      }
    };
    const quote = quoteStationTravel(fundedSave, destinationId);
    const result = confirmStationTravel(fundedSave, destinationId);

    expect(quote.ok).toBe(true);
    expect(result.ok).toBe(true);
    if (!result.ok || !quote.ok) return;
    expect(result.costPaid).toBe(quote.cost);
    expect(result.state.inventory.currencies.magicDust).toBe(12 - quote.cost);
    expect(result.state.mapId).toBe('brookhaven-village');
    expect(result.state.position).toEqual(result.destination.spawn);
  });

  test('station travel refuses missing Magic Dust before moving', () => {
    const save = discoverPlayerVillageForStation(createInitialSave(createPlayerProfile('Jun', 'scout')), 'brookhaven-village');
    const destinationId = getPlayerVillageStationDestinationId('brookhaven-village');
    const result = confirmStationTravel(save, destinationId);

    expect(result).toMatchObject({
      ok: false,
      reason: 'missing-magic-dust',
      state: save
    });
  });

  test('save import accepts future city destinations with reputation and guard hooks', () => {
    const save = createInitialSave(createPlayerProfile('Paz', 'ranger'));
    const payload = JSON.stringify({
      ...save,
      station: {
        ...save.station,
        discoveredDestinations: {
          ...save.station.discoveredDestinations,
          'city:glass-harbor': {
            id: 'city:glass-harbor',
            kind: 'city',
            mapId: 'world-map',
            displayName: 'Glass Harbor',
            level: 8,
            spawn: { mapId: 'world-map', x: 20, y: 50, facing: 'south' },
            futureHooks: {
              reputationKey: 'city:glass-harbor:reputation',
              guardPolicyKey: 'city:glass-harbor:guards',
              banFlagKey: 'city:glass-harbor:banned'
            }
          }
        }
      }
    });

    expect(importSavePayload(payload).ok).toBe(true);
  });
});

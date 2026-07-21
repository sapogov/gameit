import { generatedTracerMapSet } from './generatedMapArtifact';
import { loadMapSet } from './generatedMapSchema';

const trainerArtifact = {
  ...generatedTracerMapSet,
  maps: generatedTracerMapSet.maps.map((map) => map.id === 'tracer-world-route' ? {
    ...map,
    objects: [...map.objects, {
      kind: 'trainer' as const, id: 'route-scout-trainer', trainerId: 'route-scout-1',
      trainerDefinitionId: 'route-scout-1', mode: 'optional' as const,
      geometry: { kind: 'rect' as const, x: 768, y: 960, width: 64, height: 64 }
    }]
  } : map)
};

const loaded = loadMapSet(trainerArtifact);
if (!loaded.ok) throw new Error(`Invalid generated map artifact:\n${loaded.diagnostics.join('\n')}`);

export { trainerArtifact as generatedTracerMapSet };
export const generatedMapRegistry = loaded.registry;

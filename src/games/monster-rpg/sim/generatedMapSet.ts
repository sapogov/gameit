import { generatedTracerMapSet } from './generatedMapArtifact';
import { loadMapSet } from './generatedMapSchema';

const loaded = loadMapSet(generatedTracerMapSet);
if (!loaded.ok) throw new Error(`Invalid generated map artifact:\n${loaded.diagnostics.join('\n')}`);

export { generatedTracerMapSet };
export const generatedMapRegistry = loaded.registry;

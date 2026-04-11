import { registerPlugin } from '@capacitor/core';
import type { MoonshinePlugin } from './definitions';

// only native platforms supported
const Moonshine = registerPlugin<MoonshinePlugin>('Moonshine');

export * from './definitions';
export { Moonshine };

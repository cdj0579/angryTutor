import { registerPlugin } from '@capacitor/core';
const Moonshine = registerPlugin('Moonshine', {
    web: () => import('./web').then(m => new m.MoonshineWeb()),
});
export * from './definitions';
export { Moonshine };

import { WebPlugin } from '@capacitor/core';
export class MoonshineWeb extends WebPlugin {
    constructor() {
        super({ name: 'Moonshine' });
    }
    async startTranscription(options) {
        console.warn('Moonshine plugin running in web fallback; no native STT available.');
        // could forward to backend or use existing Whisper endpoint
        return;
    }
    async stopTranscription() {
        console.warn('Moonshine plugin running in web fallback; nothing to stop.');
        return;
    }
    addListener(eventName, listenerFunc) {
        console.warn('Moonshine web plugin cannot emit transcription events.');
        const handle = {
            remove: async () => { }
        };
        const p = Promise.resolve(handle);
        // ensure the promise object itself also has a remove method
        p.remove = handle.remove;
        return p;
    }
}

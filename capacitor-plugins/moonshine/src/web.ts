import { WebPlugin, PluginListenerHandle } from '@capacitor/core';
import type { MoonshinePlugin, TranscriptionOptions, TranscriptionResult } from './definitions';

export class MoonshineWeb extends WebPlugin implements MoonshinePlugin {
  constructor() {
    super({ name: 'Moonshine' });
  }

  async startTranscription(options: TranscriptionOptions): Promise<void> {
    console.warn('Moonshine plugin running in web fallback; no native STT available.');
    // could forward to backend or use existing Whisper endpoint
    return;
  }

  async stopTranscription(): Promise<void> {
    console.warn('Moonshine plugin running in web fallback; nothing to stop.');
    return;
  }

  addListener(
    eventName: 'transcription',
    listenerFunc: (result: TranscriptionResult) => void
  ): Promise<PluginListenerHandle> & PluginListenerHandle {
    console.warn('Moonshine web plugin cannot emit transcription events.');
    const handle: PluginListenerHandle = {
      remove: async () => {}
    };
    const p = Promise.resolve(handle) as Promise<PluginListenerHandle> & PluginListenerHandle;
    // ensure the promise object itself also has a remove method
    (p as any).remove = handle.remove;
    return p;
  }
}

import { WebPlugin, PluginListenerHandle } from '@capacitor/core';
import type { MoonshinePlugin, TranscriptionOptions, TranscriptionResult } from './definitions';
export declare class MoonshineWeb extends WebPlugin implements MoonshinePlugin {
    constructor();
    startTranscription(options: TranscriptionOptions): Promise<void>;
    stopTranscription(): Promise<void>;
    addListener(eventName: 'transcription', listenerFunc: (result: TranscriptionResult) => void): Promise<PluginListenerHandle> & PluginListenerHandle;
}

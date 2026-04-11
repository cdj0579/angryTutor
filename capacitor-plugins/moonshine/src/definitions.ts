import { PluginListenerHandle } from '@capacitor/core';

export interface TranscriptionOptions {
  modelPath: string;
  language?: string;
}

export interface TranscriptionResult {
  text: string;
  isFinal: boolean;
}

export interface MoonshinePlugin {
  startTranscription(options: TranscriptionOptions): Promise<void>;
  stopTranscription(): Promise<void>;
  addListener(
    eventName: 'transcription',
    listenerFunc: (result: TranscriptionResult) => void
  ): Promise<PluginListenerHandle>;
}

import { Moonshine } from 'moonshine-plugin';
import type { TranscriptionResult } from 'moonshine-plugin';

export function initMoonshine(modelPath: string, language = 'en') {
  Moonshine.addListener('transcription', (res: TranscriptionResult) => {
    console.log('[Moonshine] transcription', res.text, res.isFinal);
    // you can route this to your app store, events, etc.
  });

  return Moonshine.startTranscription({ modelPath, language });
}

export function stopMoonshine() {
  return Moonshine.stopTranscription();
}

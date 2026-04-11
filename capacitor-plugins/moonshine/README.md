# Moonshine Capacitor Plugin

This plugin wraps the Moonshine Voice SDK for iOS and Android and exposes a
simple transcription interface to Capacitor apps. It also provides a web
fallback that currently does nothing (you can forward transcription to your
backend if desired).

## Installation

1. Build the plugin first (in the plugin directory):
   ```bash
   cd capacitor-plugins/moonshine
   npm install
   npm run build
   ```
2. Copy or install the plugin into your app (you can also publish it to an
   internal npm registry):
   ```bash
   cd ../../
   npm install ../capacitor-plugins/moonshine
   npx cap sync
   ```
3. For iOS, open `ios/App/App.xcworkspace` and add the `moonshine-swift`
  Swift package (URL: `https://github.com/moonshine-ai/moonshine-swift/`) or add
  the `.xcodeproj` if you built it locally.
4. For Android, add the Maven dependency in `android/app/build.gradle`:
   ```gradle
   dependencies {
       implementation 'ai.moonshine:moonshine-voice:0.0.49'
   }
   ```
   and sync your project.


## Usage (TypeScript)

```ts
import { Moonshine } from 'moonshine-plugin';

// register for events
Moonshine.addListener('transcription', (res) => {
  console.log('text', res.text, 'final?', res.isFinal);
});

// start/stop
await Moonshine.startTranscription({ modelPath: '/path/to/model', language: 'en' });
// ...later
await Moonshine.stopTranscription();
```

## Notes

* The native code stubs (`TODO`) must be replaced with actual calls to the
  Moonshine SDK; refer to the Moonshine documentation for model initialization,
  streaming audio, and event callbacks.
* You may need to request microphone permission on each platform before
  starting.
* The web implementation simply logs a warning; you could forward to your
  existing `/api/transcribe` endpoint instead.

## Bundling models into mobile apps

1. Download Moonshine models using the upstream downloader or your preferred method. Place the downloaded model folder somewhere in your machine (e.g. `~/Downloads/moonshine-model`).
2. From the plugin folder run the helper script to copy model files into native asset locations:

```bash
cd capacitor-plugins/moonshine
./scripts/copy-models.sh /path/to/moonshine-model
```

This script will copy into:

- Android: `android/app/src/main/assets/moonshine-model`
- iOS (public web assets): `ios/App/App/public/assets/moonshine-model` (you may also add the model folder to Xcode resources for direct bundle inclusion)

3. Update the model path you pass from the app (see `src/services/speechRecognitionService.ts`). Use the bundle-relative path `assets/moonshine-model` or an absolute filesystem path if you included the files differently.

4. Add the Moonshine native SDK to the platform projects:

- iOS: add Swift package `https://github.com/moonshine-ai/moonshine-swift/` in Xcode.
- Android: add `implementation 'ai.moonshine:moonshine-voice:0.0.49'` to your app `build.gradle` and sync.

After doing the above, rebuild the native projects in Xcode/Android Studio so the models and SDK are packaged into the app.

---

This plugin is MIT licensed. The Moonshine models are under their respective
licenses (the non-English models use the Moonshine Community License).

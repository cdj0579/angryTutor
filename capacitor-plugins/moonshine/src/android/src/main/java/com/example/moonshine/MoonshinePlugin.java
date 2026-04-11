package com.example.moonshine;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.PluginMethod;
import com.getcapacitor.JSObject;

@CapacitorPlugin(name = "Moonshine")
public class MoonshinePlugin extends Plugin {
    // Placeholder for native transcriber instance
    // private Transcriber transcriber = null;

    @PluginMethod
    public void startTranscription(PluginCall call) {
        String modelPath = call.getString("modelPath");
        String language = call.getString("language", "en");

        getLog().info("startTranscription modelPath=" + modelPath + " language=" + language);

        // TODO: integrate Moonshine Android SDK here. Example pseudo-code:
        // try {
        //   transcriber = new Transcriber(modelPath, /*arch*/);
        //   transcriber.addListener(new TranscriberListener() {
        //     @Override
        //     public void onLineCompleted(String text) {
        //       emitTranscription(text, true);
        //     }
        //     @Override
        //     public void onLineUpdated(String interim) {
        //       emitTranscription(interim, false);
        //     }
        //   });
        //   transcriber.start();
        //   call.resolve();
        // } catch (Exception e) {
        //   call.reject("start failed: " + e.getMessage());
        // }

        // For now resolve so JS can continue; replace with real startup above.
        call.resolve();
    }

    @PluginMethod
    public void stopTranscription(PluginCall call) {
        getLog().info("stopTranscription called");
        // TODO: stop the transcriber
        // if (transcriber != null) { transcriber.stop(); transcriber = null; }
        call.resolve();
    }

    // helper to emit transcription events back to JavaScript
    private void emitTranscription(String text, boolean isFinal) {
        JSObject data = new JSObject();
        data.put("text", text);
        data.put("isFinal", isFinal);
        notifyListeners("transcription", data);
    }
}

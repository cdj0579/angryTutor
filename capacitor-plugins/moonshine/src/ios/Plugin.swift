import Foundation
import Capacitor

// If you add Moonshine Swift package, import it here, for example:
// import MoonshineVoice

@objc(Moonshine)
public class Moonshine: CAPPlugin {

    // Placeholder for a native transcriber instance
    // private var transcriber: MoonshineTranscriber? = nil

    @objc func startTranscription(_ call: CAPPluginCall) {
        let modelPath = call.getString("modelPath") ?? ""
        let language = call.getString("language") ?? "en"

        // Initialize and start the Moonshine transcriber.
        // Replace the commented code below with the actual Moonshine SDK calls.
        DispatchQueue.global(qos: .userInitiated).async {
            do {
                // Example (pseudo-code):
                // let t = try MoonshineTranscriber(modelPath: modelPath, language: language)
                // self.transcriber = t
                // t.addListener { event in
                //   self.notifyListeners("transcription", data: ["text": event.text, "isFinal": event.isFinal])
                // }
                // t.start()

                // For now just log and resolve so JS side can continue to run while you integrate SDK.
                print("[Moonshine iOS] startTranscription modelPath=\(modelPath) language=\(language)")
                call.resolve()
            } catch {
                print("[Moonshine iOS] start error: \(error)")
                call.reject("start failed: \(error)")
            }
        }
    }

    @objc func stopTranscription(_ call: CAPPluginCall) {
        // Stop the transcriber and cleanup
        DispatchQueue.global(qos: .background).async {
            // Example (pseudo-code):
            // self.transcriber?.stop()
            // self.transcriber = nil
            print("[Moonshine iOS] stopTranscription called")
            call.resolve()
        }
    }

    // You can call this from native callbacks to send transcription back to JS
    func emitTranscription(text: String, isFinal: Bool) {
        notifyListeners("transcription", data: ["text": text, "isFinal": isFinal])
    }
}

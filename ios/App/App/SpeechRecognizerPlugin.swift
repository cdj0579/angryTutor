import Foundation
import Speech
import AVFoundation
import Capacitor

/// Native iOS speech recognition plugin using SFSpeechRecognizer.
/// Bridges Apple's on-device speech recognition to the JS layer via Capacitor.
@objc(SpeechRecognizerPlugin)
public class SpeechRecognizerPlugin: CAPPlugin, CAPBridgedPlugin {

    public let identifier = "SpeechRecognizerPlugin"
    public let jsName = "SpeechRecognizer"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "startListening", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stopListening", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "isAvailable", returnType: CAPPluginReturnPromise),
    ]

    private let speechRecognizer = SFSpeechRecognizer(locale: Locale(identifier: "en-US"))
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private var recognitionTask: SFSpeechRecognitionTask?
    private let audioEngine = AVAudioEngine()

    // MARK: - Plugin Methods

    /// Check if speech recognition is available on this device
    @objc func isAvailable(_ call: CAPPluginCall) {
        SFSpeechRecognizer.requestAuthorization { status in
            DispatchQueue.main.async {
                let available = status == .authorized && (self.speechRecognizer?.isAvailable ?? false)
                call.resolve(["available": available, "status": status.rawValue])
            }
        }
    }

    /// Start listening — streams interim/final transcription events to JS
    @objc func startListening(_ call: CAPPluginCall) {
        // Request permissions first
        SFSpeechRecognizer.requestAuthorization { [weak self] authStatus in
            guard let self = self else { return }

            DispatchQueue.main.async {
                switch authStatus {
                case .authorized:
                    self.doStartListening(call)
                case .denied:
                    call.resolve(["error": "Speech recognition permission denied. Go to Settings > Privacy > Speech Recognition to enable."])
                case .restricted:
                    call.resolve(["error": "Speech recognition is restricted on this device."])
                case .notDetermined:
                    call.resolve(["error": "Speech recognition permission not determined."])
                @unknown default:
                    call.resolve(["error": "Unknown speech recognition authorization status."])
                }
            }
        }
    }

    /// Stop listening and return the final transcript
    @objc func stopListening(_ call: CAPPluginCall) {
        print("[SpeechRecognizer] stopListening called")
        if audioEngine.isRunning {
            audioEngine.stop()
            recognitionRequest?.endAudio()
        }
        // The recognitionTask completion handler will fire and send the final result.
        // Return immediately so JS isn't blocked.
        call.resolve(["stopped": true])
    }

    // MARK: - Internal

    private func doStartListening(_ call: CAPPluginCall) {
        // Cancel any ongoing task
        recognitionTask?.cancel()
        recognitionTask = nil
        recognitionRequest = nil

        guard let speechRecognizer = speechRecognizer, speechRecognizer.isAvailable else {
            call.resolve(["error": "Speech recognizer is not available."])
            return
        }

        // Configure audio session
        let audioSession = AVAudioSession.sharedInstance()
        do {
            try audioSession.setCategory(.record, mode: .measurement, options: .duckOthers)
            try audioSession.setActive(true, options: .notifyOthersOnDeactivation)
        } catch {
            call.resolve(["error": "Audio session setup failed: \(error.localizedDescription)"])
            return
        }

        let request = SFSpeechAudioBufferRecognitionRequest()
        request.shouldReportPartialResults = true

        // Use on-device recognition if available (iOS 13+)
        if #available(iOS 13, *) {
            if speechRecognizer.supportsOnDeviceRecognition {
                request.requiresOnDeviceRecognition = true
                print("[SpeechRecognizer] Using on-device recognition")
            } else {
                print("[SpeechRecognizer] On-device not available, using server")
            }
        }

        self.recognitionRequest = request

        recognitionTask = speechRecognizer.recognitionTask(with: request) { [weak self] result, error in
            guard let self = self else { return }

            if let result = result {
                let text = result.bestTranscription.formattedString
                let isFinal = result.isFinal
                print("[SpeechRecognizer] transcript: \(text) isFinal: \(isFinal)")

                self.notifyListeners("transcription", data: [
                    "text": text,
                    "isFinal": isFinal
                ])
            }

            if error != nil || (result?.isFinal ?? false) {
                self.audioEngine.stop()
                self.audioEngine.inputNode.removeTap(onBus: 0)
                self.recognitionRequest = nil
                self.recognitionTask = nil

                if let error = error {
                    let nsError = error as NSError
                    // Code 216 = "kAFAssistantErrorDomain" recognition cancelled — not a real error
                    if nsError.code != 216 {
                        print("[SpeechRecognizer] error: \(error.localizedDescription)")
                        self.notifyListeners("error", data: ["message": error.localizedDescription])
                    }
                }

                self.notifyListeners("end", data: [:])
            }
        }

        // Install audio tap
        let inputNode = audioEngine.inputNode
        let recordingFormat = inputNode.outputFormat(forBus: 0)
        inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { buffer, _ in
            request.append(buffer)
        }

        audioEngine.prepare()
        do {
            try audioEngine.start()
            print("[SpeechRecognizer] Audio engine started, listening...")
            call.resolve(["listening": true])
        } catch {
            call.resolve(["error": "Audio engine failed to start: \(error.localizedDescription)"])
        }
    }
}

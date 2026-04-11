import Foundation
import AVFoundation
import Capacitor

/// Native iOS TTS plugin using AVSpeechSynthesizer with Premium/Enhanced voices.
/// Provides high-quality, human-like speech synthesis entirely on-device.
@objc(NativeTtsPlugin)
public class NativeTtsPlugin: CAPPlugin, CAPBridgedPlugin {

    public let identifier = "NativeTtsPlugin"
    public let jsName = "NativeTts"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "speak", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stop", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getVoices", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "isAvailable", returnType: CAPPluginReturnPromise),
    ]

    private let synthesizer = AVSpeechSynthesizer()
    private var currentCall: CAPPluginCall?
    private var delegateHandler: TtsDelegateHandler?

    override public func load() {
        delegateHandler = TtsDelegateHandler(plugin: self)
        synthesizer.delegate = delegateHandler
        // Log all available English voices at startup for debugging
        logAvailableVoices()
    }

    private func logAvailableVoices() {
        let englishVoices = AVSpeechSynthesisVoice.speechVoices()
            .filter { $0.language.starts(with: "en") }
            .sorted { $0.quality.rawValue > $1.quality.rawValue }
        print("[NativeTts] === Available English voices ===")
        for v in englishVoices {
            let qualityName: String
            switch v.quality {
            case .premium:  qualityName = "PREMIUM"
            case .enhanced: qualityName = "ENHANCED"
            default:        qualityName = "default"
            }
            print("[NativeTts]   \(v.name) (\(v.language)) quality=\(qualityName)(\(v.quality.rawValue)) id=\(v.identifier)")
        }
        if englishVoices.allSatisfy({ $0.quality == .default }) {
            print("[NativeTts] ⚠️ No Enhanced/Premium voices found!")
            print("[NativeTts] ⚠️ To get human-like voices, go to:")
            print("[NativeTts] ⚠️ iOS Settings > Accessibility > Spoken Content > Voices > English")
            print("[NativeTts] ⚠️ Then download a Premium or Enhanced voice (e.g. Samantha Enhanced)")
        }
        print("[NativeTts] ================================")
    }

    // MARK: - Plugin Methods

    @objc func isAvailable(_ call: CAPPluginCall) {
        call.resolve(["available": true])
    }

    /// Return list of available voices, prioritising Premium/Enhanced ones.
    @objc func getVoices(_ call: CAPPluginCall) {
        let lang = call.getString("lang", "en")
        let voices = AVSpeechSynthesisVoice.speechVoices()
            .filter { $0.language.starts(with: lang) }
            .map { voice -> [String: Any] in
                return [
                    "id": voice.identifier,
                    "name": voice.name,
                    "language": voice.language,
                    "quality": voice.quality.rawValue  // 1=default, 2=enhanced, 3=premium
                ]
            }
            .sorted { ($0["quality"] as? Int ?? 0) > ($1["quality"] as? Int ?? 0) }

        call.resolve(["voices": voices])
    }

    /// Speak the given text using the best available voice.
    @objc func speak(_ call: CAPPluginCall) {
        let rawText = call.getString("text", "")
        guard !rawText.isEmpty else {
            call.resolve(["error": "Missing 'text' parameter"])
            return
        }

        // Sanitize text: strip HTML/SSML tags and control characters to prevent iOS SSML parse errors
        let text = sanitizeText(rawText)
        guard !text.isEmpty else {
            call.resolve(["error": "Text is empty after sanitization"])
            return
        }

        // Stop any current speech
        if synthesizer.isSpeaking {
            synthesizer.stopSpeaking(at: .immediate)
        }

        // Configure audio session for playback
        // Use .playAndRecord to avoid conflicts with speech recognition session
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.playback, mode: .spokenAudio, options: [.duckOthers, .mixWithOthers])
            try session.setActive(true, options: [])
        } catch {
            print("[NativeTts] Audio session error: \(error)")
        }

        // Pick the voice FIRST, then create utterance
        let lang = call.getString("lang", "en-US")
        let requestedVoiceId = call.getString("voiceId", "")

        var selectedVoice: AVSpeechSynthesisVoice?
        if !requestedVoiceId.isEmpty {
            selectedVoice = AVSpeechSynthesisVoice(identifier: requestedVoiceId)
            if selectedVoice != nil {
                print("[NativeTts] Using requested voice: \(selectedVoice!.name) quality=\(selectedVoice!.quality.rawValue)")
            } else {
                print("[NativeTts] ⚠️ Requested voice ID not found: \(requestedVoiceId), falling back to best")
            }
        }
        if selectedVoice == nil {
            selectedVoice = bestVoice(for: lang)
        }

        let utterance = AVSpeechUtterance(string: text)
        utterance.voice = selectedVoice
        utterance.rate = AVSpeechUtteranceDefaultSpeechRate * Float(call.getDouble("rate", 0.92))
        utterance.pitchMultiplier = Float(call.getDouble("pitch", 1.0))
        utterance.volume = Float(call.getDouble("volume", 1.0))
        // Pre-fill audio buffers for smoother playback
        utterance.prefersAssistiveTechnologySettings = false

        print("[NativeTts] Speaking: \"\(text.prefix(60))\" voice=\(utterance.voice?.name ?? "nil") quality=\(utterance.voice?.quality.rawValue ?? -1) rate=\(utterance.rate)")

        currentCall = call
        synthesizer.speak(utterance)
    }

    /// Remove HTML/SSML tags and problematic characters
    private func sanitizeText(_ text: String) -> String {
        // Strip any XML/HTML/SSML tags
        var clean = text.replacingOccurrences(of: "<[^>]+>", with: " ", options: .regularExpression)
        // Replace multiple whitespace with single space
        clean = clean.replacingOccurrences(of: "\\s+", with: " ", options: .regularExpression)
        // Trim leading/trailing whitespace
        clean = clean.trimmingCharacters(in: .whitespacesAndNewlines)
        return clean
    }

    /// Stop speaking immediately.
    @objc func stop(_ call: CAPPluginCall) {
        if synthesizer.isSpeaking {
            synthesizer.stopSpeaking(at: .immediate)
        }
        call.resolve()
    }

    // MARK: - Voice Selection

    /// Select the highest-quality voice for the given language.
    /// Directly tries known Enhanced/Premium voice identifiers first, then falls back.
    private func bestVoice(for lang: String) -> AVSpeechSynthesisVoice? {
        // 1st: Directly try known high-quality voice identifiers (most reliable)
        let preferredIds = [
            "com.apple.voice.premium.en-US.Zoe",
            "com.apple.voice.premium.en-US.Ava",
            "com.apple.voice.enhanced.en-US.Allison",
            "com.apple.voice.enhanced.en-US.Evan",
            "com.apple.voice.enhanced.en-US.Nathan",
            "com.apple.voice.enhanced.en-US.Samantha",
            "com.apple.voice.enhanced.en-GB.Daniel",
            "com.apple.voice.enhanced.en-AU.Karen",
        ]

        for id in preferredIds {
            if let voice = AVSpeechSynthesisVoice(identifier: id) {
                print("[NativeTts] ✅ Selected preferred voice by ID: \(voice.name) quality=\(voice.quality.rawValue) id=\(id)")
                return voice
            }
        }

        // 2nd: Scan all voices for any Enhanced/Premium quality
        let langPrefix = String(lang.prefix(2)).lowercased()
        let allCandidates = AVSpeechSynthesisVoice.speechVoices()
            .filter { $0.language.lowercased().starts(with: langPrefix) }
            .sorted { $0.quality.rawValue > $1.quality.rawValue }

        if let best = allCandidates.first, best.quality != .default {
            print("[NativeTts] ✅ Selected high-quality voice by scan: \(best.name) (\(best.language)) quality=\(best.quality.rawValue)")
            return best
        }

        // 3rd: Fall back to default voice for the exact locale
        let exactDefault = allCandidates.first { $0.language.lowercased() == lang.lowercased() }
        if let voice = exactDefault {
            print("[NativeTts] ⚠️ Using default-quality voice: \(voice.name) — download Enhanced voices in iOS Settings for better quality")
            return voice
        }

        // 4th: Any voice for this language
        let fallback = allCandidates.first
        print("[NativeTts] ⚠️ Using fallback voice: \(fallback?.name ?? "nil")")
        return fallback
    }

    // MARK: - Delegate callbacks (called by TtsDelegateHandler)

    func didFinishSpeaking() {
        currentCall?.resolve(["done": true])
        currentCall = nil
    }

    func didCancelSpeaking() {
        currentCall?.resolve(["done": false, "cancelled": true])
        currentCall = nil
    }
}

// MARK: - AVSpeechSynthesizerDelegate

private class TtsDelegateHandler: NSObject, AVSpeechSynthesizerDelegate {
    weak var plugin: NativeTtsPlugin?

    init(plugin: NativeTtsPlugin) {
        self.plugin = plugin
    }

    func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer,
                           didFinish utterance: AVSpeechUtterance) {
        plugin?.didFinishSpeaking()
    }

    func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer,
                           didCancel utterance: AVSpeechUtterance) {
        plugin?.didCancelSpeaking()
    }
}

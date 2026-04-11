/**
 * Speech Recognition Service
 *
 * On iOS native:  Uses SpeechRecognizerPlugin (SFSpeechRecognizer via Capacitor).
 * In browser:     Falls back to Web Speech API.
 * Everywhere:     Users can always type their answer manually.
 */

import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core'

export interface SpeechRecognitionResult {
  finalTranscript: string
  interimTranscript: string
  isFinal: boolean
  confidence: number
}

export let moonshineModelPath = 'assets/moonshine-model'
export function setMoonshineModelPath(path: string) {
  moonshineModelPath = path
}

// ---------- Native plugin interface ----------
interface SpeechRecognizerPlugin {
  isAvailable(): Promise<{ available: boolean; status: number }>
  startListening(): Promise<{ listening: boolean }>
  stopListening(): Promise<{ stopped: boolean }>
  addListener(event: 'transcription', fn: (data: { text: string; isFinal: boolean }) => void): Promise<PluginListenerHandle>
  addListener(event: 'error', fn: (data: { message: string }) => void): Promise<PluginListenerHandle>
  addListener(event: 'end', fn: (data: Record<string, never>) => void): Promise<PluginListenerHandle>
}

let nativePlugin: SpeechRecognizerPlugin | null = null
try {
  if (Capacitor.isNativePlatform()) {
    nativePlugin = registerPlugin<SpeechRecognizerPlugin>('SpeechRecognizer')
  }
} catch (e) {
  console.warn('[STT] Failed to register native plugin:', e)
}

// ---------- Service ----------

class SpeechRecognitionService {
  private isListening = false
  private finalTranscript = ''
  private interimTranscript = ''
  private webRecognition: any | null = null
  private safetyTimer: ReturnType<typeof setTimeout> | null = null
  private nativeListeners: PluginListenerHandle[] = []

  // ---------- Detection ----------

  private isNativeAvailable(): boolean {
    return Capacitor.isNativePlatform() && nativePlugin !== null
  }

  private isWebSpeechAvailable(): boolean {
    return typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  }

  public isSpeechEngineAvailable(): boolean {
    return this.isNativeAvailable() || this.isWebSpeechAvailable()
  }

  /** Always true — users can type even without speech engine */
  public isSupported(): boolean {
    return true
  }

  // ---------- Native SFSpeechRecognizer ----------

  private async startNative(
    onResult: (result: SpeechRecognitionResult) => void,
    onError: (error: string) => void,
    onEnd: () => void
  ) {
    if (!nativePlugin) {
      onError('Native speech plugin not available')
      onEnd()
      return
    }

    try {
      // Clean up any previous listeners
      await this.removeNativeListeners()

      const transcriptionListener = await nativePlugin.addListener('transcription', (data) => {
        console.log('[STT native] transcription:', data.text, 'isFinal:', data.isFinal)
        this.clearSafetyTimer()

        if (data.isFinal) {
          this.finalTranscript = data.text
        } else {
          this.interimTranscript = data.text
        }

        onResult({
          finalTranscript: data.isFinal ? data.text : this.finalTranscript,
          interimTranscript: data.isFinal ? '' : data.text,
          isFinal: data.isFinal,
          confidence: 0.9,
        })
      })

      const errorListener = await nativePlugin.addListener('error', (data) => {
        console.warn('[STT native] error:', data.message)
        this.clearSafetyTimer()
        onError(data.message)
      })

      const endListener = await nativePlugin.addListener('end', () => {
        console.log('[STT native] ended')
        this.clearSafetyTimer()
        this.isListening = false
        onEnd()
      })

      this.nativeListeners = [transcriptionListener, errorListener, endListener]

      console.log('[STT] Calling native startListening...')
      const result = await nativePlugin.startListening() as any
      if (result?.error) {
        throw new Error(result.error)
      }
      console.log('[STT] Native listening started')
    } catch (err: any) {
      console.error('[STT native] start error:', err)
      onError(err?.message || 'Failed to start speech recognition')
      onEnd()
    }
  }

  private async stopNative(): Promise<void> {
    if (nativePlugin) {
      try {
        await nativePlugin.stopListening()
      } catch { /* ignore */ }
    }
    await this.removeNativeListeners()
  }

  private async removeNativeListeners() {
    for (const l of this.nativeListeners) {
      try { await l.remove() } catch { /* ignore */ }
    }
    this.nativeListeners = []
  }

  // ---------- Web Speech API (browser fallback) ----------

  private startWeb(
    onResult: (result: SpeechRecognitionResult) => void,
    onError: (error: string) => void,
    onEnd: () => void
  ) {
    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognitionCtor) {
      onError('Speech recognition not available. Please type your answer.')
      onEnd()
      return
    }

    try {
      const recognition = new SpeechRecognitionCtor()
      recognition.lang = 'en-US'
      recognition.continuous = true
      recognition.interimResults = true

      recognition.onresult = (event: any) => {
        this.clearSafetyTimer()
        let interim = ''
        let finalPart = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalPart += transcript
          } else {
            interim += transcript
          }
        }
        if (finalPart) this.finalTranscript += finalPart
        this.interimTranscript = interim

        onResult({
          finalTranscript: this.finalTranscript,
          interimTranscript: interim,
          isFinal: !!finalPart,
          confidence: event.results[event.results.length - 1]?.[0]?.confidence ?? 0.8,
        })
      }

      recognition.onerror = (event: any) => {
        this.clearSafetyTimer()
        if (event.error !== 'aborted') {
          onError(`Speech error: ${event.error}. Try typing your answer.`)
        }
      }

      recognition.onend = () => {
        this.clearSafetyTimer()
        this.isListening = false
        onEnd()
      }

      recognition.start()
      console.log('[STT] Web Speech API started')
      this.webRecognition = recognition
    } catch (err: any) {
      onError(`Could not start speech recognition: ${err?.message}`)
      onEnd()
    }
  }

  private stopWeb(): void {
    if (this.webRecognition) {
      try { this.webRecognition.stop() } catch { /* ignore */ }
      this.webRecognition = null
    }
  }

  // ---------- Public API ----------

  public startListening(
    onResult: (result: SpeechRecognitionResult) => void,
    onError: (error: string) => void,
    onEnd: () => void
  ): void {
    this.finalTranscript = ''
    this.interimTranscript = ''
    this.isListening = true

    // 15s safety timeout
    this.safetyTimer = setTimeout(() => {
      if (this.isListening) {
        console.warn('[STT] Safety timeout — no results after 15s')
        onError('No speech detected. Please try again or type your answer.')
        this.stopListening()
        onEnd()
      }
    }, 15000)

    if (this.isNativeAvailable()) {
      console.log('[STT] Using native SFSpeechRecognizer')
      this.startNative(onResult, onError, onEnd)
    } else if (this.isWebSpeechAvailable()) {
      console.log('[STT] Using Web Speech API')
      this.startWeb(onResult, onError, onEnd)
    } else {
      this.clearSafetyTimer()
      onError('Speech recognition not available. Please type your answer below.')
      onEnd()
    }
  }

  public stopListening(): string {
    this.isListening = false
    this.clearSafetyTimer()

    if (this.isNativeAvailable()) {
      this.stopNative()
    } else {
      this.stopWeb()
    }

    const result = this.finalTranscript.trim() || this.interimTranscript.trim()
    console.log('[STT] stopListening result:', JSON.stringify(result))
    return result
  }

  public abortListening(): void {
    this.clearSafetyTimer()
    if (this.isListening) {
      this.stopListening()
    }
    this.isListening = false
    this.finalTranscript = ''
    this.interimTranscript = ''
  }

  public getIsListening(): boolean {
    return this.isListening
  }

  private clearSafetyTimer(): void {
    if (this.safetyTimer) {
      clearTimeout(this.safetyTimer)
      this.safetyTimer = null
    }
  }
}

export const speechRecognitionService = new SpeechRecognitionService()

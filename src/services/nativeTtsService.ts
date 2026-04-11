/**
 * Native TTS Service
 *
 * On iOS native:  Uses NativeTtsPlugin (AVSpeechSynthesizer Premium voices via Capacitor).
 * In browser:     Falls back to Web Speech API (speechSynthesis).
 *
 * Provides human-like voice output with automatic best-voice selection.
 */

import { Capacitor, registerPlugin } from '@capacitor/core'

// ---------- Native plugin interface ----------

interface NativeTtsPluginInterface {
  speak(options: {
    text: string
    lang?: string
    rate?: number
    pitch?: number
    volume?: number
    voiceId?: string
  }): Promise<{ done: boolean; cancelled?: boolean; error?: string }>
  stop(): Promise<void>
  getVoices(options?: { lang?: string }): Promise<{
    voices: Array<{
      id: string
      name: string
      language: string
      quality: number
    }>
  }>
  isAvailable(): Promise<{ available: boolean }>
}

// Always register the plugin proxy — this is safe on all platforms.
// Capacitor will route to native on iOS or reject on web.
const nativeTts = registerPlugin<NativeTtsPluginInterface>('NativeTts')

// ---------- Service ----------

class NativeTtsService {
  private isSpeakingNow = false
  private nativeConfirmed: boolean | null = null // cached after first check

  /** Check if any TTS engine is available */
  isAvailable(): boolean {
    return true // web speech is always available as fallback
  }

  /**
   * Detect native platform at CALL TIME (not import time).
   * Cache result after first successful native call.
   */
  private isNativeAvailable(): boolean {
    if (this.nativeConfirmed === false) return false
    return Capacitor.isNativePlatform()
  }

  private isWebSpeechAvailable(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window
  }

  /** Speak text using the best available engine */
  async speak(
    text: string,
    options: {
      lang?: string
      rate?: number    // 0.5 – 2.0, default ~0.92
      pitch?: number   // 0.5 – 2.0, default 1.0
      volume?: number  // 0 – 1.0, default 1.0
      voiceId?: string // specific voice identifier (iOS only)
      onStart?: () => void
      onEnd?: () => void
      onError?: (error: Error) => void
    } = {}
  ): Promise<void> {
    if (!text.trim()) return

    this.stop()
    options.onStart?.()
    this.isSpeakingNow = true

    try {
      if (this.isNativeAvailable()) {
        try {
          console.log('[TTS] Attempting NATIVE iOS TTS engine...')
          await this.speakNative(text, options)
          this.nativeConfirmed = true
          console.log('[TTS] Native TTS completed successfully')
          options.onEnd?.()
          return
        } catch (nativeErr) {
          console.warn('[TTS] Native TTS failed, falling back to Web Speech:', nativeErr)
          this.nativeConfirmed = false
        }
      }

      if (this.isWebSpeechAvailable()) {
        console.log('[TTS] Using WEB Speech API fallback')
        await this.speakWeb(text, options)
      } else {
        throw new Error('No TTS engine available')
      }
      options.onEnd?.()
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      options.onError?.(error)
      throw error
    } finally {
      this.isSpeakingNow = false
    }
  }

  /** Stop any current speech */
  stop(): void {
    this.isSpeakingNow = false
    try { nativeTts.stop().catch(() => {}) } catch (_) { /* ignore */ }
    if (this.isWebSpeechAvailable()) {
      window.speechSynthesis.cancel()
    }
  }

  /** Check if currently speaking */
  get isSpeaking(): boolean {
    return this.isSpeakingNow
  }

  /** Get available voices (iOS native only, returns [] on web) */
  async getVoices(lang = 'en'): Promise<Array<{ id: string; name: string; language: string; quality: number }>> {
    if (this.isNativeAvailable()) {
      try {
        const result = await nativeTts.getVoices({ lang })
        return result.voices
      } catch (_) {
        return []
      }
    }
    return []
  }

  // ---------- Native iOS ----------

  private async speakNative(text: string, options: {
    lang?: string; rate?: number; pitch?: number; volume?: number; voiceId?: string
  }): Promise<void> {
    const result = await nativeTts.speak({
      text,
      lang: options.lang ?? 'en-US',
      rate: options.rate ?? 0.92,
      pitch: options.pitch ?? 1.0,
      volume: options.volume ?? 1.0,
      voiceId: options.voiceId,
    })
    if (result.error) {
      throw new Error(result.error)
    }
  }

  // ---------- Web fallback ----------

  private speakWeb(text: string, options: {
    lang?: string; rate?: number; pitch?: number; volume?: number
  }): Promise<void> {
    return new Promise((resolve, reject) => {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = options.lang ?? 'en-US'
      utterance.rate = options.rate ?? 0.9
      utterance.pitch = options.pitch ?? 1.0
      utterance.volume = options.volume ?? 1.0
      utterance.onend = () => resolve()
      utterance.onerror = (event) => reject(new Error(`Web TTS error: ${event.error}`))
      window.speechSynthesis.speak(utterance)
    })
  }
}

/** Singleton instance */
export const nativeTtsService = new NativeTtsService()
export default nativeTtsService

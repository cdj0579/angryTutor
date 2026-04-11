<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Settings</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="setting-content">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Settings</ion-title>
        </ion-toolbar>
      </ion-header>

      <div class="settings-container">
        <div class="section">
          <div class="section-header">
            <span class="section-icon">🔊</span>
            <h2>Voice Settings</h2>
          </div>
          <p class="section-desc">Choose a voice for the tutor to speak with</p>

          <div v-if="selectedVoiceName" class="current-voice">
            <span class="label">Current voice:</span>
            <span class="value">{{ selectedVoiceName }}</span>
          </div>

          <ion-button @click="loadVoices" expand="block" color="primary" class="load-btn">
            {{ voiceList.length > 0 ? 'Refresh Voices' : 'Load Available Voices' }}
          </ion-button>

          <div v-if="loading" class="loading-text">Loading voices...</div>

          <div v-if="voiceList.length > 0" class="voice-list">
            <div
              v-for="voice in voiceList"
              :key="voice.id"
              class="voice-item"
              :class="{ selected: voice.id === selectedVoiceId, enhanced: voice.quality >= 2 }"
              @click="selectVoice(voice)"
            >
              <div class="voice-info-row">
                <div class="voice-name">
                  {{ voice.name }}
                  <span v-if="voice.quality >= 3" class="quality-badge premium">Premium</span>
                  <span v-else-if="voice.quality >= 2" class="quality-badge enhanced-badge">Enhanced</span>
                  <span v-else class="quality-badge default">Basic</span>
                </div>
                <div class="voice-lang">{{ voice.language }}</div>
              </div>
              <div class="voice-actions">
                <button class="preview-btn" @click.stop="previewVoice(voice)">▶ Preview</button>
                <span v-if="voice.id === selectedVoiceId" class="check-mark">✓</span>
              </div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-header">
            <span class="section-icon">ℹ️</span>
            <h2>About</h2>
          </div>
          <p class="about-text">AngryTutor v1.0 — Practice English in real-world scenarios.</p>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButton } from '@ionic/vue'
import { nativeTtsService } from '../services/nativeTtsService'

const voiceList = ref<Array<{ id: string; name: string; language: string; quality: number }>>([])
const selectedVoiceId = ref(localStorage.getItem('tts-voice-id') || '')
const selectedVoiceName = ref(localStorage.getItem('tts-voice-name') || '')
const loading = ref(false)

const loadVoices = async () => {
  loading.value = true
  try {
    const voices = await nativeTtsService.getVoices('en')
    voiceList.value = voices.sort((a, b) => {
      if (a.quality !== b.quality) return b.quality - a.quality
      return a.name.localeCompare(b.name)
    })
  } catch (e) {
    console.warn('[TTS] Failed to load voices:', e)
  } finally {
    loading.value = false
  }
}

const selectVoice = (voice: { id: string; name: string; language: string; quality: number }) => {
  selectedVoiceId.value = voice.id
  selectedVoiceName.value = voice.name
  localStorage.setItem('tts-voice-id', voice.id)
  localStorage.setItem('tts-voice-name', voice.name)
}

const previewVoice = (voice: { id: string; name: string }) => {
  nativeTtsService.speak('Hello, I am your English tutor. Let us practice together!', {
    lang: 'en-US',
    rate: 0.92,
    voiceId: voice.id,
  }).catch(() => {})
}
</script>

<style scoped>
.settings-container {
  padding: 16px;
  max-width: 600px;
  margin: 0 auto;
}

.section {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}

.section-icon {
  font-size: 24px;
}

.section-header h2 {
  margin: 0;
  font-size: 18px;
  color: #333;
  font-weight: 700;
}

.section-desc {
  color: #888;
  font-size: 14px;
  margin: 0 0 16px;
}

.current-voice {
  background: #f0f4ff;
  padding: 10px 14px;
  border-radius: 10px;
  margin-bottom: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.current-voice .label {
  color: #666;
  font-size: 13px;
}

.current-voice .value {
  color: #667eea;
  font-weight: 600;
  font-size: 14px;
}

.load-btn {
  margin-bottom: 12px;
}

.loading-text {
  text-align: center;
  color: #999;
  padding: 20px 0;
}

.voice-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.voice-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  border-radius: 10px;
  background: #f8f9fa;
  cursor: pointer;
  transition: all 0.15s;
  border: 2px solid transparent;
}

.voice-item:active {
  transform: scale(0.98);
}

.voice-item.selected {
  border-color: #667eea;
  background: #eef0ff;
}

.voice-item.enhanced {
  background: #f0faf5;
}

.voice-item.enhanced.selected {
  background: #e0f5ec;
  border-color: #4caf50;
}

.voice-info-row {
  flex: 1;
}

.voice-name {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.voice-lang {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.quality-badge {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.quality-badge.premium {
  background: #fff3e0;
  color: #e65100;
}

.quality-badge.enhanced-badge {
  background: #e8f5e9;
  color: #2e7d32;
}

.quality-badge.default {
  background: #f5f5f5;
  color: #999;
}

.voice-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.preview-btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.preview-btn:active {
  background: #5568d3;
}

.check-mark {
  font-size: 20px;
  color: #4caf50;
  font-weight: bold;
}

.about-text {
  color: #888;
  font-size: 14px;
  margin: 8px 0 0;
}
</style>

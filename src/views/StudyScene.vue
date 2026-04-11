<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/study" />
        </ion-buttons>
        <ion-title>{{ sceneConfig?.name || 'Study' }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div class="study-container">
        <!-- Progress -->
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
        <div class="progress-text">{{ currentIndex + 1 }} / {{ studyLines.length }}</div>

        <!-- Conversation History -->
        <div class="conversation" ref="conversationRef">
          <div
            v-for="(line, idx) in visibleLines"
            :key="line.id"
            class="chat-bubble"
            :class="[
              idx % 2 === 0 ? 'speaker-a' : 'speaker-b',
              { active: idx === currentIndex }
            ]"
          >
            <div class="bubble-header">
              <span class="speaker-name">{{ line.speaker }}</span>
            </div>
            <div class="bubble-text">{{ line.text }}</div>
            <div class="bubble-translation">{{ line.translation }}</div>

            <!-- Keywords -->
            <div v-if="line.keywords.length > 0 && idx === currentIndex" class="keywords-section">
              <div class="section-label">Key Words</div>
              <div class="keyword-chips">
                <div v-for="kw in line.keywords" :key="kw.word" class="keyword-chip">
                  <span class="kw-word">{{ kw.word }}</span>
                  <span class="kw-meaning">{{ kw.meaning }}</span>
                </div>
              </div>
            </div>

            <!-- Grammar Note -->
            <div v-if="line.grammarNote && idx === currentIndex" class="grammar-section">
              <div class="section-label">Grammar</div>
              <div class="grammar-text">{{ line.grammarNote }}</div>
            </div>
          </div>
        </div>

        <!-- Controls -->
        <div class="controls">
          <ion-button
            @click="replayAudio"
            fill="outline"
            color="medium"
            size="default"
            :disabled="isSpeaking"
          >
            🔊 Replay
          </ion-button>

          <ion-button
            v-if="currentIndex < studyLines.length - 1"
            @click="nextLine"
            color="primary"
            size="large"
            expand="block"
            class="next-btn"
          >
            Next →
          </ion-button>

          <ion-button
            v-else
            @click="finishStudy"
            color="success"
            size="large"
            expand="block"
            class="next-btn"
          >
            Finish
          </ion-button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButton, IonButtons, IonBackButton } from '@ionic/vue'
import { getSceneConfig, getStudyLinesForScene, type StudyLine } from '../services/gameService'
import { nativeTtsService } from '../services/nativeTtsService'

const route = useRoute()
const router = useRouter()
const sceneId = route.params.sceneId as string
const sceneConfig = getSceneConfig(sceneId)
const studyLines = getStudyLinesForScene(sceneId)

const currentIndex = ref(0)
const isSpeaking = ref(false)
const conversationRef = ref<HTMLElement | null>(null)

const selectedVoiceId = localStorage.getItem('tts-voice-id') || ''

const visibleLines = computed<StudyLine[]>(() => studyLines.slice(0, currentIndex.value + 1))
const progressPercent = computed(() => ((currentIndex.value + 1) / studyLines.length) * 100)

const speakText = async (text: string) => {
  isSpeaking.value = true
  const opts: { lang: string; rate: number; voiceId?: string } = { lang: 'en-US', rate: 0.85 }
  if (selectedVoiceId) opts.voiceId = selectedVoiceId
  try {
    await nativeTtsService.speak(text, opts)
  } catch {
    // ignore
  } finally {
    isSpeaking.value = false
  }
}

const scrollToBottom = async () => {
  await nextTick()
  if (conversationRef.value) {
    conversationRef.value.scrollTop = conversationRef.value.scrollHeight
  }
}

const replayAudio = () => {
  speakText(studyLines[currentIndex.value].text)
}

const nextLine = () => {
  if (currentIndex.value < studyLines.length - 1) {
    currentIndex.value++
    scrollToBottom()
    speakText(studyLines[currentIndex.value].text)
  }
}

const finishStudy = () => {
  router.replace('/tabs/study')
}

onMounted(() => {
  setTimeout(() => speakText(studyLines[0].text), 400)
})

onUnmounted(() => {
  nativeTtsService.stop()
})
</script>

<style scoped>
.study-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 10px;
}

.progress-bar {
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 4px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 3px;
  transition: width 0.4s;
}

.progress-text {
  font-size: 12px;
  color: #999;
  text-align: center;
  margin-bottom: 10px;
  font-weight: 600;
}

.conversation {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 4px 2px 10px;
}

.chat-bubble {
  max-width: 88%;
  padding: 14px;
  border-radius: 16px;
  transition: all 0.3s;
}

.chat-bubble.speaker-a {
  align-self: flex-start;
  background: #f0f4ff;
  border-bottom-left-radius: 4px;
}

.chat-bubble.speaker-b {
  align-self: flex-end;
  background: #f0fdf4;
  border-bottom-right-radius: 4px;
}

.chat-bubble.active {
  box-shadow: 0 2px 12px rgba(102, 126, 234, 0.2);
}

.chat-bubble.active.speaker-a {
  border: 2px solid #667eea;
}

.chat-bubble.active.speaker-b {
  border: 2px solid #10b981;
}

.bubble-header {
  margin-bottom: 6px;
}

.speaker-name {
  font-size: 12px;
  font-weight: 700;
  color: #667eea;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.speaker-b .speaker-name {
  color: #10b981;
}

.bubble-text {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  line-height: 1.5;
  margin-bottom: 4px;
}

.bubble-translation {
  font-size: 13px;
  color: #888;
  line-height: 1.4;
}

.keywords-section,
.grammar-section {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed #ddd;
}

.section-label {
  font-size: 11px;
  font-weight: 700;
  color: #667eea;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 6px;
}

.keyword-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.keyword-chip {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 4px 10px;
  display: flex;
  gap: 6px;
  align-items: baseline;
}

.kw-word {
  font-weight: 700;
  color: #667eea;
  font-size: 13px;
}

.kw-meaning {
  font-size: 12px;
  color: #888;
}

.grammar-text {
  font-size: 13px;
  color: #555;
  line-height: 1.5;
  background: #fefce8;
  padding: 8px 12px;
  border-radius: 8px;
  border-left: 3px solid #eab308;
}

.controls {
  padding: 12px 0;
  display: flex;
  gap: 10px;
  align-items: center;
  border-top: 1px solid #f0f0f0;
}

.next-btn {
  flex: 1;
}
</style>

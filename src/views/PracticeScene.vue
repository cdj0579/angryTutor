<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/practice" />
        </ion-buttons>
        <ion-title>{{ sceneConfig?.name || 'Practice' }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <!-- Menu / Start Screen -->
      <div v-if="gameState.gameStatus === 'menu'" class="menu-container">
        <div class="menu-content">
          <div class="scene-hero">
            <span class="hero-icon">{{ sceneConfig?.icon }}</span>
            <h1>{{ sceneConfig?.name }}</h1>
            <p>{{ sceneConfig?.description }}</p>
            <div class="role-badge">Speaking with: {{ sceneConfig?.role }}</div>
          </div>

          <div class="menu-buttons">
            <ion-button @click="startGame" color="primary" size="large" expand="block">
              Start Practice
            </ion-button>
            <p class="instructions">
              Press and hold the mic button to record your answer.<br>
              Release to get scored on correctness, fluency, and pronunciation.
            </p>
          </div>
        </div>
      </div>

      <!-- Game Screen -->
      <div v-if="gameState.gameStatus === 'playing'" class="game-container">
        <div v-if="showNurseOverlay" class="nurse-score-overlay" @click="showNurseOverlay = false">
          <div class="overlay-content">
            <img :src="nurseOverlayImage" alt="score reaction" class="nurse-score-image" />
            <div v-if="currentScoreRecord" class="overlay-feedback">
              <div class="overlay-score" :class="currentScoreLevel">
                {{ currentScoreRecord.totalScore }} / 100
              </div>
              <div v-if="currentScoreRecord.feedback" class="overlay-feedback-text">
                {{ currentScoreRecord.feedback }}
              </div>
              <div v-if="currentScoreRecord.correction" class="overlay-suggestion">
                <span class="suggestion-label">Suggested:</span>
                {{ currentScoreRecord.correction }}
              </div>
              <div class="overlay-tap-hint">tap to dismiss</div>
            </div>
          </div>
        </div>

        <div class="game-header">
          <div class="score-display">Score: {{ gameState.score }}</div>
          <div class="role-display">{{ sceneConfig?.role }}</div>
          <div class="progress-display">{{ gameState.currentDialogIndex + 1 }}/{{ dialogs.length }}</div>
        </div>

        <div class="dialog-container">
          <div class="question-box" @click="readQuestion">
            <div class="question-row">
              <p class="question-text">{{ currentDialog.question }}</p>
              <button v-if="!answered" class="shuffle-btn" :disabled="isGeneratingQuestion" @click.stop="shuffleQuestion" title="Generate new question">
                <span v-if="isGeneratingQuestion" class="shuffle-spinner"></span>
                <span v-else>🔀</span>
              </button>
            </div>
            <span class="tap-hint">tap to listen</span>
          </div>

          <!-- Recording Area -->
          <div v-if="!answered" class="recording-status">
            <div
              class="mic-button"
              :class="{ recording: isRecording, processing: isProcessing }"
              @mousedown.prevent="startRecording"
              @touchstart.prevent="startRecording"
              @mouseup.prevent="stopRecording"
              @touchend.prevent="stopRecording"
              @mouseleave="stopRecording"
              @touchcancel.prevent="stopRecording"
            >
              <div class="mic-icon">🎤</div>
              <div v-if="isRecording" class="recording-indicator">
                <span></span><span></span><span></span>
              </div>
            </div>

            <div v-if="interimTranscript" class="interim-text">{{ interimTranscript }}</div>
            <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
          </div>

          <!-- Result -->
          <div v-if="answered && currentScoreRecord" class="result-display">
            <div class="transcription">
              <div class="label">Your answer:</div>
              <div class="text">{{ finalTranscript }}</div>
            </div>

            <div class="score-breakdown">
              <div class="score-item" v-for="item in scoreItems" :key="item.name">
                <span class="score-name">{{ item.name }}</span>
                <div class="score-bar">
                  <div class="score-fill" :style="{ width: item.value + '%' }"></div>
                </div>
                <span class="score-value">{{ item.value }}</span>
              </div>
            </div>

            <div class="feedback-box" :class="currentScoreLevel">
              {{ currentScoreRecord.feedback }}
            </div>

            <div class="action-buttons">
              <ion-button @click="retryAnswer" color="warning" expand="block">
                Try Again
              </ion-button>
              <ion-button
                v-if="gameState.currentDialogIndex < dialogs.length - 1"
                @click="nextDialog"
                color="primary"
                expand="block"
              >
                Next Question
              </ion-button>
              <ion-button v-else @click="finishGame" color="success" expand="block">
                See Results
              </ion-button>
            </div>
          </div>
        </div>
      </div>

      <!-- Result Screen -->
      <div v-if="gameState.gameStatus === 'finished'" class="result-container">
        <div class="result-content">
          <div class="result-icon">{{ gameResult.passed ? '🎉' : '💪' }}</div>
          <div class="result-message" :class="{ passed: gameResult.passed }">
            {{ gameResult.message }}
          </div>

          <div class="result-stats">
            <div class="stat-item">
              <span class="stat-label">Score</span>
              <span class="stat-value">{{ gameState.score }} / {{ dialogs.length * 10 }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Questions</span>
              <span class="stat-value">{{ gameState.userAnswers.length }} / {{ dialogs.length }}</span>
            </div>
          </div>

          <div class="result-review">
            <div v-for="(answer, idx) in gameState.userAnswers" :key="answer.dialogId" class="review-item">
              <div class="review-header" :class="answer.scoreLevel">
                <span>Q{{ idx + 1 }}: {{ answer.scoreLevel.toUpperCase() }}</span>
                <span>{{ answer.score }}/100</span>
              </div>
              <div class="review-answer">{{ answer.userAnswer }}</div>
            </div>
          </div>

          <div class="result-buttons">
            <ion-button @click="returnToMap" color="primary" size="large" expand="block">
              Back to Map
            </ion-button>
            <ion-button @click="playAgain" color="medium" expand="block">
              Play Again
            </ion-button>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButton, IonButtons, IonBackButton } from '@ionic/vue'
import {
  getSceneConfig,
  getDialogsForScene,
  createInitialGameState,
  calculateResult,
  getPointsForScore,
  type GameState,
  type DialogItem,
} from '../services/gameService'
import { speechRecognitionService, setMoonshineModelPath } from '../services/speechRecognitionService'
import { evaluateWithLLM, generateSpokenFeedback, generateNewQuestion, type LLMEvaluationResult } from '../services/llmService'
import { nativeTtsService } from '../services/nativeTtsService'
import { addRecord } from '../services/recordService'

const route = useRoute()
const router = useRouter()
const sceneId = route.params.sceneId as string
const sceneConfig = getSceneConfig(sceneId)
const originalDialogs = getDialogsForScene(sceneId)
const dialogs = ref([...originalDialogs])

const gameState = ref<GameState>(createInitialGameState(sceneId))
const answered = ref(false)
const isRecording = ref(false)
const isProcessing = ref(false)
const interimTranscript = ref('')
const finalTranscript = ref('')
const errorMessage = ref('')
const gameResult = ref({ passed: false, message: '' })
const currentScoreRecord = ref<LLMEvaluationResult | null>(null)
const currentScoreLevel = ref<'excellent' | 'good' | 'fair' | 'poor'>('good')
const showNurseOverlay = ref(false)
const nurseOverlayImage = ref('')
let processingAborted = false

const nurseImages = {
  veryHappy: new URL('../assets/images/nurse_very_happy.png', import.meta.url).href,
  happy: new URL('../assets/images/nurse_happy.png', import.meta.url).href,
  good: new URL('../assets/images/nurse_good.png', import.meta.url).href,
  slap: new URL('../assets/images/nurse_slap.png', import.meta.url).href,
  bigSlap: new URL('../assets/images/nurse_big_slap.png', import.meta.url).href,
  punch: new URL('../assets/images/nurse_punch.png', import.meta.url).href,
}

setMoonshineModelPath('assets/moonshine-model')

const isGeneratingQuestion = ref(false)
const currentDialog = computed<DialogItem>(() => dialogs.value[gameState.value.currentDialogIndex])

const scoreItems = computed(() => {
  if (!currentScoreRecord.value) return []
  return [
    { name: 'Correctness', value: currentScoreRecord.value.correctnessScore },
    { name: 'Fluency', value: currentScoreRecord.value.fluencyScore },
    { name: 'Pronunciation', value: currentScoreRecord.value.pronunciationScore },
  ]
})

const selectedVoiceId = localStorage.getItem('tts-voice-id') || ''

const speakText = (text: string) => {
  const opts: { lang: string; rate: number; voiceId?: string } = { lang: 'en-US', rate: 0.92 }
  if (selectedVoiceId) opts.voiceId = selectedVoiceId
  nativeTtsService.speak(text, opts).catch(() => {})
}

const readQuestion = () => speakText(currentDialog.value.question)

onUnmounted(() => {
  speechRecognitionService.abortListening()
  nativeTtsService.stop()
})

const startGame = () => {
  gameState.value = createInitialGameState(sceneId)
  gameState.value.gameStatus = 'playing'
  answered.value = false
  finalTranscript.value = ''
  errorMessage.value = ''
  setTimeout(readQuestion, 500)
}

const shuffleQuestion = async () => {
  if (answered.value || isGeneratingQuestion.value || isProcessing.value) return
  isGeneratingQuestion.value = true
  try {
    const usedQuestions = dialogs.value.map(d => d.question)
    const result = await generateNewQuestion(
      sceneConfig?.name || 'general',
      sceneConfig?.role || 'staff',
      usedQuestions
    )
    const newDialog: DialogItem = {
      id: `gen-${Date.now()}`,
      question: result.question,
      expectedAnswers: result.expectedAnswers,
      explanation: '',
    }
    const idx = gameState.value.currentDialogIndex
    dialogs.value[idx] = newDialog
    finalTranscript.value = ''
    interimTranscript.value = ''
    errorMessage.value = ''
    setTimeout(readQuestion, 200)
  } catch (err) {
    console.error('Failed to generate new question:', err)
    errorMessage.value = 'Failed to generate new question'
  } finally {
    isGeneratingQuestion.value = false
  }
}

const showNurseOverlayByAverage = (sr: LLMEvaluationResult) => {
  const avg = (sr.correctnessScore + sr.fluencyScore + sr.pronunciationScore) / 3
  if (avg >= 90) nurseOverlayImage.value = nurseImages.veryHappy
  else if (avg >= 80) nurseOverlayImage.value = nurseImages.happy
  else if (avg >= 70) nurseOverlayImage.value = nurseImages.good
  else if (avg >= 50) nurseOverlayImage.value = nurseImages.slap
  else if (avg >= 30) nurseOverlayImage.value = nurseImages.bigSlap
  else nurseOverlayImage.value = nurseImages.punch
  showNurseOverlay.value = true
}

const startRecording = () => {
  if (answered.value || isRecording.value || isProcessing.value) return
  errorMessage.value = ''
  finalTranscript.value = ''
  interimTranscript.value = ''
  isRecording.value = true

  speechRecognitionService.startListening(
    (result) => {
      interimTranscript.value = result.interimTranscript
      if (result.isFinal) finalTranscript.value = result.finalTranscript
    },
    (error) => { errorMessage.value = error; isRecording.value = false },
    () => { isRecording.value = false }
  )
}

const stopRecording = async () => {
  if (!isRecording.value) return
  isProcessing.value = true
  isRecording.value = false
  processingAborted = false

  const recordedText = speechRecognitionService.stopListening()
  finalTranscript.value = recordedText

  if (!recordedText.trim()) {
    errorMessage.value = 'No speech detected. Try again.'
    isProcessing.value = false
    return
  }
  await doEvaluation(recordedText)
}

const doEvaluation = async (userText: string) => {
  try {
    const sr = await evaluateWithLLM(
      currentDialog.value.question, userText, currentDialog.value.expectedAnswers,
      { sceneName: sceneConfig?.name, role: sceneConfig?.role }
    )
    if (processingAborted) return

    currentScoreRecord.value = sr
    currentScoreLevel.value = sr.level
    showNurseOverlayByAverage(sr)

    gameState.value.score += getPointsForScore(sr.level)
    gameState.value.userAnswers.push({
      dialogId: currentDialog.value.id,
      userAnswer: userText,
      score: sr.totalScore,
      scoreLevel: sr.level,
    })
    answered.value = true

    const spokenText = await generateSpokenFeedback(sr.feedback, sr.correction)
    speakText(spokenText)
  } catch (err: any) {
    if (!processingAborted) errorMessage.value = err?.message || 'Evaluation failed.'
  } finally {
    isProcessing.value = false
  }
}

const retryAnswer = () => {
  showNurseOverlay.value = false
  answered.value = false
  finalTranscript.value = ''
  interimTranscript.value = ''
  errorMessage.value = ''
  currentScoreRecord.value = null

  if (gameState.value.userAnswers.length > 0) {
    const last = gameState.value.userAnswers[gameState.value.userAnswers.length - 1]
    if (last.dialogId === currentDialog.value.id) {
      gameState.value.score -= getPointsForScore(last.scoreLevel)
      gameState.value.userAnswers.pop()
    }
  }
}

const nextDialog = () => {
  if (gameState.value.currentDialogIndex < dialogs.value.length - 1) {
    showNurseOverlay.value = false
    gameState.value.currentDialogIndex++
    answered.value = false
    finalTranscript.value = ''
    interimTranscript.value = ''
    errorMessage.value = ''
    currentScoreRecord.value = null
    setTimeout(readQuestion, 300)
  }
}

const finishGame = () => {
  gameState.value.gameStatus = 'finished'
  gameResult.value = calculateResult(gameState.value.score, dialogs.value.length)

  addRecord({
    sceneId,
    sceneName: sceneConfig?.name || sceneId,
    score: gameState.value.score,
    maxScore: dialogs.value.length * 10,
    answers: gameState.value.userAnswers.map(a => {
      const d = dialogs.value.find(d => d.id === a.dialogId)
      return { ...a, question: d?.question || '' }
    }),
  })
}

const returnToMap = () => router.replace('/tabs/practice')
const playAgain = () => {
  gameState.value = createInitialGameState(sceneId)
  answered.value = false
  finalTranscript.value = ''
  errorMessage.value = ''
}
</script>

<style scoped>
.menu-container {
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.menu-content {
  padding: 30px 20px;
  text-align: center;
  max-width: 400px;
  width: 100%;
}

.scene-hero {
  margin-bottom: 30px;
}

.hero-icon {
  font-size: 72px;
  display: block;
  margin-bottom: 12px;
}

.scene-hero h1 {
  font-size: 28px;
  color: #333;
  margin: 0 0 8px;
}

.scene-hero p {
  font-size: 15px;
  color: #888;
  margin: 0;
}

.role-badge {
  margin-top: 12px;
  display: inline-block;
  background: #f0f4ff;
  color: #667eea;
  font-size: 14px;
  font-weight: 600;
  padding: 6px 16px;
  border-radius: 20px;
  border: 1px solid #dbe4ff;
}

.menu-buttons {
  width: 100%;
}

.instructions {
  font-size: 13px;
  color: #999;
  line-height: 1.8;
  margin-top: 16px;
}

.game-container {
  padding: 10px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.nurse-score-overlay {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
  padding: 20px;
}

.overlay-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 360px;
  width: 100%;
}

.nurse-score-image {
  width: min(70vw, 320px);
  max-height: 50vh;
  object-fit: contain;
  border-radius: 12px;
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.28);
}

.overlay-feedback {
  margin-top: 14px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 14px;
  padding: 14px 18px;
  text-align: center;
  width: 100%;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.overlay-score {
  font-size: 28px;
  font-weight: 800;
  margin-bottom: 8px;
}

.overlay-score.excellent { color: #2e7d32; }
.overlay-score.good { color: #1565c0; }
.overlay-score.fair { color: #e65100; }
.overlay-score.poor { color: #c62828; }

.overlay-feedback-text {
  font-size: 14px;
  color: #444;
  line-height: 1.5;
  margin-bottom: 8px;
  font-style: italic;
}

.overlay-suggestion {
  font-size: 14px;
  color: #555;
  line-height: 1.5;
  background: #f0f4ff;
  padding: 8px 12px;
  border-radius: 8px;
  border-left: 3px solid #667eea;
  text-align: left;
}

.suggestion-label {
  font-weight: 700;
  color: #667eea;
  margin-right: 4px;
}

.overlay-tap-hint {
  margin-top: 10px;
  font-size: 11px;
  color: #aaa;
}

.role-display {
  font-size: 12px;
  opacity: 0.85;
}

.game-header {
  display: flex;
  justify-content: space-between;
  padding: 10px 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 10px;
  margin-bottom: 10px;
  font-weight: 700;
}

.dialog-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
}

.question-box {
  background: #f5f5f5;
  padding: 16px;
  border-radius: 10px;
  border-left: 4px solid #667eea;
  cursor: pointer;
}

.question-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.question-text {
  font-size: 18px;
  font-weight: 500;
  color: #333;
  margin: 0;
  line-height: 1.6;
  flex: 1;
}

.shuffle-btn {
  flex-shrink: 0;
  background: #667eea;
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(102, 126, 234, 0.3);
  transition: transform 0.15s;
}

.shuffle-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.shuffle-btn:active:not(:disabled) { transform: rotate(180deg) scale(0.9); }

.shuffle-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.tap-hint {
  font-size: 11px;
  color: #aaa;
  margin-top: 6px;
  display: block;
}

.recording-status {
  display: flex;
  flex-direction: column;
  gap: 15px;
  align-items: center;
  padding: 20px;
  flex: 1;
  justify-content: center;
}

.mic-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 130px;
  height: 130px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.mic-button:active:not(.processing) { transform: scale(0.95); }
.mic-button.recording {
  background: linear-gradient(135deg, #f44336, #e91e63);
  animation: pulse 0.6s infinite;
}
.mic-button.processing {
  background: linear-gradient(135deg, #ff9800, #f57c00);
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 4px 12px rgba(244, 67, 54, 0.4); }
  50% { box-shadow: 0 4px 20px rgba(244, 67, 54, 0.8); }
}

.mic-icon { font-size: 44px; }

.recording-indicator { display: flex; gap: 4px; }
.recording-indicator span {
  display: inline-block;
  width: 4px; height: 4px;
  border-radius: 50%;
  background: white;
  animation: bounce 1.4s infinite;
}
.recording-indicator span:nth-child(2) { animation-delay: 0.2s; }
.recording-indicator span:nth-child(3) { animation-delay: 0.4s; }

@keyframes bounce {
  0%, 80%, 100% { opacity: 0.5; transform: scaleY(0.8); }
  40% { opacity: 1; transform: scaleY(1.2); }
}

.interim-text {
  padding: 12px;
  background: #e3f2fd;
  border-left: 4px solid #2196f3;
  border-radius: 4px;
  color: #1565c0;
  font-size: 14px;
  max-width: 100%;
  word-break: break-word;
}

.error-message {
  padding: 12px;
  background: #ffebee;
  border-left: 4px solid #f44336;
  border-radius: 4px;
  color: #c62828;
  font-size: 14px;
}

.result-display {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 12px;
  flex: 1;
  overflow-y: auto;
}

.transcription {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 8px;
}
.transcription .label { font-size: 12px; font-weight: 700; color: #666; margin-bottom: 4px; }
.transcription .text { font-size: 15px; color: #333; font-style: italic; }

.score-breakdown { display: flex; flex-direction: column; gap: 10px; }
.score-item { display: flex; align-items: center; gap: 10px; }
.score-name { flex: 0 0 95px; font-size: 12px; font-weight: 700; color: #666; }
.score-bar { flex: 1; height: 18px; background: #e0e0e0; border-radius: 9px; overflow: hidden; }
.score-fill { height: 100%; background: linear-gradient(90deg, #4caf50, #8bc34a); transition: width 0.5s; }
.score-value { flex: 0 0 40px; text-align: right; font-size: 13px; font-weight: 700; color: #333; }

.feedback-box {
  padding: 14px;
  border-radius: 10px;
  border: 2px solid;
  text-align: center;
  font-weight: 600;
  font-size: 14px;
  line-height: 1.6;
}
.feedback-box.excellent { background: #e8f5e9; border-color: #4caf50; color: #2e7d32; }
.feedback-box.good { background: #e3f2fd; border-color: #2196f3; color: #1565c0; }
.feedback-box.fair { background: #fff3e0; border-color: #ff9800; color: #e65100; }
.feedback-box.poor { background: #ffebee; border-color: #f44336; color: #c62828; }

.action-buttons { display: flex; flex-direction: column; gap: 8px; }

.result-container { min-height: 100%; padding: 20px; }
.result-content { max-width: 500px; margin: 0 auto; display: flex; flex-direction: column; gap: 18px; }
.result-icon { font-size: 64px; text-align: center; }
.result-message {
  font-size: 17px;
  padding: 18px;
  border-radius: 12px;
  text-align: center;
  font-weight: 700;
  line-height: 1.6;
  background: #fff3e0;
  color: #e65100;
}
.result-message.passed { background: #e8f5e9; color: #2e7d32; }

.result-stats { display: flex; gap: 10px; }
.stat-item {
  flex: 1;
  padding: 14px;
  background: #f5f5f5;
  border-radius: 10px;
  text-align: center;
}
.stat-label { display: block; font-size: 12px; color: #888; font-weight: 600; }
.stat-value { display: block; font-size: 20px; font-weight: 800; color: #333; margin-top: 4px; }

.result-review { display: flex; flex-direction: column; gap: 8px; }
.review-item { background: #fafafa; border-radius: 8px; overflow: hidden; }
.review-header {
  padding: 8px 12px;
  font-weight: 700;
  font-size: 13px;
  display: flex;
  justify-content: space-between;
}
.review-header.excellent { background: #e8f5e9; color: #2e7d32; }
.review-header.good { background: #e3f2fd; color: #1565c0; }
.review-header.fair { background: #fff3e0; color: #e65100; }
.review-header.poor { background: #ffebee; color: #c62828; }
.review-answer { padding: 8px 12px; font-size: 13px; color: #888; font-style: italic; }

.result-buttons { display: flex; flex-direction: column; gap: 8px; margin-top: 8px; }
</style>

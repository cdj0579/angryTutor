<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>My Records</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">My Records</ion-title>
        </ion-toolbar>
      </ion-header>

      <div class="records-container">
        <div v-if="records.length === 0" class="empty-state">
          <div class="empty-icon">📝</div>
          <h3>No Records Yet</h3>
          <p>Complete a practice session to see your records here.</p>
        </div>

        <div v-else>
          <div class="stats-summary">
            <div class="stat-card">
              <div class="stat-number">{{ records.length }}</div>
              <div class="stat-label">Sessions</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">{{ averageScore }}%</div>
              <div class="stat-label">Avg Score</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">{{ bestScore }}%</div>
              <div class="stat-label">Best</div>
            </div>
          </div>

          <div class="record-list">
            <div
              v-for="record in records"
              :key="record.id"
              class="record-card"
              @click="toggleExpand(record.id)"
            >
              <div class="record-header">
                <div class="record-scene">
                  <span class="scene-icon">{{ getSceneIcon(record.sceneId) }}</span>
                  <span class="scene-name">{{ record.sceneName }}</span>
                </div>
                <div class="record-score" :class="getScoreClass(record.percentage)">
                  {{ record.percentage }}%
                </div>
              </div>
              <div class="record-date">{{ formatDate(record.date) }}</div>
              <div class="record-bar">
                <div
                  class="record-bar-fill"
                  :class="getScoreClass(record.percentage)"
                  :style="{ width: record.percentage + '%' }"
                ></div>
              </div>

              <div v-if="expandedId === record.id" class="record-detail">
                <div
                  v-for="(answer, idx) in record.answers"
                  :key="answer.dialogId"
                  class="detail-item"
                >
                  <div class="detail-header" :class="answer.scoreLevel">
                    <span>Q{{ idx + 1 }}: {{ answer.scoreLevel.toUpperCase() }}</span>
                    <span>{{ answer.score }}/100</span>
                  </div>
                  <div class="detail-question">{{ answer.question }}</div>
                  <div class="detail-answer">{{ answer.userAnswer }}</div>
                </div>
              </div>
            </div>
          </div>

          <ion-button @click="confirmClear" expand="block" color="danger" fill="outline" class="clear-btn">
            Clear All Records
          </ion-button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButton, alertController } from '@ionic/vue'
import { getAllRecords, clearAllRecords, type PracticeRecord } from '../services/recordService'
import { sceneConfigs } from '../services/gameService'

const records = ref<PracticeRecord[]>([])
const expandedId = ref<string | null>(null)

onMounted(() => {
  records.value = getAllRecords()
})

const averageScore = computed(() => {
  if (records.value.length === 0) return 0
  const sum = records.value.reduce((acc, r) => acc + r.percentage, 0)
  return Math.round(sum / records.value.length)
})

const bestScore = computed(() => {
  if (records.value.length === 0) return 0
  return Math.max(...records.value.map(r => r.percentage))
})

const getSceneIcon = (sceneId: string) => {
  return sceneConfigs.find(s => s.id === sceneId)?.icon || '📖'
}

const getScoreClass = (percentage: number) => {
  if (percentage >= 80) return 'excellent'
  if (percentage >= 60) return 'good'
  if (percentage >= 40) return 'fair'
  return 'poor'
}

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const toggleExpand = (id: string) => {
  expandedId.value = expandedId.value === id ? null : id
}

const confirmClear = async () => {
  const alert = await alertController.create({
    header: 'Clear All Records',
    message: 'Are you sure? This cannot be undone.',
    buttons: [
      { text: 'Cancel', role: 'cancel' },
      {
        text: 'Clear',
        role: 'destructive',
        handler: () => {
          clearAllRecords()
          records.value = []
        },
      },
    ],
  })
  await alert.present()
}
</script>

<style scoped>
.records-container {
  padding: 16px;
  max-width: 600px;
  margin: 0 auto;
  padding-bottom: 40px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-state h3 {
  color: #333;
  font-size: 20px;
  margin: 0 0 8px;
}

.empty-state p {
  color: #888;
  font-size: 14px;
}

.stats-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 20px;
}

.stat-card {
  background: #fff;
  border-radius: 14px;
  padding: 16px 10px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.stat-number {
  font-size: 26px;
  font-weight: 800;
  color: #667eea;
}

.stat-label {
  font-size: 12px;
  color: #888;
  margin-top: 4px;
  font-weight: 600;
}

.record-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.record-card {
  background: #fff;
  border-radius: 14px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: transform 0.15s;
}

.record-card:active {
  transform: scale(0.98);
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.record-scene {
  display: flex;
  align-items: center;
  gap: 8px;
}

.scene-icon {
  font-size: 22px;
}

.scene-name {
  font-weight: 700;
  font-size: 16px;
  color: #333;
}

.record-score {
  font-size: 20px;
  font-weight: 800;
  border-radius: 8px;
  padding: 4px 10px;
}

.record-score.excellent { color: #2e7d32; background: #e8f5e9; }
.record-score.good { color: #1565c0; background: #e3f2fd; }
.record-score.fair { color: #e65100; background: #fff3e0; }
.record-score.poor { color: #c62828; background: #ffebee; }

.record-date {
  font-size: 12px;
  color: #999;
  margin-top: 6px;
}

.record-bar {
  height: 6px;
  background: #f0f0f0;
  border-radius: 3px;
  margin-top: 10px;
  overflow: hidden;
}

.record-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s;
}

.record-bar-fill.excellent { background: #4caf50; }
.record-bar-fill.good { background: #2196f3; }
.record-bar-fill.fair { background: #ff9800; }
.record-bar-fill.poor { background: #f44336; }

.record-detail {
  margin-top: 14px;
  border-top: 1px solid #f0f0f0;
  padding-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.detail-item {
  background: #fafafa;
  border-radius: 8px;
  overflow: hidden;
}

.detail-header {
  padding: 8px 12px;
  font-weight: 700;
  font-size: 13px;
  display: flex;
  justify-content: space-between;
}

.detail-header.excellent { background: #e8f5e9; color: #2e7d32; }
.detail-header.good { background: #e3f2fd; color: #1565c0; }
.detail-header.fair { background: #fff3e0; color: #e65100; }
.detail-header.poor { background: #ffebee; color: #c62828; }

.detail-question {
  padding: 6px 12px;
  font-size: 13px;
  color: #555;
}

.detail-answer {
  padding: 6px 12px 10px;
  font-size: 13px;
  color: #888;
  font-style: italic;
}

.clear-btn {
  margin-top: 10px;
}
</style>

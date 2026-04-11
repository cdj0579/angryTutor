<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Practice</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Practice</ion-title>
        </ion-toolbar>
      </ion-header>

      <div class="map-container">
        <div class="map-title">
          <h2>Choose a Place</h2>
          <p>Tap a location to start practicing!</p>
        </div>

        <div class="town-map">
          <svg class="map-paths" viewBox="0 0 340 440" xmlns="http://www.w3.org/2000/svg">
            <path d="M170 80 Q200 140 120 200" stroke="#d4a574" stroke-width="8" fill="none" stroke-linecap="round" stroke-dasharray="12 8" opacity="0.6" />
            <path d="M120 200 Q60 260 170 280" stroke="#d4a574" stroke-width="8" fill="none" stroke-linecap="round" stroke-dasharray="12 8" opacity="0.6" />
            <path d="M170 280 Q280 260 220 200" stroke="#d4a574" stroke-width="8" fill="none" stroke-linecap="round" stroke-dasharray="12 8" opacity="0.6" />
            <path d="M220 200 Q240 140 170 80" stroke="#d4a574" stroke-width="8" fill="none" stroke-linecap="round" stroke-dasharray="12 8" opacity="0.6" />
            <path d="M170 280 Q170 340 170 380" stroke="#d4a574" stroke-width="8" fill="none" stroke-linecap="round" stroke-dasharray="12 8" opacity="0.6" />
          </svg>

          <div class="map-location airport" @click="goToScene('airport')">
            <div class="location-bubble">
              <span class="location-icon">✈️</span>
            </div>
            <span class="location-name">Airport</span>
            <div class="location-cloud cloud-1"></div>
          </div>

          <div class="map-location hospital" @click="goToScene('hospital')">
            <div class="location-bubble">
              <span class="location-icon">🏥</span>
            </div>
            <span class="location-name">Hospital</span>
          </div>

          <div class="map-location hotel" @click="goToScene('hotel')">
            <div class="location-bubble">
              <span class="location-icon">🏨</span>
            </div>
            <span class="location-name">Hotel</span>
          </div>

          <div class="map-location restaurant" @click="goToScene('restaurant')">
            <div class="location-bubble">
              <span class="location-icon">🍽️</span>
            </div>
            <span class="location-name">Restaurant</span>
          </div>

          <!-- Decorative elements -->
          <div class="deco tree-1">🌳</div>
          <div class="deco tree-2">🌲</div>
          <div class="deco tree-3">🌴</div>
          <div class="deco flower-1">🌸</div>
          <div class="deco flower-2">🌼</div>
          <div class="deco car">🚗</div>
        </div>

        <!-- Custom Scenes -->
        <div class="custom-section">
          <div class="custom-header">
            <span>My Scenes</span>
            <button class="add-btn" @click="showAddScene">+ Add</button>
          </div>
          <div v-if="customScenes.length === 0" class="custom-empty">
            Tap "+ Add" to create your own scene
          </div>
          <div v-else class="custom-list">
            <div
              v-for="scene in customScenes"
              :key="scene.id"
              class="custom-card"
              @click="goToScene(scene.id)"
            >
              <span class="custom-icon">{{ scene.icon }}</span>
              <div class="custom-info">
                <div class="custom-name">{{ scene.name }}</div>
                <div class="custom-role">{{ scene.role }}</div>
              </div>
              <button class="custom-delete" @click.stop="confirmRemoveScene(scene)">✕</button>
            </div>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, alertController } from '@ionic/vue'
import { useRouter } from 'vue-router'
import { getAllSceneConfigs, addCustomScene, removeCustomScene, type SceneConfig } from '../services/gameService'

const router = useRouter()
const customScenes = ref<SceneConfig[]>([])

const ICON_OPTIONS = ['🏪', '🏫', '🏛️', '🚉', '🏖️', '🎭', '💼', '🏢', '🛒', '⛪', '🎪', '🏟️']
const COLOR_OPTIONS = ['#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1']

onMounted(() => {
  customScenes.value = getAllSceneConfigs().filter(s => s.isCustom)
})

const goToScene = (sceneId: string) => {
  router.push(`/practice/${sceneId}`)
}

const showAddScene = async () => {
  const alert = await alertController.create({
    header: 'New Practice Scene',
    inputs: [
      { name: 'name', type: 'text', placeholder: 'Scene name (e.g. Bank)' },
      { name: 'role', type: 'text', placeholder: 'Role (e.g. Bank Teller)' },
      { name: 'description', type: 'text', placeholder: 'Description' },
    ],
    buttons: [
      { text: 'Cancel', role: 'cancel' },
      {
        text: 'Create',
        handler: (data) => {
          if (!data.name?.trim() || !data.role?.trim()) return false
          const icon = ICON_OPTIONS[Math.floor(Math.random() * ICON_OPTIONS.length)]
          const color = COLOR_OPTIONS[Math.floor(Math.random() * COLOR_OPTIONS.length)]
          const scene = addCustomScene({
            name: data.name.trim(),
            role: data.role.trim(),
            description: data.description?.trim() || `${data.role.trim()} conversations`,
            icon,
            color,
            bgGradient: `linear-gradient(135deg, ${color}33, ${color}55)`,
          })
          customScenes.value.push(scene)
          return true
        },
      },
    ],
  })
  await alert.present()
}

const confirmRemoveScene = async (scene: SceneConfig) => {
  const alert = await alertController.create({
    header: 'Delete Scene',
    message: `Remove "${scene.name}"?`,
    buttons: [
      { text: 'Cancel', role: 'cancel' },
      {
        text: 'Delete',
        role: 'destructive',
        handler: () => {
          removeCustomScene(scene.id)
          customScenes.value = customScenes.value.filter(s => s.id !== scene.id)
        },
      },
    ],
  })
  await alert.present()
}
</script>

<style scoped>
.map-container {
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100%;
}

.map-title {
  text-align: center;
  margin-bottom: 10px;
}

.map-title h2 {
  font-size: 22px;
  font-weight: 800;
  color: #333;
  margin: 0 0 4px;
}

.map-title p {
  font-size: 14px;
  color: #888;
  margin: 0;
}

.town-map {
  position: relative;
  width: 100%;
  max-width: 340px;
  height: 460px;
  background: linear-gradient(180deg, #87CEEB 0%, #98E4C1 30%, #90D68C 60%, #7EC87E 100%);
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.map-paths {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.map-location {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  z-index: 10;
  transition: transform 0.2s;
}

.map-location:active {
  transform: scale(0.9);
}

.map-location:hover {
  transform: scale(1.08);
}

.location-bubble {
  width: 68px;
  height: 68px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
  border: 3px solid #fff;
  transition: box-shadow 0.2s;
}

.map-location:hover .location-bubble {
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.25);
}

.location-icon {
  font-size: 32px;
}

.location-name {
  margin-top: 6px;
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
  background: rgba(0, 0, 0, 0.25);
  padding: 2px 10px;
  border-radius: 10px;
}

.airport {
  top: 30px;
  left: 50%;
  transform: translateX(-50%);
}

.airport:hover {
  transform: translateX(-50%) scale(1.08);
}

.airport:active {
  transform: translateX(-50%) scale(0.9);
}

.airport .location-bubble {
  background: linear-gradient(135deg, #60a5fa, #3b82f6);
}

.hospital {
  top: 150px;
  left: 20px;
}

.hospital .location-bubble {
  background: linear-gradient(135deg, #f87171, #ef4444);
}

.hotel {
  top: 150px;
  right: 20px;
}

.hotel .location-bubble {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
}

.restaurant {
  top: 310px;
  left: 50%;
  transform: translateX(-50%);
}

.restaurant:hover {
  transform: translateX(-50%) scale(1.08);
}

.restaurant:active {
  transform: translateX(-50%) scale(0.9);
}

.restaurant .location-bubble {
  background: linear-gradient(135deg, #34d399, #10b981);
}

/* Decorations */
.deco {
  position: absolute;
  font-size: 24px;
  pointer-events: none;
  opacity: 0.8;
  z-index: 1;
}

.tree-1 { top: 100px; left: 50%; font-size: 28px; }
.tree-2 { top: 260px; left: 12px; }
.tree-3 { top: 250px; right: 12px; }
.flower-1 { top: 400px; left: 30px; }
.flower-2 { top: 410px; right: 40px; }
.car { bottom: 20px; right: 20px; font-size: 20px; animation: carMove 6s ease-in-out infinite alternate; }

.location-cloud {
  position: absolute;
  pointer-events: none;
}

@keyframes carMove {
  0% { transform: translateX(0); }
  100% { transform: translateX(-30px); }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

.map-location .location-bubble {
  animation: float 3s ease-in-out infinite;
}

.airport .location-bubble { animation-delay: 0s; }
.hospital .location-bubble { animation-delay: 0.5s; }
.hotel .location-bubble { animation-delay: 1s; }
.restaurant .location-bubble { animation-delay: 1.5s; }

.custom-section {
  width: 100%;
  max-width: 340px;
  margin-top: 16px;
}

.custom-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.custom-header span {
  font-size: 16px;
  font-weight: 700;
  color: #333;
}

.add-btn {
  background: #667eea;
  color: #fff;
  border: none;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.add-btn:active { opacity: 0.8; }

.custom-empty {
  text-align: center;
  color: #aaa;
  font-size: 13px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 12px;
  border: 2px dashed #e5e7eb;
}

.custom-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.custom-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: transform 0.15s;
}

.custom-card:active { transform: scale(0.97); }

.custom-icon {
  font-size: 28px;
  flex-shrink: 0;
}

.custom-info {
  flex: 1;
  min-width: 0;
}

.custom-name {
  font-weight: 700;
  font-size: 15px;
  color: #333;
}

.custom-role {
  font-size: 12px;
  color: #888;
  margin-top: 2px;
}

.custom-delete {
  background: none;
  border: none;
  color: #ccc;
  font-size: 16px;
  padding: 4px 8px;
  cursor: pointer;
  flex-shrink: 0;
}

.custom-delete:active { color: #f44336; }
</style>

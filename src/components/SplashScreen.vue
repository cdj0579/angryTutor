<template>
  <transition name="splash-fade" @after-leave="$emit('done')">
    <div v-if="visible" class="splash-overlay">
      <div class="splash-content">
        <!-- Nurse character with entrance animation -->
        <div class="splash-nurse" :class="{ 'nurse-entered': nurseEntered }">
          <img :src="nurseImg" alt="" class="splash-nurse-img" />
        </div>

        <!-- Title with stagger animation -->
        <div class="splash-title" :class="{ 'title-entered': titleEntered }">
          <span class="title-angry">Angry</span><span class="title-tutor">Tutor</span>
        </div>

        <!-- Subtitle -->
        <div class="splash-subtitle" :class="{ 'subtitle-entered': subtitleEntered }">
          Master Medical English
        </div>

        <!-- Animated loading bar -->
        <div class="splash-loader" :class="{ 'loader-entered': loaderEntered }">
          <div class="splash-loader-track">
            <div class="splash-loader-fill" :style="{ width: progress + '%' }"></div>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import nurseBigSlap from '@/assets/images/nurse_big_slap.png'

const emit = defineEmits<{ done: [] }>()

const visible = ref(true)
const nurseEntered = ref(false)
const titleEntered = ref(false)
const subtitleEntered = ref(false)
const loaderEntered = ref(false)
const progress = ref(0)
const nurseImg = nurseBigSlap

onMounted(() => {
  // Remove the HTML pre-splash
  const preSplash = document.getElementById('pre-splash')
  if (preSplash) preSplash.classList.add('fade-out')
  setTimeout(() => preSplash?.remove(), 400)

  // Staggered entrance animations
  setTimeout(() => { nurseEntered.value = true }, 100)
  setTimeout(() => { titleEntered.value = true }, 400)
  setTimeout(() => { subtitleEntered.value = true }, 650)
  setTimeout(() => { loaderEntered.value = true }, 800)

  // Animate progress bar
  const start = performance.now()
  const duration = 1200
  const animate = (now: number) => {
    const elapsed = now - start
    progress.value = Math.min(100, (elapsed / duration) * 100)
    if (elapsed < duration) {
      requestAnimationFrame(animate)
    } else {
      setTimeout(() => { visible.value = false }, 300)
    }
  }
  setTimeout(() => requestAnimationFrame(animate), 900)
})
</script>

<style scoped>
.splash-overlay {
  position: fixed;
  inset: 0;
  z-index: 99998;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(160deg, #fff5ee 0%, #ffe8d6 50%, #fdd9b5 100%);
}

.splash-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 40px;
}

/* Nurse entrance */
.splash-nurse {
  width: 200px;
  height: 200px;
  opacity: 0;
  transform: scale(0.3) rotate(-15deg);
  transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.splash-nurse.nurse-entered {
  opacity: 1;
  transform: scale(1) rotate(0deg);
}
.splash-nurse-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 8px 24px rgba(0, 0, 0, 0.15));
}

/* Title */
.splash-title {
  margin-top: 24px;
  font-size: 38px;
  font-weight: 800;
  letter-spacing: -1px;
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.splash-title.title-entered {
  opacity: 1;
  transform: translateY(0);
}
.title-angry {
  color: #e74c3c;
}
.title-tutor {
  color: #2c3e50;
}

/* Subtitle */
.splash-subtitle {
  margin-top: 8px;
  font-size: 16px;
  font-weight: 500;
  color: #7f8c8d;
  letter-spacing: 2px;
  text-transform: uppercase;
  opacity: 0;
  transform: translateY(12px);
  transition: all 0.5s ease;
}
.splash-subtitle.subtitle-entered {
  opacity: 1;
  transform: translateY(0);
}

/* Loading bar */
.splash-loader {
  margin-top: 40px;
  width: 160px;
  opacity: 0;
  transform: scaleX(0.5);
  transition: all 0.4s ease;
}
.splash-loader.loader-entered {
  opacity: 1;
  transform: scaleX(1);
}
.splash-loader-track {
  width: 100%;
  height: 4px;
  background: rgba(0, 0, 0, 0.08);
  border-radius: 2px;
  overflow: hidden;
}
.splash-loader-fill {
  height: 100%;
  background: linear-gradient(90deg, #e74c3c, #e85d3a);
  border-radius: 2px;
  transition: width 0.1s linear;
}

/* Exit transition */
.splash-fade-leave-active {
  transition: opacity 0.5s ease;
}
.splash-fade-leave-to {
  opacity: 0;
}
</style>

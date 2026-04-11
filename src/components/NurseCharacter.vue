<template>
  <div class="nurse-container">
    <!-- 主图片 - 默认医生表情 -->
    <div class="nurse-image-wrapper">
      <img :src="mainImage" alt="Doctor" class="nurse-image" />
    </div>

    <!-- 评分反馈动画 -->
    <transition name="feedback-scale">
      <div v-if="showFeedback" class="feedback-overlay">
        <img :src="feedbackImage" alt="Feedback" class="feedback-image" />
        
        <!-- 评分显示 -->
        <div class="score-display">
          <div class="score-badge" :class="scoreLevel">
            <div class="score-value">{{ currentScore }}/100</div>
            <div class="score-label">{{ scoreLabel }}</div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

// 导入所有图片
import nurseBigSlap from '@/assets/images/nurse_big_slap.png'
import nurseGood from '@/assets/images/nurse_good.png'
import nurseHappy from '@/assets/images/nurse_happy.png'
import nurseVeryHappy from '@/assets/images/nurse_very_happy.png'
import nurseSlap from '@/assets/images/nurse_slap.png'
import nursePunch from '@/assets/images/nurse_punch.png'

const showFeedback = ref(false)
const feedbackImage = ref<string>('')
const currentScore = ref(0)
const scoreLevel = ref<'excellent' | 'good' | 'fair' | 'poor'>('good')

const mainImage = computed(() => nurseBigSlap)

const scoreLabel = computed(() => {
  const labels: Record<typeof scoreLevel.value, string> = {
    excellent: 'Excellent!',
    good: 'Good!',
    fair: 'Fair',
    poor: 'Try Again',
  }
  return labels[scoreLevel.value]
})

/**
 * 显示评分反馈
 * @param score - 评分（0-100）
 * @param level - 评分等级
 */
const showScoreFeedback = (
  score: number,
  level: 'excellent' | 'good' | 'fair' | 'poor'
) => {
  currentScore.value = score
  scoreLevel.value = level

  // 根据评分等级选择反馈图片
  switch (level) {
    case 'excellent':
      feedbackImage.value = nurseVeryHappy
      break
    case 'good':
      feedbackImage.value = nurseHappy
      break
    case 'fair':
      feedbackImage.value = nurseGood
      break
    case 'poor':
      feedbackImage.value = nurseSlap
      break
  }

  // 显示反馈
  showFeedback.value = true

  // 3秒后隐藏反馈
  setTimeout(() => {
    showFeedback.value = false
  }, 3000)
}

/**
 * 隐藏反馈
 */
const hideFeedback = () => {
  showFeedback.value = false
}

defineExpose({
  showScoreFeedback,
  hideFeedback,
})
</script>

<style scoped>
.nurse-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 400px;
  margin: 20px 0;
}

.nurse-image-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.nurse-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
}

.feedback-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.feedback-image {
  width: 280px;
  height: 280px;
  object-fit: contain;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3));
}

.score-display {
  position: absolute;
  bottom: 10px;
  right: 10px;
  z-index: 10;
}

.score-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  font-weight: bold;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  font-size: 14px;
}

.score-badge.excellent {
  background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
}

.score-badge.good {
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
}

.score-badge.fair {
  background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
}

.score-badge.poor {
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
}

.score-value {
  font-size: 18px;
  font-weight: bold;
  line-height: 1;
}

.score-label {
  font-size: 10px;
  margin-top: 2px;
}

/* Transition animations */
.feedback-scale-enter-active,
.feedback-scale-leave-active {
  transition: all 0.3s ease;
}

.feedback-scale-enter-from {
  opacity: 0;
  transform: scale(0.3);
}

.feedback-scale-leave-to {
  opacity: 0;
  transform: scale(1.1);
}

.feedback-scale-enter-to,
.feedback-scale-leave-from {
  opacity: 1;
  transform: scale(1);
}
</style>

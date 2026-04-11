<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet />
      <ion-tab-bar slot="bottom" class="custom-tab-bar">
        <ion-tab-button tab="practice" href="/tabs/practice">
          <ion-icon :icon="gameControllerOutline" />
          <ion-label>Practice</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="study" href="/tabs/study">
          <ion-icon :icon="bookOutline" />
          <ion-label>Study</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="record" href="/tabs/record">
          <ion-icon :icon="statsChartOutline" />
          <ion-label>Record</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="setting" href="/tabs/setting">
          <ion-icon :icon="settingsOutline" />
          <ion-label>Setting</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonTabs, IonTabBar, IonTabButton,
  IonIcon, IonLabel, IonRouterOutlet
} from '@ionic/vue'
import {
  gameControllerOutline, bookOutline,
  statsChartOutline, settingsOutline
} from 'ionicons/icons'
</script>

<style scoped>
.custom-tab-bar {
  --background: #ffffff;
  border-top: 1px solid #e5e7eb;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

ion-tab-button {
  --color: #9ca3af;
  --color-selected: #667eea;
  font-size: 11px;
  font-weight: 600;
}

ion-tab-button ion-icon {
  font-size: 22px;
  margin-bottom: 2px;
}
</style>

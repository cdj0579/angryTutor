<template>
  <ion-app>
    <SplashScreen v-if="showSplash" @done="showSplash = false" />
    <ion-router-outlet />
  </ion-app>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { IonApp, IonRouterOutlet } from '@ionic/vue';
import SplashScreen from './components/SplashScreen.vue';

const showSplash = ref(true);
</script>

import { createRouter, createWebHistory } from '@ionic/vue-router'
import { RouteRecordRaw } from 'vue-router'
import TabsLayout from '../views/TabsLayout.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/tabs/practice',
  },
  {
    path: '/tabs/',
    component: TabsLayout,
    children: [
      {
        path: '',
        redirect: '/tabs/practice',
      },
      {
        path: 'practice',
        name: 'Practice',
        component: () => import('../views/PracticePage.vue'),
      },
      {
        path: 'study',
        name: 'Study',
        component: () => import('../views/StudyPage.vue'),
      },
      {
        path: 'record',
        name: 'Record',
        component: () => import('../views/RecordPage.vue'),
      },
      {
        path: 'setting',
        name: 'Setting',
        component: () => import('../views/SettingPage.vue'),
      },
    ],
  },
  {
    path: '/practice/:sceneId',
    name: 'PracticeScene',
    component: () => import('../views/PracticeScene.vue'),
  },
  {
    path: '/study/:sceneId',
    name: 'StudyScene',
    component: () => import('../views/StudyScene.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router

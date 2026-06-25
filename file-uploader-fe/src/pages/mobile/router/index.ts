import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '@/pages/mobile/modules/Dashboard.vue'

const router = createRouter({
  history: createWebHistory('/mobile'),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Dashboard
    }
  ]
})

export default router

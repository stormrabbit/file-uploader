import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'
import Dashboard from '@/pages/pc/modules/Dashboard.vue'

const isElectron = typeof window !== 'undefined' && window.location.protocol === 'file:'

const router = createRouter({
  history: isElectron
    ? createWebHashHistory()
    : createWebHistory('/pc'),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Dashboard
    }
  ]
})

export default router

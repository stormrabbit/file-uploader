import '@/style/mobile/index.scss'
import { createApp } from 'vue'
import { Dialog } from 'vant';
import App from './App.vue'
import router from './router'
import { initApiBaseUrl } from '@/utils/apiBase'

initApiBaseUrl().finally(() => {
  const app = createApp(App)
  app.use(Dialog);
  app.use(router)
  app.mount('#app')
})

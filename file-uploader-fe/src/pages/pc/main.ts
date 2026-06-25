import '@/style/main.scss'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/src/message-box.scss'
import 'element-plus/theme-chalk/src/message.scss'
import { initApiBaseUrl } from '@/utils/apiBase'

initApiBaseUrl().finally(() => {
  const app = createApp(App)
  app.use(router)
  app.mount('#app')
})

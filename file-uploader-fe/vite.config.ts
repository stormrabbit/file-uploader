import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { VantResolver } from '@vant/auto-import-resolver';
import { resolve } from 'node:path'
import * as glob from 'glob'
import history from 'connect-history-api-fallback'
// https://vitejs.dev/config/

// 保存每个页面的名称和路径，后面会用到
const multiPage = {} as any
// 保存页面文件路径
const pageEntry = {} as any
function pathRewritePlugin() {
  const rules: any[] = []
  Reflect.ownKeys(multiPage).forEach((key) => {
    rules.push({
      from: new RegExp(`^/${multiPage[key].name}(/|$)`),
      to: multiPage[key].rootPage
    })
  })
  return {
    name: 'path-rewrite-plugin',
    configureServer(server: any) {
      server.middlewares.use(
        history({
          htmlAcceptHeaders: ['text/html', 'application/xhtml+xml'],
          disableDotRule: undefined,
          rewrites: rules
        })
      )
    }
  }
}
// 这里的multiPage是之前获取目录结构时保存的，形如：
// {
//   pageA: { name: 'pageA', rootPage: '/src/pages/pageA/index.html' },
//   pageB: { name: 'pageB', rootPage: '/src/pages/pageB/index.html' }
// }

function getInput() {
  const allEntry = glob.sync('src/pages/**/index.html', { cwd: __dirname })
  allEntry.forEach((entry: string) => {
    const parts = entry.split(/[\\/]/)
    const name = parts[parts.length - 2]
    multiPage[name] = {
      name,
      rootPage: `/src/pages/${name}/index.html`
    }
    pageEntry[name] = resolve(__dirname, 'src', 'pages', name, 'index.html')
  })
}
// 调用一下
getInput()

export default defineConfig({
  // base: "./",
  // root: "src/pages",
  plugins: [
    vue(),
    pathRewritePlugin(),
    AutoImport({
      resolvers: [ElementPlusResolver()]
    }),
    Components({
      resolvers: [ElementPlusResolver(), VantResolver()]
    })
  ],
  build: {
    outDir: './dist',
    rollupOptions: {
      input: pageEntry
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        silenceDeprecations: ['import', 'legacy-js-api']
      }
    }
  },
  server: {
    host: '0.0.0.0',
    port: 38903
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@/style': fileURLToPath(new URL('./src/style', import.meta.url))
    }
  }
})

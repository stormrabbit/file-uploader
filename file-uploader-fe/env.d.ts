/// <reference types="vite/client" />

interface Window {
  electronAPI?: {
    isDesktop: true
    selectFolder: () => Promise<string | null>
  }
  /** Flutter App 注入的 JavaScript Bridge，仅在 WebView 环境中存在 */
  UploadBridge?: {
    postMessage: (message: string) => void
  }
}

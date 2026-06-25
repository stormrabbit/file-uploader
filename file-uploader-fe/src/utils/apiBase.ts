let _baseUrl = ''

function isLoopback(host: string): boolean {
  // 空字符串：Electron loadFile 加载 file:// 协议时 hostname 为空，按本机处理
  return host === '' || host === '127.0.0.1' || host === 'localhost' || host === '::1'
}

export async function initApiBaseUrl(): Promise<void> {
  const port = import.meta.env.VITE_API_BASE_BACKEND_PORT
  const host = window.location.hostname

  // PC Electron 内嵌窗口：build 期已注入 loopback baseURL，本机回环最快
  if (isLoopback(host) && import.meta.env.VITE_API_BASE_URL) {
    _baseUrl = import.meta.env.VITE_API_BASE_URL
    return
  }

  // 手机扫码 / 局域网访问：先用当前 hostname 当 bootstrap host 拉一次 /files/ip，
  // 取后端报告的第一个局域网 IP 作为最终 baseURL。
  const bootstrap = `http://${host}:${port}/`
  try {
    const res = await fetch(`${bootstrap}files/ip`)
    const json = await res.json()
    const ip = json?.data?.ips?.[0]
    if (ip) {
      _baseUrl = `http://${ip}:${port}/`
      return
    }
  } catch {
    // 拉取失败兜底回 hostname，至少和当前访问路径同源能跑
  }
  _baseUrl = bootstrap
}

export function getApiBaseUrl(): string {
  return _baseUrl
}

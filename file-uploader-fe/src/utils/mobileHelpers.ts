import { showConfirmDialog } from 'vant'
import 'vant/lib/index.css'


export function confirm():Promise<boolean> {
  return new Promise((resolve) => {
    showConfirmDialog({
      title: '标题',
      message: '如果解决方法是丑陋的，那就肯定还有更好的解决方法，只是还没有发现而已。'
    })
      .then(() => {
        resolve(true)
      })
      .catch(() => {
        resolve(false)
      })
  })
}

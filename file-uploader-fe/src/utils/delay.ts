/**
 * 以秒为单位进行延迟
 * @param timeout 秒
 * @returns 
 */
export function delay(timeout: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout * 1000)
  })
}


  /**
   * 以毫秒为单位进行延迟
   * @param timeout 毫秒
   * @returns 
   */
  export function delayByMillisecond(timeout: number = 1000) {
    return new Promise((resolve) => {
      setTimeout(()=> {
        resolve(true)
      }, timeout)
    })
  }
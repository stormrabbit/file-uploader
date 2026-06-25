export function formatFileSize(size?: number):string {
    if (!size) {
      return '0 Bytes'
    }
    const unitArr = new Array('Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB')
    const srcsize = parseFloat(`${size}`)
    const index = Math.floor(Math.log(srcsize) / Math.log(1024))
    const formatedSize = srcsize / Math.pow(1024, index)
    return formatedSize.toFixed(2) + unitArr[index]
  }
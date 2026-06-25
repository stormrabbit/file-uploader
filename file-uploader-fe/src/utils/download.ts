import ApiService from '@/services/axios'

const apiService = new ApiService()

export const downloadBlob = async (id: number | string = '') => {
  try {
    const response = await getBlob(id)
    const cd = decodeURIComponent(response.headers['content-disposition'] ?? '')
    const fileName =
      cd.match(/filename\*=UTF-8''([^;]+)/i)?.[1] ||
      cd.match(/filename="?([^";]+)"?/i)?.[1] ||
      'download'
    handleBlob(response.data, fileName)
  } catch (error) {
    console.warn(error)
  }
}

export const getBlob = (id: number | string = '') =>
  apiService.download('/files/download', { params: { id } })

export function handleBlob(blob: Blob, fileName: string) {
  const elink = document.createElement('a')
  elink.download = fileName
  elink.style.display = 'none'
  elink.href = URL.createObjectURL(blob)
  document.body.appendChild(elink)
  elink.click()
  URL.revokeObjectURL(elink.href)
  document.body.removeChild(elink)
}

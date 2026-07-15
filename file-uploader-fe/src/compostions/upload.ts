import { ref } from 'vue'
import { uploadFile, isFileExistByMd5 } from '@/api'
import { file2Md5 } from '@/utils/md5'
function useUpload() {
  const uploadLoading = ref(false)

  const handleUpload = async (req: { file: File; header: any }) => {
    uploadLoading.value = true
    let result = null
    try {
      const { file } = req
      const fileMd5: string = await file2Md5(file)
      const isExist = (await isFileExistByMd5(fileMd5)) as { fileMd5?: string }
     
      if (!isExist.fileMd5) {
        result = await uploadFile(file)
      } 
      
    } catch (ex) {
      console.log(ex)
    } finally {
      uploadLoading.value = false
    }
    return result
  }
  return {
    handleUpload,
    uploadLoading
  }
}

export default useUpload

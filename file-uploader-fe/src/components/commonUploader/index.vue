<template>
  <el-upload
    class="fuf-common-uploader"
    ref="upload"
    v-model:file-list="fileList"
    :action="action"
    multiple
    :http-request="fakeUpload"
    :disabled="loading"
  >
    <el-button :disabled="loading" :loading="loading" type="primary">{{ btnTxt }}</el-button>
  </el-upload>
</template>
<script lang="ts" setup>
import { ref } from 'vue'
import { uploadFile, isFileExistByMd5 } from '@/api'
import type { UploadInstance, UploadUserFile } from 'element-plus'
import { file2Md5 } from '@/utils/md5'
import { watch } from 'vue';
import { delayByMillisecond } from '@/utils/delay';

defineProps({
  action: {
    type: [String, Number],
    default: '#'
  },
  btnTxt: {
    type: String,
    default: '按钮'
  }
})

const emit = defineEmits(['onSuccess'])

const fileList = ref<UploadUserFile[]>([])

watch(fileList, async (newFileList) => {
  if (!newFileList.length) {
    return
  }
  // 快照当前待处理文件，逐个上传
  const pendingFiles = [...newFileList]
  for (const file of pendingFiles) {
    await handleUpload({ file: file.raw as File, header: {} })
  }
  // 处理完整批后清空列表，无论成功或失败，避免下次选文件时重复上传
  fileList.value = []
}, {
  deep: true
})
const loading = ref(false)

const upload = ref<UploadInstance>()

const fakeUpload = () => {
  console.log('fakeUpload=>' )
}
const handleUpload = async (req: { file: File; header: any }) => {
  loading.value = true
  try {
    const { file } = req
 
    const fileMd5: string = await file2Md5(file)
    
    const isExist = await isFileExistByMd5(fileMd5)as {fileMd5?:string}
    let result
    if (!isExist.fileMd5) {
      result = await uploadFile(file)
    }

    await delayByMillisecond(1500)
    emit('onSuccess', result)
  } catch (ex) {
    console.log(ex)
  } finally {
    loading.value = false
  }
}
</script>

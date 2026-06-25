//封装文件message.ts
import { ElMessage, ElMessageBox, type messageType } from 'element-plus'

interface MessageImplements {
  info(title: string): void
  wraning(title: string): void
  success(title: string): void
  error(title: string): void
}

export function useMessage() {
  class MessageClass implements MessageImplements {
    // 普通提示
    info(title: string): void {
      ElMessage.info(title)
    }

    // 警告提示
    wraning(title: string): void {
      ElMessage.warning(title)
    }

    // 成功提示
    success(title: string): void {
      ElMessage.success(title)
    }

    // 错误提示
    error(title: string): void {
      ElMessage.error(title)
    }
  }

  return new MessageClass()
}

export function useMessageBox() {
  class MessageBoxClass implements MessageImplements {
    // 普通提示
    info(msg: string): void {
      ElMessageBox.alert(msg, 'message.box.title')
    }

    // 警告提示
    wraning(msg: string): void {
      ElMessageBox.alert(msg, 'message.box.title', { type: 'warning' })
    }

    // 成功提示
    success(msg: string): void {
      ElMessageBox.alert(msg, 'message.box.title', { type: 'success' })
    }

    // 错误提示
    error(msg: string): void {
      ElMessageBox.alert(msg, 'message.box.title', { type: 'error' })
    }

    // 确认窗体
    confirm({msg, title}:{msg: string, title?:string},  options: {
        type?: messageType, 
        confirmButtonText?: string,
        cancelButtonText?: string
    } = {
        confirmButtonText: '确定',
        cancelButtonText: '取消'
    }) {
      return ElMessageBox.confirm(msg, title, {
        ...options
      })
    }
    // 提交内容
    prompt(msg: string) {
      return ElMessageBox.prompt(msg, 'message.box.title', {
        confirmButtonText: 'common.confirmButtonText',
        cancelButtonText: 'common.cancelButtonText',
        type: 'warning'
      })
    }
  }

  return new MessageBoxClass()
}

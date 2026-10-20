import { readonly, shallowRef } from 'vue'

import type { AdminToastType } from '~/types/admin'

interface AdminToast {
  id: number
  message: string
  type: AdminToastType
}

const currentToast = shallowRef<AdminToast | null>(null)
let toastSequence = 0
let toastTimer: ReturnType<typeof setTimeout> | undefined

export function useAdminFeedback() {
  function showToast(message: string, type: AdminToastType = 'success'): void {
    currentToast.value = { id: ++toastSequence, message, type }
    if (toastTimer) clearTimeout(toastTimer)
    toastTimer = setTimeout(() => {
      currentToast.value = null
    }, 2600)
  }

  function clearToast(): void {
    if (toastTimer) clearTimeout(toastTimer)
    currentToast.value = null
  }

  return {
    toast: readonly(currentToast),
    showToast,
    clearToast,
  }
}

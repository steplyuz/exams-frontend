/**
 * download.ts
 * ===========
 * Admin/foydalanuvchi uchun authenticated fayl yuklab olish yordamchisi.
 *
 * Nima uchun bu kerak?
 *   <a href="/api/..."> orqali ochilganda ba'zi brauzerlar cross-site holatda
 *   cookie'ni to'liq yubormasligi mumkin. Fayl yuklab olish uchun
 *   fetch() + credentials:'include' + Blob ishlatamiz — bu apiRequest bilan
 *   bir xil auth mexanizmi (httpOnly cookie).
 */

import { baseUrl } from './client'

export interface DownloadOptions {
  filename: string
  onError?: (msg: string) => void
}

/** Cookie orqali authenticated fetch → Blob → avtomatik download. */
export async function authenticatedDownload(
  url: string,
  { filename, onError }: DownloadOptions,
): Promise<boolean> {
  try {
    const res = await fetch(url, { credentials: 'include' })

    if (!res.ok) {
      const payload = await res.json().catch(() => null)
      const msg =
        payload?.detail ||
        payload?.error?.detail ||
        payload?.message ||
        `Yuklab olishda xatolik: ${res.status}`
      onError?.(msg)
      return false
    }

    const blob = await res.blob()
    const objectUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = objectUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(objectUrl)
    return true
  } catch (err: any) {
    onError?.(err.message ?? 'Yuklab olishda kutilmagan xatolik')
    return false
  }
}

/** Download URL larini qulay usulda yaratish */
export function buildApiUrl(path: string): string {
  return `${baseUrl}/api/v1${path}`
}

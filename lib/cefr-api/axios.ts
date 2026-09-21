// Yetishmayotgan "./axios" adapteri.
//
// Bu papkadagi fayllar (reading.ts, listening.ts, writing.ts, mock.ts)
// axios uslubida yozilgan: `api.get(url)` -> `{ data }`. Loyihada haqiqiy
// axios o'rnatilmagan — bor bo'lgan, backend bilan allaqachon moslashtirilgan
// `lib/api/client.ts` (fetch asosida, httpOnly cookie autentifikatsiyasi,
// 401'da avto-refresh, yagona xatolik formati) ustiga yupqa moslashtiruvchi
// qatlam yozildi, shu bilan ikkita alohida http-mijoz saqlanib qolmaydi.
import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from '@/lib/api/client'

interface AxiosLikeResponse<T> {
  data: T
}

interface RequestConfig {
  params?: Record<string, string | number | boolean | undefined | null>
  headers?: Record<string, string>
  // Bu loyihada fayl yuklab olish alohida `lib/api/download.ts` orqali
  // qilinadi (auth cookie bilan). `responseType: 'blob'` shu yerga
  // kelib qolsa ham funksiya buzilmasligi uchun qabul qilinadi, lekin
  // amalda ishlatilmaydi — PDF/audio yuklab olish uchun `downloadFile`dan
  // yoki tegishli `*Url` funksiyalardan foydalaning.
  responseType?: 'json' | 'blob'
}

async function request<T>(method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', url: string, body?: unknown, config?: RequestConfig): Promise<AxiosLikeResponse<T>> {
  const options = { query: config?.params, headers: config?.headers }
  let data: T
  switch (method) {
    case 'GET':
      data = await apiGet<T>(url, options)
      break
    case 'POST':
      data = await apiPost<T>(url, body, options)
      break
    case 'PUT':
      data = await apiPut<T>(url, body, options)
      break
    case 'PATCH':
      data = await apiPatch<T>(url, body, options)
      break
    case 'DELETE':
      data = await apiDelete<T>(url, options)
      break
  }
  return { data }
}

const api = {
  get: <T>(url: string, config?: RequestConfig) => request<T>('GET', url, undefined, config),
  post: <T>(url: string, body?: unknown, config?: RequestConfig) => request<T>('POST', url, body, config),
  put: <T>(url: string, body?: unknown, config?: RequestConfig) => request<T>('PUT', url, body, config),
  patch: <T>(url: string, body?: unknown, config?: RequestConfig) => request<T>('PATCH', url, body, config),
  delete: <T>(url: string, config?: RequestConfig) => request<T>('DELETE', url, undefined, config),
}

export default api

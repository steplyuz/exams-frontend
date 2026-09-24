// Steply Backend API — asosiy so'rov qatlami.
//
// AUTH MODELI: faqat httpOnly cookie (access_token / refresh_token).
// Backend har doim cookie-ni ustuvor deb hisoblaydi (auth/dependencies.py),
// shuning uchun frontend endi tokenlarni localStorage'da saqlamaydi (XSS xavfi
// va cookie bilan ziddiyatni oldini olish uchun). Har bir so'rov credentials:
// 'include' bilan yuboriladi, brauzer cookie'ni o'zi biriktiradi.
//
// 401 kelsa: bitta marta /auth/refresh chaqiriladi (cookie orqali yangi
// tokenlar backendda cookie'ga yoziladi), so'ng asl so'rov qayta yuboriladi.

export type ApiError = { code: string; message: string; fields?: Record<string, string[]> | null }

export class ApiRequestError extends Error {
  /** Backend'ning barqaror kodi, masalan "LOGIN__401". Status raqami emas —
   *  status o'zgarishi mumkin bo'lgan joylarda ham bir xil qoladi. */
  code: string
  status: number
  /** Faqat 422 validatsiya xatolarida to'ladi: {maydon_nomi: [sabablar]} */
  fields?: Record<string, string[]> | null
  constructor(error: ApiError, status: number) {
    super(error.message)
    this.code = error.code
    this.status = status
    this.fields = error.fields ?? null
  }
}

export const baseUrl = "http://127.0.0.1:8000"

/** Auth holati o'zgarganda (login/logout/refresh muvaffaqiyatsiz) chiqariladigan hodisa. */
export function notifyAuthChanged() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('steply:auth-changed'))
}

// Backend endi har doim `{ error: { status_code, code, message, fields } }`
// shaklida javob beradi (app/core/errors.py). Eski shakllar (oddiy `detail`)
// bilan ham moslik uchun pastdagi variantlar saqlab qolindi.
function extractError(payload: any, status: number, fallback: string): ApiError {
  const err = payload?.error
  if (err && typeof err === 'object') {
    return {
      code: typeof err.code === 'string' ? err.code : String(status),
      message: typeof err.message === 'string' ? err.message : fallback,
      fields: err.fields ?? null,
    }
  }
  if (typeof payload?.detail === 'string') return { code: String(status), message: payload.detail }
  if (Array.isArray(payload?.detail)) {
    return { code: String(status), message: payload.detail.map((d: any) => d.msg ?? JSON.stringify(d)).join('; ') }
  }
  return { code: String(status), message: payload?.message || fallback }
}

let refreshPromise: Promise<boolean> | null = null

async function tryRefresh(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        // examx.steply.uz talabalari FAQAT exams-auth (MK ID + SMS OTP) orqali
        // kiradi — asosiy Steply /auth/refresh bu yerda ISHLAMAYDI, chunki
        // exams_access_token/exams_refresh_token cookie'lari butunlay
        // mustaqil, kriptografik jihatdan mos kelmaydigan token turi
        // (boshqa issuer/audience/type — qarang: backend
        // app/modules/exams_auth/security.py).
        const res = await fetch(`${baseUrl}/api/v1/exams-auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        })
        return res.ok
      } catch {
        return false
      } finally {
        refreshPromise = null
      }
    })()
  }
  return refreshPromise
}

interface RequestOptions extends RequestInit {
  /** login/register/otp kabi hali sessiyasi yo'q so'rovlar uchun — 401 da refresh urinilmaydi */
  anonymous?: boolean
  /** avto-refresh-and-retry oqimini o'chirib qo'yish (masalan /auth/refresh'ning o'zi uchun) */
  skipAuthRetry?: boolean
  query?: Record<string, string | number | boolean | undefined | null>
  isForm?: boolean
}

function buildQuery(query?: RequestOptions['query']): string {
  if (!query) return ''
  const params = new URLSearchParams()
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null && v !== '') params.set(k, String(v))
  }
  const s = params.toString()
  return s ? `?${s}` : ''
}

export async function apiRequest<T>(path: string, init: RequestOptions = {}): Promise<T> {
  const { anonymous, skipAuthRetry, query, isForm, headers, ...rest } = init

  const doFetch = async (): Promise<Response> =>
    fetch(`${baseUrl}/api/v1${path}${buildQuery(query)}`, {
      ...rest,
      credentials: 'include',
      headers: {
        ...(isForm ? {} : { 'Content-Type': 'application/json' }),
        ...headers,
      },
    })

  let response = await doFetch()

  if (response.status === 401 && !anonymous && !skipAuthRetry) {
    const refreshed = await tryRefresh()
    if (refreshed) {
      response = await doFetch()
    } else {
      notifyAuthChanged()
    }
  }

  if (response.status === 204) return undefined as T

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    if (response.status === 401 && !anonymous) notifyAuthChanged()
    throw new ApiRequestError(
      extractError(payload, response.status, "Nimadir xato ketdi. Iltimos, qaytadan urinib ko'ring."),
      response.status,
    )
  }

  return (payload?.data ?? payload) as T
}

// React Strict Mode intentionally re-runs effects in development. Without
// request deduplication that turns one GET into two (or more) identical API
// calls. Share the same in-flight promise for identical GETs for a short
// window. Mutations are never deduplicated.
const getInFlight = new Map<string, Promise<unknown>>()

function getRequestKey(path: string, options?: RequestOptions): string {
  const query = options?.query ? buildQuery(options.query) : ''
  return `${path}${query}`
}

export function apiGet<T>(path: string, options?: RequestOptions): Promise<T> {
  const key = getRequestKey(path, options)
  const existing = getInFlight.get(key)
  if (existing) return existing as Promise<T>

  const request = apiRequest<T>(path, { ...options, method: 'GET' }).finally(() => {
    // Keep the entry only while the request is in flight. This preserves fresh
    // GET semantics while eliminating duplicate concurrent requests.
    if (getInFlight.get(key) === request) getInFlight.delete(key)
  })
  getInFlight.set(key, request)
  return request
}
export function apiPost<T>(path: string, body?: unknown, options?: RequestOptions) {
  return apiRequest<T>(path, { ...options, method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined })
}
export function apiPut<T>(path: string, body?: unknown, options?: RequestOptions) {
  return apiRequest<T>(path, { ...options, method: 'PUT', body: body !== undefined ? JSON.stringify(body) : undefined })
}
export function apiPatch<T>(path: string, body?: unknown, options?: RequestOptions) {
  return apiRequest<T>(path, { ...options, method: 'PATCH', body: body !== undefined ? JSON.stringify(body) : undefined })
}
export function apiDelete<T>(path: string, options?: RequestOptions) {
  return apiRequest<T>(path, { ...options, method: 'DELETE' })
}
export function apiPostForm<T>(path: string, form: FormData, options?: RequestOptions) {
  return apiRequest<T>(path, { ...options, method: 'POST', body: form, isForm: true })
}

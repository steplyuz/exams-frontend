// Practice (mock bo'lmagan) rejimda submit javobi darhol natija sahifasiga
// ko'rsatiladi. MK-ID sessiyasi uchun alohida "mening natijalarim" ro'yxati
// backendda yo'q (faqat bitta biriktirilgan mock imtihon holati bor), shuning
// uchun oxirgi natija shu sessiya davomida sessionStorage orqali uzatiladi.
export type ResultSkill = "reading" | "listening" | "writing"

const key = (skill: ResultSkill) => `steply:lastResult:${skill}`

export function saveLastResult(skill: ResultSkill, data: unknown) {
  try {
    sessionStorage.setItem(key(skill), JSON.stringify(data))
  } catch {}
}

export function readLastResult<T = unknown>(skill: ResultSkill): T | null {
  try {
    const raw = sessionStorage.getItem(key(skill))
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

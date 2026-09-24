/**
 * candidate-id.ts
 *
 * Backend formati: MK-DDMMYY-NNN
 *   MK  = Mock
 *   DD  = tug'ilgan sana
 *   MM  = oy
 *   YY  = yil (oxirgi 2 raqam)
 *   NNN = 3 xonali tartib raqami
 *
 * Misol: MK-290706-785
 *
 * Eski format (MK-290706568) ham qabul qilinadi va avtomatik
 * to'g'ri formatga o'giriladi: MK-DDMMYY-NNN.
 */

export type ParsedId = {
  type: "MK"
  day: number
  month: number
  year: number
  seq: string   // 3 xonali tartib raqami (string, masalan "785")
  raw: string   // backend'ga yuborish uchun: "MK-290706-785"
}

export function parseId(input: string): ParsedId | null {
  const trimmed = input.trim().toUpperCase()

  // Format 1 (yangi, to'g'ri): MK-DDMMYY-NNN
  const newFmt = trimmed.match(/^MK-(\d{2})(\d{2})(\d{2})-(\d{3})$/)
  if (newFmt) {
    const [, dd, mm, yy, seq] = newFmt
    const day = parseInt(dd, 10)
    const month = parseInt(mm, 10)
    if (day < 1 || day > 31) return null
    if (month < 1 || month > 12) return null
    return {
      type: "MK",
      day,
      month,
      year: parseInt(yy, 10),
      seq,
      raw: trimmed, // allaqachon to'g'ri format
    }
  }

  // Format 2 (eski, 7 ta raqam): MK-DDMMYYGSE
  // Oxirgi 3 raqam → NNN sifatida ishlatiladi
  const oldFmt = trimmed.match(/^MK-(\d{2})(\d{2})(\d{2})(\d{3})$/)
  if (oldFmt) {
    const [, dd, mm, yy, seq] = oldFmt
    const day = parseInt(dd, 10)
    const month = parseInt(mm, 10)
    if (day < 1 || day > 31) return null
    if (month < 1 || month > 12) return null
    const normalized = `MK-${dd}${mm}${yy}-${seq}`
    return {
      type: "MK",
      day,
      month,
      year: parseInt(yy, 10),
      seq,
      raw: normalized, // backend kutgan format
    }
  }

  return null
}

export function formatIdDisplay(parsed: ParsedId): string {
  const fullYear = parsed.year + (parsed.year > 50 ? 1900 : 2000)
  return `${parsed.day.toString().padStart(2, "0")}.${parsed.month.toString().padStart(2, "0")}.${fullYear} • #${parsed.seq}`
}

/**
 * candidate-id.ts
 *
 * ID format: MK-290706568
 *   MK  = Mock
 *   29  = tug'ilgan sana (DD)
 *   07  = oy (MM)
 *   06  = yil oxirgi 2 raqami (YY)
 *   5   = jins (5=erkak, 6=ayol)
 *   6   = bugungi sana + oy / yil (Math.floor((DD+MM)/YY) % 10)
 *   8   = ro'yxatdan o'tish tartib raqami (1-raqamli)
 *
 * Demo ID:  MK-290706568
 */

export type ParsedId = {
  type: "MK"
  day: number
  month: number
  year: number
  gender: "M" | "F"
  checkDigit: number
  seqDigit: number
  raw: string
}

export function parseId(raw: string): ParsedId | null {
  const trimmed = raw.trim().toUpperCase()
  // Format: MK-DDMMYYGSE  (10 chars after prefix)
  const match = trimmed.match(/^(MK)-(\d{2})(\d{2})(\d{2})(\d)(\d)(\d)$/)
  if (!match) return null

  const [, type, dd, mm, yy, g, checkDigit, seq] = match
  const day = parseInt(dd, 10)
  const month = parseInt(mm, 10)
  const year = parseInt(yy, 10)
  const genderDigit = parseInt(g, 10)
  const check = parseInt(checkDigit, 10)
  const seqNum = parseInt(seq, 10)

  if (day < 1 || day > 31) return null
  if (month < 1 || month > 12) return null
  if (genderDigit !== 5 && genderDigit !== 6) return null

  // Validate check digit: Math.floor((day + month) / (year || 1)) % 10
  const expectedCheck = Math.floor((day + month) / (year || 1)) % 10
  if (check !== expectedCheck) return null

  return {
    type: "MK",
    day,
    month,
    year,
    gender: genderDigit === 5 ? "M" : "F",
    checkDigit: check,
    seqDigit: seqNum,
    raw: trimmed,
  }
}

export function formatIdDisplay(parsed: ParsedId): string {
  const genderLabel = parsed.gender === "M" ? "Erkak" : "Ayol"
  const fullYear = parsed.year + (parsed.year > 50 ? 1900 : 2000)
  return `${parsed.day.toString().padStart(2, "0")}.${parsed.month.toString().padStart(2, "0")}.${fullYear} • ${genderLabel} • #${parsed.seqDigit}`
}

// Yupqa moslashtiruvchi qatlam: sahifalar eski (axios-style {data}) shaklda
// chaqiradi, lekin haqiqiy so'rovlar `lib/api/endpoints.ts` orqali to'g'ri
// backend yo'llariga (`/reading-tests`, exams-auth `/exams/reading/*`) boradi.
//
// MUHIM: test kontenti (savollar) PUBLIC (`readingApi.get/getAll`), lekin
// javob YUBORISH MK-ID (exams-auth) sessiyasi orqali — shuning uchun
// `examsApi.submitReading` ishlatiladi, `readingApi.submit` EMAS (u asosiy
// Steply loginini talab qiladi va MK-ID talabasida ishlamaydi).
import { examsApi, readingApi } from '@/lib/api/endpoints'
import type { ReadingResultDetail } from '@/lib/api/types'
// Boshlash sahifasi (start/page.tsx) va uning bola komponentlari eski,
// mahalliy `ReadingExam` shaklini kutadi — backend maydonlari deyarli bir xil
// (title/cefr_level/duration_minutes/parts), shu sababli alohida moslashtiruvchi
// interfeys yozish o'rniga shu yerda moslashtirib qaytariladi.
import type { ReadingExam } from '@/lib/cefr-types/reading'

export interface AnswerItem {
  question_id: number
  answers: string[]
}

export interface ReadingSubmission {
  answers: AnswerItem[]
  exam_attempt_id?: number | null
}

export const getAllReadingExamsAPI = async () => ({ data: await readingApi.getAll() })

export const getReadingExamByIdAPI = async (testId: string) => {
  if (!testId) throw new Error('testId is required')
  return { data: (await readingApi.get(testId)) as unknown as ReadingExam }
}

export const submitReadingExamAPI = async (testId: string, data: ReadingSubmission) => {
  if (!testId) throw new Error('testId is required')
  return { data: (await examsApi.submitReading(testId, data)) as ReadingResultDetail }
}

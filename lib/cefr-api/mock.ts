// MK-ID (exams-auth) talabasining BITTA biriktirilgan mock imtihoni uchun
// yupqa moslashtiruvchi qatlam — `examsApi` (lib/api/endpoints.ts) ustiga.
// Eski `/mock-test/*` yo'llari (asosiy Steply login talab qiladigan
// `mockExamsApi`/`mockCenterApi` bilan bir xil domen EMAS) butunlay olib
// tashlandi — MK-ID talabasi ulardan hech qachon foydalana olmasdi.
import { examsApi } from '@/lib/api/endpoints'
import type { EnrolledExam, MockAttemptStart, MockFinalResult, MockSkillStatus, SkillType } from '@/lib/api/types'

export const getMyMockExamsAPI = async () => ({ data: await examsApi.list() as EnrolledExam[] })

export const startMockExamAPI = async (examId: string) => ({
  data: (await examsApi.start(examId)) as MockAttemptStart,
})

export const getMockAttemptStatusAPI = async (attemptId: string | number) => ({
  data: (await examsApi.status(Number(attemptId))) as MockSkillStatus[],
})

/**
 * Bo'lim allaqachon `/exams/{skill}/{id}/submit` orqali topshirilgan
 * bo'lsa, natijani mock urinishga "tortib oladi" va belgilaydi.
 * Backend bu yerda body QABUL QILMAYDI (eski submitMockSkillAPI's
 * {raw_score, user_answers} argumentlari e'tiborga olinmasdi).
 */
export const pullMockSkillResultAPI = async (attemptId: number | string, skill: SkillType) => {
  await examsApi.pullSkillFromExistingResult(Number(attemptId), skill)
}

export const finishMockExamAPI = async (attemptId: number | string) => ({
  data: (await examsApi.finish(Number(attemptId))) as MockFinalResult,
})

export const getSpecificResultAPI = async (attemptId: number | string) => ({
  data: (await examsApi.result(Number(attemptId))) as MockFinalResult,
})

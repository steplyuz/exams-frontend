// Reading.ts bilan bir xil naqsh — qarang shu yerdagi izoh.
// DIQQAT: Listening submission backendda boshqacha shaklda —
// `user_answers: { [question_number: string]: string }` (Reading/Writing'dagi
// `answers: [{question_id, ...}]` massividan farqli).
import { examsApi, listeningApi } from '@/lib/api/endpoints'
import type { ListeningResultDetail, ListeningTest } from '@/lib/api/types'

export interface ListeningSubmission {
  exam_id: string
  user_answers: Record<string, string>
  exam_attempt_id?: number | null
}

export const getListeningExamsAPI = async () => ({ data: await listeningApi.getAll() })

export const getListeningExamByIdAPI = async (examId: string) => {
  if (!examId) throw new Error('examId is required')
  return { data: (await listeningApi.get(examId)) as ListeningTest }
}

export const submitListeningExamAPI = async (data: ListeningSubmission) => {
  if (!data.exam_id) throw new Error('exam_id is required')
  return {
    data: (await examsApi.submitListening(data.exam_id, {
      user_answers: data.user_answers,
      exam_attempt_id: data.exam_attempt_id ?? null,
    })) as ListeningResultDetail,
  }
}

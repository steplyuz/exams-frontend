// Reading.ts bilan bir xil naqsh — qarang shu yerdagi izoh.
// Writing natijasi darhol emas: `is_finalized=false` bilan qaytadi,
// o'qituvchi/admin `/admin/writing-tests/results/{id}/grade` orqali keyin baholaydi.
import { examsApi, writingApi } from '@/lib/api/endpoints'
import type { WritingExam, WritingResult } from '@/lib/api/types'

export interface WritingAnswerItem {
  task_id: number
  content: string
}

export interface WritingSubmission {
  answers: WritingAnswerItem[]
}

export const getAllWritingExamsAPI = async () => ({ data: await writingApi.getAll() })

export const getWritingExamByIdAPI = async (examId: string) => {
  if (!examId) throw new Error('examId is required')
  return { data: (await writingApi.get(examId)) as WritingExam }
}

export const submitWritingExamAPI = async (examId: string, payload: WritingSubmission) => {
  if (!examId) throw new Error('examId is required')
  return { data: (await examsApi.submitWriting(examId, payload)) as WritingResult }
}

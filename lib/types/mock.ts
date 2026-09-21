// `lib/cefr-api/mock.ts` uchun turlar. Bu fayl ilgari yo'q edi (checkpoint
// hujjatida qayd etilgan "missing @/lib/types/mock" muammosi) — shu sabab
// loyiha kompilyatsiya bo'lmas edi. Maydonlar backend javoblariga (mock-test
// user_router.py va mock_test/mvp_router.py) asoslangan; aniq maydon
// to'plamini backend javobini ko'rib kerak bo'lsa toraytiring/kengaytiring.

export interface UserMockExamResponse {
  id: string
  title?: string
  status?: string
  [key: string]: unknown
}

export interface MockExamStartResponse {
  attempt_id: number | string
  [key: string]: unknown
}

export interface MockSkillStatusResponse {
  skill: 'READING' | 'LISTENING' | 'WRITING' | 'SPEAKING'
  status: string
  [key: string]: unknown
}

export interface MockSkillSubmit {
  raw_score: number
  user_answers: unknown
}

export interface MockSkillAttemptResponse {
  attempt_id: number | string
  skill?: string
  status?: string
  [key: string]: unknown
}

export interface MockExamResult {
  overall_score?: number
  cefr_level?: string
  listening_ball?: number
  reading_ball?: number
  writing_ball?: number
  speaking_ball?: number
  [key: string]: unknown
}

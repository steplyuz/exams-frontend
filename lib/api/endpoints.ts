import { apiDelete, apiGet, apiPatch, apiPost, apiPostForm, apiPut, baseUrl, notifyAuthChanged } from './client'
import type {
  AdminStatistics, AnswerKeyResponse, AssignedSpeakingTest, AuthToken, EnrolledExam, ExamsLoginInitResponse,
  ExamsLoginVerifyResponse, ExamsMe, ExamSession, ExamSessionCreateInput,
  ExamVersion, ListeningCreateInput, ListeningResultDetail, ListeningResultSummary, ListeningSubmitInput,
  ListeningTest, ListeningUpdateInput, LockResult,
  LoginResponse, Me, MockAttemptStart, MockExam, MockExamCreateInput, MockExamUpdateInput,
  MockFinalResult, MockSkillStatus, ReadingCreateInput, ReadingResultDetail,
  ReadingResultSummary, ReadingSubmitInput, ReadingTest, ReadingUpdateInput, RegisterForSessionInput,
  RegisterResponse, RegisterVerifyResponse, Session, SessionRegistration, SkillType,
  SpeakingResult, SpeakingResultInput, SpeakingSubmission, SpeakingTest, SpeakingTestCreateInput,
  SpeakingTestSummary, SpeakingTestUpdateInput, StatusMessage, UserProfile, WritingExam,
  WritingResult, WritingSubmitInput, WritingPendingItem, PublicExamDetail, PublicExamSession, PublicSessionDetail, PublicStats, VerifiedResult,
} from './types'

// -----------------------------------------------------------------------------
// 2026-09-20: backend URL'lari to'liq qayta tartiblandi (fe'l-asosidagi
// /get_all, /create, /update/{id} o'rniga oddiy HTTP metod + ko'plik resurs
// nomi; /mock-test -> /mock-exams; admin/user routerlari ajratildi).
//
// examx.steply.uz (bu loyiha) FAQAT `examsAuthApi`/`examsApi` orqali
// autentifikatsiya qilinadi — MK ID + SMS OTP (asosiy Steply `authApi`/
// `profileApi` bilan HECH QANDAY aloqasi yo'q, ular boshqa cookie/JWT
// domeni). Reading/Listening/Writing/Speaking test KONTENTI (savollar)
// PUBLIC bo'lgani uchun to'g'ridan-to'g'ri `readingApi.get()` va hokazo
// orqali olinadi, lekin JAVOB YUBORISH esa `examsApi.submitReading()`
// kabi funksiyalar orqali — chunki oddiy `readingApi.submit()` asosiy
// Steply loginini talab qiladi, exams-auth sessiyasida esa u yo'q.
//
// Xatolik javobi doim shu shaklda keladi (backend: app/core/errors.py):
//   { error: { status_code, code, message, fields } }
// `client.ts` buni ApiRequestError.code / .message / .fields orqali beradi.
// -----------------------------------------------------------------------------

// ============ EXAMS-AUTH (examx.steply.uz — MK ID + SMS OTP) ============
// /exams-auth/* — 2 bosqichli login: MK ID -> SMS kod -> tasdiqlash.

export const examsAuthApi = {
  login: (mkId: string) =>
    apiPost<ExamsLoginInitResponse>('/exams-auth/login', { mk_id: mkId }, { anonymous: true }),

  loginVerify: async (mkId: string, code: string) => {
    const res = await apiPost<ExamsLoginVerifyResponse>(
      '/exams-auth/login/verify',
      { mk_id: mkId, code },
      { anonymous: true },
    )
    if (res.status === 'success') notifyAuthChanged()
    return res
  },

  me: () => apiGet<ExamsMe>('/exams-auth/me'),

  refresh: () => apiPost<StatusMessage>('/exams-auth/refresh', undefined, { anonymous: true, skipAuthRetry: true }),

  logout: async () => {
    try {
      await apiPost<StatusMessage>('/exams-auth/logout')
    } finally {
      notifyAuthChanged()
    }
  },
}

// ============ EXAMS (MK ID sessiyasiga biriktirilgan imtihon) ============
// /exams/* — faqat exams-auth bilan himoyalangan: ro'yxat, boshlash,
// holat, javob yuborish, yakunlash, natija.

export const examsApi = {
  list: () => apiGet<EnrolledExam[]>('/exams'),
  start: (examId: string) => apiPost<MockAttemptStart>(`/exams/${encodeURIComponent(examId)}/start`),
  status: (attemptId: number) => apiGet<MockSkillStatus[]>(`/exams/attempts/${attemptId}/status`),
  finish: (attemptId: number) => apiPost<MockFinalResult>(`/exams/attempts/${attemptId}/finish`),
  result: (attemptId: number) => apiGet<MockFinalResult>(`/exams/attempts/${attemptId}/result`),

  // Faqat OMR/qog'ozdagi natija allaqachon mavjud bo'lganda "tortib olish"
  // uchun (masalan imtihon markazida qog'ozda topshirilgan bo'lim) — online
  // javob yuborish uchun pastdagi submitReading/... funksiyalaridan
  // foydalaning, ular ikkalasini birga (saqlash + belgilash) qiladi.
  pullSkillFromExistingResult: (attemptId: number, skill: SkillType) =>
    apiPost<void>(`/exams/attempts/${attemptId}/submit/${skill}`),

  submitReading: (testId: string, input: ReadingSubmitInput) =>
    apiPost<ReadingResultDetail>(`/exams/reading/${encodeURIComponent(testId)}/submit`, input),

  submitListening: (examId: string, input: ListeningSubmitInput) =>
    apiPost<ListeningResultDetail>(`/exams/listening/${encodeURIComponent(examId)}/submit`, {
      ...input,
      exam_id: examId,
    }),

  submitWriting: (examId: string, input: WritingSubmitInput) =>
    apiPost<WritingResult>(`/exams/writing/${encodeURIComponent(examId)}/submit`, input),

  myAssignedSpeakingTest: () => apiGet<AssignedSpeakingTest>('/exams/speaking/me/assigned-test'),

  submitSpeakingAudio: (speakingTestId: string, file: File | Blob, mockSkillAttemptId?: number) => {
    const form = new FormData()
    form.append('file', file, 'answer.webm')
    return apiPostForm<SpeakingSubmission>(`/exams/speaking/${encodeURIComponent(speakingTestId)}/submit`, form, {
      query: { mock_skill_attempt_id: mockSkillAttemptId },
    })
  },
}

// ============ AUTH ============
// /auth/* — ro'yxatdan o'tmagan (anonymous) va o'tgan foydalanuvchi aralash.

export const authApi = {
  me: () => apiGet<Me>('/auth/me'),

  sendOtp: (input: { phone: string; channel?: 'sms' | 'telegram'; purpose?: 'register' | 'reset_password' }) =>
    apiPost<StatusMessage>('/auth/otp/send', input, { anonymous: true }),

  phoneLogin: async (phone: string, password: string) => {
    const res = await apiPost<LoginResponse>('/auth/phone/login', { phone, password }, { anonymous: true })
    if (res.status === 'success') notifyAuthChanged()
    return res
  },

  register: (input: { phone: string; password: string; full_name: string; birth_date: string; gender: 'male' | 'female'; channel?: 'sms' | 'telegram' }) =>
    apiPost<RegisterResponse>('/auth/register', input, { anonymous: true }),

  // MUHIM: examx.steply.uz (bu loyiha) kirish oynasi endi `examsAuthApi`
  // orqali ishlaydi (MK ID + SMS OTP, /exams-auth/login[/verify]) — bu
  // yerdagi `authApi` faqat asosiy steply.uz uchun, hech qayerda
  // chaqirilmaydi. Fictional "/auth/candidate/login" (hech qachon
  // backendda bo'lmagan) shu sababli butunlay olib tashlandi.

  registerVerify: async (input: { phone: string; code: string }) => {
    const res = await apiPost<RegisterVerifyResponse>('/auth/register/verify', input, { anonymous: true })
    if (res.status === 'success') notifyAuthChanged()
    return res
  },

  forgotPassword: (phone: string) => apiPost<StatusMessage>('/auth/password/forgot', { phone }, { anonymous: true }),

  resetPassword: (input: { phone: string; code: string; new_password: string }) =>
    apiPost<StatusMessage>('/auth/password/reset', input, { anonymous: true }),

  logout: async () => {
    try { await apiPost<StatusMessage>('/auth/logout') } finally { notifyAuthChanged() }
  },

  refresh: () => apiPost<StatusMessage>('/auth/refresh', undefined, { anonymous: true, skipAuthRetry: true }),
}

// ============ MY PROFILE ============
// /users/me/* — faqat login qilgan foydalanuvchi (registered).

export const profileApi = {
  me: () => apiGet<Me>('/users/me/'),
  update: (input: Partial<Pick<UserProfile, 'full_name' | 'username' | 'bio' | 'birth_date' | 'language' | 'timezone'>>) =>
    apiPut<Me>('/users/me/profile', input),
  uploadAvatar: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return apiPostForm<{ avatar_url: string }>('/users/me/avatar', form)
  },
  contacts: () => apiGet<Me['contacts']>('/users/me/contacts'),
  addContact: (input: { contact_type: 'email' | 'phone'; value: string }) =>
    apiPost<void>('/users/me/contacts', input),
  setPrimaryContact: (contactId: number) => apiPatch<void>(`/users/me/contacts/${contactId}/primary`),
  deleteContact: (contactId: number) => apiDelete<void>(`/users/me/contacts/${contactId}`),
  sessions: () => apiGet<Session[]>('/users/me/sessions'),
  revokeSession: (sessionId: string) => apiDelete<void>(`/users/me/sessions/${sessionId}`),
}

// ============ PUBLIC MOCK CENTER ============
// /public/* — token shart emas, hamma ko'ra oladi.

export const publicApi = {
  mockExams: () => apiGet<MockExam[]>('/public/mock-exams', { anonymous: true }),
  mockExam: (examId: string) => apiGet<PublicExamDetail>(`/public/mock-exams/${encodeURIComponent(examId)}`, { anonymous: true }),
  examSessions: (examId: string) => apiGet<PublicExamSession[]>(`/public/mock-exams/${encodeURIComponent(examId)}/sessions`, { anonymous: true }),
  sessions: (region?: string) => apiGet<PublicExamSession[]>('/public/sessions', { anonymous: true, query: { region } }),
  session: (sessionId: number) => apiGet<PublicSessionDetail>(`/public/sessions/${sessionId}`, { anonymous: true }),
  stats: () => apiGet<PublicStats>('/public/stats', { anonymous: true }),
  resultByQr: (token: string) => apiGet<VerifiedResult>(`/public/results/by-qr/${encodeURIComponent(token)}`, { anonymous: true }),
}

// ============ MOCK EXAMS ============
// User: /mock-exams/*  |  Admin: /admin/mock-exams/*  |  Papers/Grading: /admin/mock-exams/papers|grade/*
// DIQQAT: bu obyekt asosiy Steply (steply.uz) foydalanuvchisi sifatida
// kirgan mijoz uchun (masalan onlayn "sotib olish" oqimi). examx.steply.uz
// talabasi (MK ID orqali) buning o'rniga yuqoridagi `examsApi`dan
// foydalanadi — ikkalasi butunlay boshqa auth domeni.

export const mockExamsApi = {
  // --- Admin (prefix: /admin/mock-exams) ---
  adminList: () => apiGet<MockExam[]>('/admin/mock-exams'),
  adminGet: (examId: string) => apiGet<MockExam>(`/admin/mock-exams/${examId}`),
  create: (input: MockExamCreateInput) => apiPost<MockExam>('/admin/mock-exams', input),
  update: (examId: string, input: MockExamUpdateInput) => apiPatch<MockExam>(`/admin/mock-exams/${examId}`, input),
  remove: (examId: string) => apiDelete<void>(`/admin/mock-exams/${examId}`),

  // --- Candidate (prefix: /mock-exams) ---
  getAll: () => apiGet<MockExam[]>('/mock-exams'),
  buy: (examId: string) => apiPost<{ id: number; user_id: string; mock_exam_id: string; is_active: boolean; comment: string; created_at: string }>(`/mock-exams/${examId}/buy`),

  start: (examId: string) => apiPost<MockAttemptStart>(`/mock-exams/${examId}/start`),
  status: (attemptId: number) => apiGet<MockSkillStatus[]>(`/mock-exams/attempts/${attemptId}/status`),
  submitSkill: (attemptId: number, skill: SkillType) => apiPost<void>(`/mock-exams/attempts/${attemptId}/submit/${skill}`),
  finish: (attemptId: number) => apiPost<MockFinalResult>(`/mock-exams/attempts/${attemptId}/finish`),

  result: (attemptId: number) => apiGet<MockFinalResult>(`/mock-exams/attempts/${attemptId}/result`),

  // --- Exam sessions (paper-based, in-person) ---
  createSession: (input: ExamSessionCreateInput) => apiPost<ExamSession>('/admin/mock-exams/sessions', input),
  updateSession: (sessionId: number, input: Partial<ExamSessionCreateInput>) =>
    apiPatch<ExamSession>(`/admin/mock-exams/sessions/${sessionId}`, input),
  adminSessions: () => apiGet<ExamSession[]>('/admin/mock-exams/sessions'),
  openSessions: () => apiGet<ExamSession[]>('/mock-exams/sessions/open'),
  sessionRegistrations: (sessionId: number) => apiGet<SessionRegistration[]>(`/admin/mock-exams/sessions/${sessionId}/registrations`),
  confirmAttendance: (registrationId: number) =>
    apiPost<SessionRegistration>(`/admin/mock-exams/registrations/${registrationId}/confirm-attendance`),

  registerForSession: (input: RegisterForSessionInput) => apiPost<SessionRegistration>('/mock-exams/sessions/register', input),
  myRegistrations: () => apiGet<SessionRegistration[]>('/mock-exams/me/registrations'),

  // --- Paper-based downloads (admin, prefix: /admin/mock-exams/papers) ---
  listeningPaperUrl: (mockExamId: string) => `${baseUrl}/api/v1/admin/mock-exams/papers/${mockExamId}/listening.pdf`,
  readingPaperUrl: (mockExamId: string) => `${baseUrl}/api/v1/admin/mock-exams/papers/${mockExamId}/reading.pdf`,
  writingPaperUrl: (mockExamId: string) => `${baseUrl}/api/v1/admin/mock-exams/papers/${mockExamId}/writing.pdf`,
  answerSheetsBulkZipUrl: (sessionId: number) => `${baseUrl}/api/v1/admin/mock-exams/papers/sessions/${sessionId}/answer-sheets-bulk.zip`,
  sessionBundleZipUrl: (sessionId: number) => `${baseUrl}/api/v1/admin/mock-exams/papers/sessions/${sessionId}/bundle.zip`,

  // --- AI answer-sheet grading (admin, prefix: /admin/mock-exams/grade) ---
  gradeAnswerSheets: (images: File[]) => {
    const form = new FormData()
    images.forEach((f) => form.append('images', f))
    return apiPostForm<Record<string, unknown>>('/admin/mock-exams/grade/answer-sheets', form)
  },
  gradeAnswerSheetsWithKeys: (images: File[], input: { listening_answer_key?: string; reading_answer_key?: string; exam_id?: string }) => {
    const form = new FormData()
    images.forEach((f) => form.append('images', f))
    if (input.listening_answer_key) form.append('listening_answer_key', input.listening_answer_key)
    if (input.reading_answer_key) form.append('reading_answer_key', input.reading_answer_key)
    if (input.exam_id) form.append('exam_id', input.exam_id)
    return apiPostForm<Record<string, unknown>>('/admin/mock-exams/grade/answer-sheets/with-keys', form)
  },
  saveGradedAnswerSheets: (input: Record<string, unknown>) => apiPost<Record<string, unknown>>('/admin/mock-exams/grade/answer-sheets/save', input),
  previewAnswerSheet: (image: File) => {
    const form = new FormData()
    form.append('image', image)
    return apiPostForm<Record<string, unknown>>('/admin/mock-exams/grade/answer-sheets/preview', form)
  },
}

// ============ MOCK CENTER (MVP — paper-based, alohida oqim) ============
// User: /mock-exams/center/me/*  |  Admin: /admin/mock-exams/center/*
// Diqqat: bu `mockExamsApi`dagi "sessions/register" oqimidan BUTUNLAY BOSHQA,
// alohida "mock center" moduli — ikkalasini aralashtirmang.

export const mockCenterApi = {
  // --- Foydalanuvchi (registered) ---
  // Diqqat: ro'yxatga yozilishning o'zi backendda "center" ostida emas,
  // umumiy /mock-exams/sessions/register orqali amalga oshadi (mockExamsApi
  // bilan bir xil backend endpoint) — natija va ro'yxatlarni ko'rish esa
  // /mock-exams/center/me/* orqali.
  registerForSession: (input: RegisterForSessionInput) => apiPost<SessionRegistration>('/mock-exams/sessions/register', input),
  myRegistrations: () => apiGet<SessionRegistration[]>('/mock-exams/center/me/registrations'),
  registration: (id: number) => apiGet<Record<string, unknown>>(`/mock-exams/center/me/registrations/${id}`),
  permitUrl: (id: number) => `${baseUrl}/api/v1/mock-exams/center/me/registrations/${id}/permit.pdf`,
  myResults: () => apiGet<Record<string, unknown>[]>('/mock-exams/center/me/results'),
  result: (id: number) => apiGet<Record<string, unknown>>(`/mock-exams/center/me/results/${id}`),
  resultPdfUrl: (id: number) => `${baseUrl}/api/v1/mock-exams/center/me/results/${id}/pdf`,

  // --- Admin (require_role ADMIN) ---
  checkInSearch: (studentId: string, sessionId?: number) => apiGet<Record<string, unknown>>('/admin/mock-exams/center/check-in/search', { query: { student_id: studentId, session_id: sessionId } }),
  checkIn: (studentId: string, sessionId?: number) => apiPost<Record<string, unknown>>('/admin/mock-exams/center/check-in', { student_id: studentId, session_id: sessionId }),
  attempt: (attemptId: number) => apiGet<Record<string, unknown>>(`/admin/mock-exams/center/attempts/${attemptId}`),
  scoreSkill: (attemptId: number, skill: 'READING' | 'LISTENING' | 'WRITING' | 'SPEAKING', scaled_score: number, raw_score?: number) =>
    apiPost<Record<string, unknown>>(`/admin/mock-exams/center/attempts/${attemptId}/skills/${skill}/score`, { scaled_score, raw_score }),
  finalizeAttempt: (attemptId: number, send_sms = false) => apiPost<Record<string, unknown>>(`/admin/mock-exams/center/attempts/${attemptId}/finalize`, { send_sms }),
  writingPending: (status: 'pending' | 'graded' | 'all' = 'pending') =>
    apiGet<WritingPendingItem[]>('/admin/mock-exams/center/writing/pending', { query: { status } }),
}

// ============ CEFR READING ============
// GET/list — PUBLIC (auth shart emas). CRUD — /admin/reading-tests.
// Javob yuborish (`submit`) esa ASOSIY Steply loginini talab qiladi —
// examx.steply.uz buni ISHLATMASIN, buning o'rniga `examsApi.submitReading()`
// (exams-auth orqali, /exams/reading/{id}/submit) dan foydalaning.

export const readingApi = {
  create: (input: ReadingCreateInput) => apiPost<ReadingTest>('/admin/reading-tests', input),
  importJson: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return apiPostForm<ReadingTest>('/admin/reading-tests/import-json', form)
  },
  getAll: () => apiGet<ReadingTest[]>('/reading-tests', { anonymous: true }),
  get: (testId: string) => apiGet<ReadingTest>(`/reading-tests/${testId}`, { anonymous: true }),
  update: (testId: string, input: ReadingUpdateInput) => apiPut<ReadingTest>(`/admin/reading-tests/${testId}`, input),
  remove: (testId: string) => apiDelete<void>(`/admin/reading-tests/${testId}`),
  /** @deprecated Asosiy Steply login talab qiladi. examx.steply.uz uchun `examsApi.submitReading()` dan foydalaning. */
  submit: (testId: string, input: ReadingSubmitInput) => apiPost<ReadingResultDetail>(`/reading-tests/${testId}/submit`, input),
  myResults: () => apiGet<ReadingResultSummary[]>('/reading-tests/me/results'),
  allResults: () => apiGet<ReadingResultSummary[]>('/admin/reading-tests/results'),
  resultDetail: (resultId: number) => apiGet<ReadingResultDetail>(`/reading-tests/me/results/${resultId}`),

  // --- Lock / versions / paper (admin) ---
  answerKey: (testId: string, version?: number) =>
    apiGet<AnswerKeyResponse>(`/admin/reading-tests/${testId}/answer-key`, { query: { version } }),
  versions: (testId: string) => apiGet<ExamVersion[]>(`/admin/reading-tests/${testId}/versions`),
  lock: (testId: string) => apiPost<LockResult>(`/admin/reading-tests/${testId}/lock`),
  paperPdfUrl: (testId: string) => `${baseUrl}/api/v1/admin/reading-tests/${testId}/paper-pdf`,
  answerSheetUrl: (testId: string) => `${baseUrl}/api/v1/admin/reading-tests/${testId}/answer-sheet`,
}

// ============ CEFR LISTENING ============

export const listeningApi = {
  create: (input: ListeningCreateInput) => apiPost<ListeningTest>('/admin/listening-tests', input),
  importJson: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return apiPostForm<ListeningTest>('/admin/listening-tests/import-json', form)
  },
  getAll: () => apiGet<ListeningTest[]>('/listening-tests', { anonymous: true }),
  get: (examId: string) => apiGet<ListeningTest>(`/listening-tests/${examId}`, { anonymous: true }),
  update: (examId: string, input: ListeningUpdateInput) => apiPut<ListeningTest>(`/admin/listening-tests/${examId}`, input),
  remove: (examId: string) => apiDelete<void>(`/admin/listening-tests/${examId}`),
  /** @deprecated Asosiy Steply login talab qiladi. examx.steply.uz uchun `examsApi.submitListening()` dan foydalaning. */
  submit: (examId: string, input: ListeningSubmitInput) => apiPost<ListeningResultDetail>(`/listening-tests/${examId}/submit`, input),
  myResults: () => apiGet<ListeningResultSummary[]>('/listening-tests/me/results'),
  allResults: () => apiGet<ListeningResultSummary[]>('/admin/listening-tests/results'),
  resultDetail: (resultId: number) => apiGet<ListeningResultDetail>(`/listening-tests/me/results/${resultId}`),

  // --- Lock / versions / paper (admin) ---
  answerKey: (examId: string, version?: number) =>
    apiGet<AnswerKeyResponse>(`/admin/listening-tests/${examId}/answer-key`, { query: { version } }),
  versions: (examId: string) => apiGet<ExamVersion[]>(`/admin/listening-tests/${examId}/versions`),
  lock: (examId: string) => apiPost<LockResult>(`/admin/listening-tests/${examId}/lock`),
  paperPdfUrl: (examId: string) => `${baseUrl}/api/v1/admin/listening-tests/${examId}/paper-pdf`,
  answerSheetUrl: (examId: string) => `${baseUrl}/api/v1/admin/listening-tests/${examId}/answer-sheet`,
  uploadAudio: (file: File) => { const form = new FormData(); form.append('file', file); return apiPostForm<{ url: string; filename: string; size: number }>('/admin/listening-tests/audio/upload', form) },
}

// ============ WRITING ============

export const writingApi = {
  create: (input: Record<string, unknown>) => apiPost<WritingExam>('/admin/writing-tests', input),
  importJson: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return apiPostForm<WritingExam>('/admin/writing-tests/import-json', form)
  },
  getAll: () => apiGet<WritingExam[]>('/writing-tests', { anonymous: true }),
  get: (examId: string) => apiGet<WritingExam>(`/writing-tests/${examId}`, { anonymous: true }),
  update: (examId: string, input: Record<string, unknown>) => apiPut<WritingExam>(`/admin/writing-tests/${examId}`, input),
  remove: (examId: string) => apiDelete<void>(`/admin/writing-tests/${examId}`),
  /** @deprecated Asosiy Steply login talab qiladi. examx.steply.uz uchun `examsApi.submitWriting()` dan foydalaning. */
  submit: (examId: string, input: WritingSubmitInput) => apiPost<WritingResult>(`/writing-tests/${examId}/submit`, input),
  myResults: () => apiGet<WritingResult[]>('/writing-tests/me/results'),
  allResults: () => apiGet<WritingResult[]>('/admin/writing-tests/results'),
  result: (resultId: number) => apiGet<WritingResult>(`/writing-tests/results/${resultId}`),
  resultPdfUrl: (resultId: number) => `${baseUrl}/api/v1/writing-tests/results/${resultId}/pdf`,
  paperPdfUrl: (examId: string) => `${baseUrl}/api/v1/admin/writing-tests/${examId}/paper-pdf`,

  // Scoring rubric formats (yaratish/o'chirish admin, o'qish ochiq)
  createFormat: (input: Record<string, unknown>) => apiPost<Record<string, unknown>>('/admin/writing-tests/formats', input),
  getAllFormats: () => apiGet<Record<string, unknown>[]>('/writing-tests/formats', { anonymous: true }),
  getFormat: (formatId: number) => apiGet<Record<string, unknown>>(`/writing-tests/formats/${formatId}`, { anonymous: true }),
  removeFormat: (formatId: number) => apiDelete<void>(`/admin/writing-tests/formats/${formatId}`),
  // Qo'lda baholash (admin/teacher) — AI baholash ISHLATILMAYDI.
  pendingResults: () => apiGet<WritingResult[]>('/admin/writing-tests/pending'),
  gradeResult: (resultId: number, input: { raw_score: number; cefr_level: string; feedback?: string | null }) =>
    apiPost<WritingResult>(`/admin/writing-tests/results/${resultId}/grade`, input),
}

// ============ SPEAKING ============
// DIQQAT: `myAssignedTest`/`submitAudio` examx.steply.uz talabasi
// (exams-auth, MK ID) uchun — shu sabab ular /exams/speaking/* ga
// yo'naltiriladi, /speaking-tests/* ga EMAS (bu asosiy Steply login talab
// qiladi). Boshqa funksiyalar (admin CRUD, practice katalog, baholash
// navbati) hali ham /speaking-tests va /admin/speaking-tests orqali.

export const speakingApi = {
  listTests: () => apiGet<SpeakingTestSummary[]>('/admin/speaking-tests'),
  createTest: (input: SpeakingTestCreateInput) => apiPost<SpeakingTest>('/admin/speaking-tests', input),
  getTest: (testId: string) => apiGet<SpeakingTest>(`/admin/speaking-tests/${testId}`),
  updateTest: (testId: string, input: SpeakingTestUpdateInput) => apiPut<SpeakingTest>(`/admin/speaking-tests/${testId}`, input),
  removeTest: (testId: string) => apiDelete<void>(`/admin/speaking-tests/${testId}`),

  practiceTests: () => apiGet<SpeakingTestSummary[]>('/speaking-tests/practice', { anonymous: true }),
  practiceTest: (testId: string) => apiGet<SpeakingTest>(`/speaking-tests/practice/${testId}`, { anonymous: true }),
  mockAccess: (input: Record<string, unknown>) => apiPost<Record<string, unknown>>('/speaking-tests/mock-access', input, { anonymous: true }),

  // examx.steply.uz (exams-auth) — bitta MK-ID sessiyasiga biriktirilgan test.
  assignedTest: (mockSkillAttemptId: number) => apiGet<AssignedSpeakingTest>(`/exams/speaking/attempts/${mockSkillAttemptId}/assigned-test`),
  myAssignedTest: () => apiGet<AssignedSpeakingTest>('/exams/speaking/me/assigned-test'),
  submitAudio: (speakingTestId: string, file: File | Blob, mockSkillAttemptId?: number) => {
    const form = new FormData()
    form.append('file', file, 'answer.webm')
    return apiPostForm<SpeakingSubmission>(`/exams/speaking/${speakingTestId}/submit`, form, { query: { mock_skill_attempt_id: mockSkillAttemptId } })
  },

  // Baholovchi (SPEAKING_EVALUATOR/ADMIN) navbati — /admin/speaking-tests ostida.
  pendingSubmissions: () => apiGet<SpeakingSubmission[]>('/admin/speaking-tests/pending'),
  submitResult: (submissionId: number, input: SpeakingResultInput) =>
    apiPost<SpeakingResult>(`/admin/speaking-tests/submissions/${submissionId}/result`, input),
}

// ============ PRACTICE ============
// Backendda mavjud, ilgari frontendda umuman chaqirilmagan edi.

export const practiceApi = {
  tests: () => apiGet<Record<string, unknown>[]>('/practice/tests'),
}

// ============ BILLING ============
// User: /billing/*  |  Admin: /admin/billing/*
// Backendda mavjud, ilgari frontendda umuman chaqirilmagan edi.

export const billingApi = {
  plans: () => apiGet<Record<string, unknown>[]>('/billing/plans'),
  products: (productType?: string) => apiGet<Record<string, unknown>[]>('/billing/products', { query: { product_type: productType } }),
  createOrder: (input: Record<string, unknown>) => apiPost<Record<string, unknown>>('/billing/orders', input),
  uploadReceipt: (orderId: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return apiPostForm<Record<string, unknown>>(`/billing/orders/${orderId}/receipt`, form)
  },
  myOrders: (offset = 0, limit = 25) => apiGet<Record<string, unknown>[]>('/billing/orders', { query: { offset, limit } }),
  orderDetail: (orderId: string) => apiGet<Record<string, unknown>>(`/billing/orders/${orderId}`),
  mySubscription: () => apiGet<Record<string, unknown>>('/billing/me/subscription'),

  // --- Admin ---
  adminProducts: () => apiGet<Record<string, unknown>[]>('/admin/billing/products'),
  createProduct: (input: Record<string, unknown>) => apiPost<Record<string, unknown>>('/admin/billing/products', input),
  adminOrders: (status?: string, offset = 0, limit = 50) => apiGet<Record<string, unknown>[]>('/admin/billing/orders', { query: { status, offset, limit } }),
  approveOrder: (orderId: string, comment?: string) => apiPost<Record<string, unknown>>(`/admin/billing/orders/${orderId}/approve`, { comment }),
  rejectOrder: (orderId: string, comment?: string) => apiPost<Record<string, unknown>>(`/admin/billing/orders/${orderId}/reject`, { comment }),
}

// ============ ADMIN ============
// /admin/* (mock-test bilan bog'liq bo'lmagan umumiy admin funksiyalar)

export const adminApi = {
  statistics: () => apiGet<AdminStatistics>('/admin/statistics'),
  dashboard: () => apiGet<Record<string, unknown>>('/admin/dashboard'),
  exportUsersUrl: () => `${baseUrl}/api/v1/admin/export/users`,

  // Mock-center (paper-based) admin harakatlar — mockCenterApi bilan bir xil
  // backend endpointlariga ishora qiladi, faqat shu joyda ham chaqirilgani
  // uchun bu yerda ham qoldirildi.
  checkInSearch: (studentId: string, sessionId?: number) => apiGet<Record<string, unknown>>('/admin/mock-exams/center/check-in/search', { query: { student_id: studentId, session_id: sessionId } }),
  checkIn: (studentId: string, sessionId?: number) => apiPost<Record<string, unknown>>('/admin/mock-exams/center/check-in', { student_id: studentId, session_id: sessionId }),
  finalize: (attemptId: number, send_sms = false) => apiPost<Record<string, unknown>>(`/admin/mock-exams/center/attempts/${attemptId}/finalize`, { send_sms }),

  users: (params?: { search?: string; role?: string; is_active?: boolean; offset?: number; limit?: number }) =>
    apiGet<Record<string, unknown>[]>('/admin/users', { query: params }),
  userDetail: (userId: string) => apiGet<Record<string, unknown>>(`/admin/users/${userId}`),
  updateUser: (userId: string, input: Record<string, unknown>) => apiPatch<Record<string, unknown>>(`/admin/users/${userId}`, input),

  registrations: (params?: { session_id?: number; status?: string; offset?: number; limit?: number }) =>
    apiGet<Record<string, unknown>[]>('/admin/registrations', { query: params }),
  updateRegistrationStatus: (registrationId: number, status: string) =>
    apiPatch<Record<string, unknown>>(`/admin/registrations/${registrationId}/status`, { status }),

  // userId — UUID string (backend user_id endi to'g'ri UUID sifatida qabul qilinadi).
  attempts: (sessionId?: number, userId?: string) => apiGet<Record<string, unknown>[]>('/admin/attempts', { query: { session_id: sessionId, user_id: userId } }),
  results: (status?: string) => apiGet<Record<string, unknown>[]>('/admin/results', { query: { status } }),

  omrSubmissions: (params?: { module?: string; status?: string; candidate_id?: string; limit?: number }) =>
    apiGet<Record<string, unknown>[]>('/admin/omr/submissions', { query: params }),
  omrSubmission: (submissionId: number) => apiGet<Record<string, unknown>>(`/admin/omr/submissions/${submissionId}`),
  updateOmrStatus: (submissionId: number, status: string) =>
    apiPatch<Record<string, unknown>>(`/admin/omr/submissions/${submissionId}/status`, undefined, { query: { status } }),
}

// ============ SYSTEM ============
// Root va health-check /api/v1 prefiksisiz, shuning uchun to'g'ridan-to'g'ri fetch qilinadi.

export const systemApi = {
  root: () => fetch(`${baseUrl}/`).then((r) => r.json()),
  health: () => fetch(`${baseUrl}/health`).then((r) => r.json()),
}

// lib/types/listening.ts

export type ListeningQuestionType =
  | 'MULTIPLE_CHOICE'
  | 'GAP_FILL'
  | 'MATCHING'
  | 'MAP_DIAGRAM'
  | 'SENTENCE_COMPLETION'
  | 'SHORT_ANSWER'

export interface Option {
  value: string
  label: string
}

export interface ListeningQuestion {
  id: number
  questionNumber: number
  type: ListeningQuestionType
  question?: string
  correctAnswer: string
  options?: Option[]
}

export interface ListeningPart {
  id: number
  partNumber: number
  title: string
  instruction: string
  taskType: string
  audioLabel: string
  context?: string
  passage?: string // Gap fill matni
  mapImage?: string // Map labeling rasmi
  options?: Option[] // Part darajasidagi optionlar (Matching/Map)
  questions: ListeningQuestion[]
}

export interface ListeningExam {
  id: string
  title: string
  isDemo: boolean
  isFree: boolean
  sections: string
  level: string
  duration: number
  totalQuestions: number
  parts: ListeningPart[]
}

// ----------------------------------------------------
// ✅ UPDATE INTERFACE (To'liq varianti)
// ----------------------------------------------------
export interface ListeningExamUpdate {
  title?: string;
  isDemo?: boolean;
  isFree?: boolean;
  sections?: string;      // Masalan: "Sections: 1, 2, 3..."
  level?: string;         // Masalan: "B2" yoki "IELTS 6.0"
  duration?: number;      // Minut hisobida
  totalQuestions?: number;
  
  // Agar Backendda "parts" ni ham update qilish logikasi yozilgan bo'lsa:
  parts?: ListeningPart[]; 
}

// 📥 Imtihonni topshirish uchun (Submission)
export interface ListeningSubmission {
  exam_id: string;
  user_answers: Record<string, string>; // { "savol_id": "foydalanuvchi_javobi" }
}

// 📤 Hisoblangan natijani qabul qilish uchun (Result Response)
export interface ListeningResultResponse {
  summary: any
  id: number;
  exam_id: string;
  total_questions: number;
  correct_answers: number;
  standard_score: number; // Agentlikning 75 ballik shkalasi
  cefr_level: 'B1' | 'B2' | 'C1' | 'B1 dan quyi';
  user_answers: Record<string, string>;
  created_at: string; // ISO Date string
}

// 🔍 Xatolar tahlili uchun (Review Detail)
export interface ListeningReviewItem {
  question_number: number;
  user_answer: string;
  correct_answer: string;
  is_correct: boolean;
}
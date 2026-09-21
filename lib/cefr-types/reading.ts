export enum QuestionType {
  MULTIPLE_CHOICE = "MULTIPLE_CHOICE",
  TRUE_FALSE_NOT_GIVEN = "TRUE_FALSE_NOT_GIVEN",
  GAP_FILL = "GAP_FILL",
  GAP_FILL_FILL = "GAP_FILL_FILL",
  HEADINGS_MATCH = "HEADINGS_MATCH",
  MULTIPLE_SELECT = "MULTIPLE_SELECT",
  TEXT_MATCH = "TEXT_MATCH",
}

export interface Option {
  label: string; 
  value: string; 
}

export interface Question {
  id?: number;
  question_number?: number; 
  type: QuestionType;
  text: string;
  correct_answer: string;
  word_limit?: number; 
  options?: Option[];
}

export interface ReadingPart {
  id?: number;
  title: string;
  description: string;
  passage: string;
  questions: Question[];
}

export interface ReadingExam {
  id: string;
  title: string;
  cefr_level: string;
  duration_minutes: number;
  language: string;
  isFree?: boolean;
  isDemo?: boolean;
  type?: string; 
  total_questions?: number;
  parts: ReadingPart[];
}

// --- SUBMISSION & RESULTS ---

export interface ResultSummary {
  id: number;
  exam_id?: string;
  raw_score: number;
  standard_score?: number; // Optional: Readingda har doim ham kelmasligi mumkin
  cefr_level: string;
  percentage: number;
  created_at: string;
}

export interface QuestionReview {
  question_number: number;
  user_answer: string;
  correct_answer: string;
  is_correct: boolean;
  type: QuestionType;
}

export interface ReadingResultDetail {
  // Backend formatiga moslashuvchanlik:
  summary: ResultSummary; 
  review: QuestionReview[];
}

export interface ReadingExamUpdate extends Partial<Omit<ReadingExam, 'id'>> {}
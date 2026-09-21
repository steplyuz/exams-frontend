export interface WritingTaskFormat {
  id: number;
  name: string;
  cefr_level: string;
  min_words: number;
  max_words: number;
  style: string;
  scoring_mode: string;
  penalty_enabled: boolean;
}

export interface WritingTask {
  id: number;
  part_number: number;
  sub_part: number;
  topic: string;
  instruction: string;
  context_text: string;
  created_at: string;
  format: WritingTaskFormat;
}

export interface WritingExam {
  id: string;
  title: string;
  cefr_level: string;
  duration_minutes: number;
  is_demo: boolean;
  is_free: boolean;
  is_mock: boolean;
  is_active: boolean;
  year: number;
  sequence_number: number;
  created_at: string;
  tasks: WritingTask[];
}

export interface WritingAnswer {
  task_id: number;
  content: string;
}

export interface WritingSubmission {
  answers: WritingAnswer[];
}

export interface WritingCriterionScore {
  id: number;
  criterion: string;
  score: number;
}

export interface WritingResultAnswer {
  id: number;
  task_id: number;
  content: string;
  word_count: number;
  penalty: number;
  raw_score: number;
  scaled_score: number;
  ai_feedback: string;
  scores: WritingCriterionScore[];
}

export interface WritingResultDetail {
  id: number;
  exam_id: string;
  raw_score: number;
  scaled_score: number;
  cefr_level: string;
  is_finalized: boolean;
  created_at: string;
  answers: WritingResultAnswer[];
}
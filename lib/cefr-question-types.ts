// Admin muharriri uchun savol turlari bo'yicha tavsiyalar.
// Bular backendda qat'iy enum emas (erkin string), shuning uchun <datalist>
// orqali tavsiya sifatida ko'rsatiladi — admin xohlagan qiymatni kiritishi mumkin.

export const READING_QUESTION_TYPES = [
  'GAP_FILL',
  'MULTIPLE_CHOICE',
  'TRUE_FALSE_NOT_GIVEN',
  'YES_NO_NOT_GIVEN',
  'MATCHING',
  'MATCHING_HEADINGS',
  'SHORT_ANSWER',
  'SENTENCE_COMPLETION',
]

export const LISTENING_QUESTION_TYPES = [
  'MULTIPLE_CHOICE',
  'GAP_FILL',
  'MATCHING',
  'MAP_LABELING',
  'SHORT_ANSWER',
  'SENTENCE_COMPLETION',
]

export const READING_LANGUAGES = ['en', 'uz', 'ru']

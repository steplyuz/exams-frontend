// `components/cefr-exam/exam-header.tsx` va `writing-header.tsx` shu moduldan
// `authService.getMe()` kutadi. Bu ikkalasi HAM examx.steply.uz sahifalarida
// (imtihon boshlangandan keyingi header) ishlatiladi — ya'ni foydalanuvchi
// FAQAT exams-auth (MK ID + SMS OTP) orqali kirgan bo'ladi, asosiy Steply
// login (`authApi.me()` -> /auth/me) bu yerda ISHLAMAYDI (butunlay mustaqil,
// mos kelmaydigan token domeni). Shu sabab `examsAuthApi.me()`ga yo'naltiramiz.
import { examsAuthApi } from './endpoints'

export const authService = {
  getMe: () => examsAuthApi.me(),
}

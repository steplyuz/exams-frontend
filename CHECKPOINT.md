# examx.steply.uz — holat

Ushbu loyiha butunlay tozalanib, faqat quyidagilar qoldirildi: **ID orqali login** va
**Reading / Listening / Writing / Speaking** imtihonlari.

## Struktura

- `app/login` — nomzod ID (masalan `MK-290706568`) orqali, parolsiz kirish.
- `app/exams/layout.tsx` — auth guard (login qilinmagan bo'lsa `/login`ga yo'naltiradi) + header.
- `app/exams/page.tsx` — 4 ta bo'limga (reading/listening/writing/speaking) yo'naltiruvchi hub.
- `app/exams/reading`, `/listening`, `/writing` — ro'yxat sahifasi (`page.tsx`) + imtihon
  o'tkazish sahifasi (`start/page.tsx`), avval `app/cefr-migrated/test/*` ichida edi.
- `app/exams/speaking` — `page.tsx` (yo'riqnoma) → `pre-check` (mikrofonni tekshirish) →
  `session` (asosiy yozib olish oqimi, `components/speaking-session.tsx`).
- `app/exams/results` — natijalar ro'yxati + har bir skill uchun batafsil ko'rinish.

## O'chirilganlar

Marketing sahifalari, admin panel, `/dashboard`, `/register`, `/forgot-password`, `/verify`,
eski `app/cefr-migrated` va `app/speaking` yo'llari, to'lov/premium (`UnlockModal`) mantiqi,
va natija sahifalaridagi shaxsiy bank karta/donat vidjeti butunlay olib tashlandi.

## Muhim: backend tomonda kerak bo'ladigan narsa

`app/login` `authApi.candidateLogin()` (`lib/api/endpoints.ts`) orqali
`POST /auth/candidate/login { candidate_id }` ni chaqiradi — bu endpoint hozircha
backendda yo'q (faqat `/auth/phone/login` mavjud). Backend jamoasi buni (yoki mos
kelgan boshqa nomdagi endpointni) qo'shmaguncha, login ishlamaydi.

## Qo'shilgan komponentlar

`components/ui/{avatar,badge,card,input}.tsx` va `components/highlight-text.tsx`
avval yetishmagani uchun `cefr-migrated` kompilyatsiya bo'lmayotgan edi — endi qo'shildi.
`sonner` paketi `package.json`ga qo'shildi (kod shuni ishlatadi).

`npx tsc --noEmit` toza o'tadi.

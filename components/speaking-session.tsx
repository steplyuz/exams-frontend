'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, CheckCircle2, Mic, Square, UserRound } from 'lucide-react'
import { speakingApi } from '@/lib/api/endpoints'
import { useAuth } from '@/lib/auth/auth-context'
import type { AssignedSpeakingTest } from '@/lib/api/types'

function mimeForRecorder() {
  if (typeof MediaRecorder === 'undefined') return ''
  for (const mime of ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus']) {
    if (MediaRecorder.isTypeSupported(mime)) return mime
  }
  return ''
}

export function SpeakingSession() {
  const { isAuthenticated, isLoading } = useAuth()
  const [assigned, setAssigned] = useState<AssignedSpeakingTest | null>(null)
  const [error, setError] = useState('')
  const [recording, setRecording] = useState(false)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const recorder = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])
  const startedAt = useRef<number>(0)

  useEffect(() => {
    if (!isAuthenticated) return
    speakingApi.myAssignedTest()
      .then(setAssigned)
      .catch(e => setError(e instanceof Error ? e.message : 'Siz uchun faol Speaking sessiya topilmadi.'))
  }, [isAuthenticated])

  async function startRecording() {
    setError('')
    try {
      if (!assigned) return
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = mimeForRecorder()
      const r = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
      chunks.current = []
      startedAt.current = Date.now()
      r.ondataavailable = e => e.data.size && chunks.current.push(e.data)
      r.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        setBusy(true)
        try {
          const type = r.mimeType || 'audio/webm'
          const ext = type.includes('ogg') ? 'ogg' : 'webm'
          const blob = new Blob(chunks.current, { type })
          const file = new File([blob], `speaking-${assigned.skill_attempt_id}.${ext}`, { type })
          await speakingApi.submitAudio(assigned.speaking_test.id, file, assigned.skill_attempt_id)
          setDone(true)
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Audio yuborilmadi.')
        } finally { setBusy(false) }
      }
      recorder.current = r
      r.start(250)
      setRecording(true)
    } catch {
      setError('Mikrofonni yoqish uchun brauzer ruxsatini bering.')
    }
  }

  function stopRecording() {
    if (!recorder.current) return
    recorder.current.stop()
    recorder.current = null
    setRecording(false)
  }

  if (isLoading) return <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">Yuklanmoqda...</div>
  if (!isAuthenticated) return <div className="min-h-screen"><main className="container-shell py-16"><div className="surface mx-auto max-w-xl p-10 text-center"><UserRound className="mx-auto size-10 text-primary"/><h1 className="mt-5 text-2xl font-bold">Speaking sessiyasiga kirish</h1><p className="mt-2 text-sm text-muted-foreground">Avval tizimga kiring. Speaking faqat imtihon kuni sizga yaratilgan attempt orqali ochiladi.</p><Link href="/login?next=/exams/speaking/session" className="mt-6 inline-flex rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">Kirish</Link></div></main></div>

  const t = assigned?.speaking_test
  return <div className="min-h-screen"><main className="container-shell py-10 sm:py-14">
    <Link href="/exams" className="inline-flex items-center gap-2 text-sm text-muted-foreground"><ArrowLeft className="size-4"/> Imtihonlar</Link>
    <div className="mt-7 max-w-4xl"><p className="text-sm font-semibold uppercase tracking-[.16em] text-primary">Speaking</p><h1 className="mt-2 text-3xl font-bold">{t?.title || 'Sizga biriktirilgan test'}</h1><p className="mt-2 text-sm text-muted-foreground">Sizga backend tomonidan bitta speaking varianti biriktirilgan. Barcha qismlarga javob berib, yakunda bitta audio yuborasiz.</p>
      {error && <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {!t && !error && <div className="surface mt-6 h-40 animate-pulse"/>}
      {t && !done && <>
        <div className="mt-7 grid gap-4 md:grid-cols-2">
          {[
            ['Part 1.1', [t.part_1_1?.question_1, t.part_1_1?.question_2, t.part_1_1?.question_3]],
            ['Part 1.2', [t.part_1_2?.question_describe, t.part_1_2?.question_2, t.part_1_2?.question_3]],
            ['Part 2', [t.part_2?.question_1, t.part_2?.question_2, t.part_2?.question_3]],
            ['Part 3', [t.part_3?.topic, ...(t.part_3?.for_points || []), ...(t.part_3?.against_points || [])]],
          ].map(([name, qs]) => <section className="surface p-5" key={String(name)}><h2 className="font-bold">{name}</h2><div className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">{(qs as string[]).filter(Boolean).map((q,i)=><p key={i}>{q}</p>)}</div></section>)}
        </div>
        <div className="surface mt-6 flex flex-col items-center p-7 text-center"><div className={`flex size-16 items-center justify-center rounded-full ${recording?'bg-red-50 text-red-600':'bg-secondary text-primary'}`}><Mic className="size-7"/></div><h2 className="mt-4 font-bold">{recording?'Yozuv davom etmoqda...':busy?'Audio yuklanmoqda...':'Javobni yozib oling'}</h2><p className="mt-1 max-w-md text-sm text-muted-foreground">Mikrofonni tekshiring. Barcha qismlarga javob berganingizdan keyin yozuvni to‘xtating.</p>{recording?<button onClick={stopRecording} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold text-white"><Square className="size-4"/> To‘xtatish</button>:<button disabled={busy} onClick={startRecording} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"><Mic className="size-4"/> Yozishni boshlash</button>}</div>
      </>}
      {done && <div className="surface mt-7 p-10 text-center"><CheckCircle2 className="mx-auto size-12 text-emerald-600"/><h2 className="mt-5 text-2xl font-bold">Speaking javobi yuborildi</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Audio baholovchiga yuborildi. Speaking baholangach va qolgan skillar tayyor bo‘lgach final natija chiqariladi.</p><Link href="/exams" className="mt-6 inline-flex rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">Imtihonlarga qaytish</Link></div>}
    </div></main></div>
}

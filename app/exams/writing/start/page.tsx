'use client'

import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  AlertCircle,
  CheckCircle2,
  ChevronsLeftRight,
  GripHorizontal,
  Loader2,
  Play,
} from 'lucide-react'
import { toast } from 'sonner'

import { getWritingExamByIdAPI, submitWritingExamAPI } from '@/lib/cefr-api/writing'
import { pullMockSkillResultAPI } from '@/lib/cefr-api/mock'
import { saveLastResult } from '@/lib/exams-result-storage'
import WritingHeader from '@/components/cefr-exam/writing-header'

// ---------- Types ----------
type Task = {
  id: number | string
  part_number: number | string
  sub_part?: number | string | null
  topic?: string
  context_text?: string
  instruction?: string
  format?: { min_words: number | string; max_words: number | string }
}

// ---------- Helpers ----------
const wc = (text: string) => text.trim().split(/\s+/).filter(Boolean).length
const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b)

const getLimits = (task: Task) => ({
  min: Number(task?.format?.min_words ?? 0),
  max: Number(task?.format?.max_words ?? 9999),
})

const taskLabel = (task: Task) =>
  Number(task.part_number) === 1 ? `1.${task.sub_part}` : '2'

function writeStorageIdle(key: string, value: string) {
  try {
    const w = window as any
    if (typeof w.requestIdleCallback === 'function') {
      w.requestIdleCallback(() => {
        try {
          localStorage.setItem(key, value)
        } catch {}
      })
      return
    }
    setTimeout(() => {
      try {
        localStorage.setItem(key, value)
      } catch {}
    }, 0)
  } catch {}
}

// ---------- Optimized TextArea ----------
const TaskTextArea = memo(function TaskTextArea({
  task,
  value,
  fontSize,
  compact,
  onFocusTask,
  onDraftChange,
}: {
  task: Task
  value: string
  fontSize: number
  compact?: boolean
  onFocusTask: (taskId: string) => void
  onDraftChange: (taskId: string, val: string) => void
}) {
  const [localValue, setLocalValue] = useState(value)
  const focusedRef = useRef(false)

  useEffect(() => {
    if (!focusedRef.current) setLocalValue(value)
  }, [value])

  const { min, max } = getLimits(task)
  const words = wc(localValue)
  const outOfRange = words > 0 && (words < min || words > max)
  const isOk = localValue.trim().length >= 10 && words >= min && words <= max

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value
    setLocalValue(v) // instant (no lag)
    onDraftChange(String(task.id), v) // parent store (debounced persist)
  }

  return (
    <div className="rounded-3xl border-2 border-orange-400 overflow-hidden shadow-lg flex flex-col min-h-[380px] bg-white transition-all focus-within:ring-4 focus-within:ring-orange-100">
      <div className="bg-orange-500 p-4 flex justify-between items-center text-white">
        <span
          className={`${compact ? 'text-lg' : 'text-2xl'} font-black italic uppercase`}
        >
          Task {taskLabel(task)}
        </span>

        <div className="flex items-center gap-2">
          {isOk && (
            <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black italic uppercase tracking-widest inline-flex items-center gap-1">
              <CheckCircle2 size={12} /> OK
            </span>
          )}
        </div>
      </div>

      <textarea
        style={{ fontSize: `${fontSize}px` }}
        className={`flex-1 ${
          compact ? 'p-5' : 'p-7'
        } outline-none leading-relaxed text-gray-700 resize-none min-h-[260px]`}
        value={localValue}
        placeholder={`Task ${taskLabel(task)} uchun javob yozing...`}
        onFocus={() => {
          focusedRef.current = true
          onFocusTask(String(task.id))
        }}
        onBlur={() => {
          focusedRef.current = false
        }}
        onChange={handleChange}
      />

      <div
        className={`p-2 text-right font-black text-xs border-t ${
          outOfRange
            ? 'bg-red-50 text-red-600 border-red-200'
            : 'bg-orange-50 text-orange-700 border-orange-100'
        }`}
      >
        {outOfRange ? (
          <span>
            {words} so‘z — {words < min ? `kamida ${min}` : `ko‘pi ${max}`}
          </span>
        ) : (
          <span>
            {words} so‘z{' '}
            <span className="text-gray-400">
              ({min}-{max})
            </span>
          </span>
        )}
      </div>
    </div>
  )
})

// ================= Page =================
export default function WritingTestPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const examId = searchParams.get('id')
  const mode = searchParams.get('mode') // "mock" yoki null
  const attemptId = searchParams.get('attemptId')
  const actualMockExamId = searchParams.get('examId')

  const [exam, setExam] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const [hasStarted, setHasStarted] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [visibleTaskId, setVisibleTaskId] = useState<string | null>(null)
  const [isTyping, setIsTyping] = useState(false)

  // answers state
  const [responses, setResponses] = useState<Record<string, string>>({})
  const responsesRef = useRef<Record<string, string>>({})
  useEffect(() => {
    responsesRef.current = responses
  }, [responses])

  // storage keys
  const startedKey = useMemo(
    () => (examId ? `writing-${examId}-started` : null),
    [examId]
  )
  const storageKey = useMemo(
    () => (examId ? `writing_responses_${examId}` : null),
    [examId]
  )

  // layout refs
  const layoutRef = useRef<HTMLDivElement>(null)
  const taskRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // ========= Desktop splitter (Answers bigger by default) =========
  const NORMAL_Q_W = 420
  const MINI_Q_W = 240
  const MIN_Q_W = 220
  const MAX_Q_W = 800

  const [qWidth, setQWidth] = useState<number>(NORMAL_Q_W)
  const [isMiniQ, setIsMiniQ] = useState(false)
  const [dragging, setDragging] = useState(false)

  // ========= Mobile controls =========
  const [mobileView, setMobileView] = useState<'both' | 'question' | 'answer'>('both')
  const [qHeight, setQHeight] = useState(42) // percent
  const [mDragging, setMDragging] = useState(false)

  // ========= Persist debounce =========
  const saveTimerRef = useRef<number | null>(null)
  const schedulePersist = useCallback(() => {
    if (!storageKey) return
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current)
    saveTimerRef.current = window.setTimeout(() => {
      writeStorageIdle(storageKey, JSON.stringify(responsesRef.current))
    }, 900)
  }, [storageKey])

  const onDraftChange = useCallback(
    (id: string, val: string) => {
      // cheap state update
      setResponses((prev) => {
        const next = { ...prev, [id]: val }
        responsesRef.current = next
        return next
      })
      schedulePersist()
    },
    [schedulePersist]
  )

  // ========= Load exam + saved =========
  useEffect(() => {
    async function load() {
      if (!examId) return
      try {
        setLoading(true)
        const res = await getWritingExamByIdAPI(examId)
        setExam(res.data)

        // started
        if (startedKey && localStorage.getItem(startedKey) === 'true') {
          setHasStarted(true)
        }

        // saved answers
        if (storageKey) {
          const saved = localStorage.getItem(storageKey)
          if (saved) {
            try {
              const parsed = JSON.parse(saved) as Record<string, string>
              setResponses(parsed || {})
            } catch {}
          }
        }
      } catch {
        toast.error("Ma'lumotlarni yuklashda xatolik!")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [examId, startedKey, storageKey])

  // ========= Tasks =========
  const tasks: Task[] = useMemo(() => {
    const t = (exam?.tasks ?? []) as Task[]
    return [...t].sort((a, b) => {
      const ap = Number(a.part_number)
      const bp = Number(b.part_number)
      if (ap !== bp) return ap - bp
      const as = a.sub_part == null ? 999 : Number(a.sub_part)
      const bs = b.sub_part == null ? 999 : Number(b.sub_part)
      return as - bs
    })
  }, [exam])

  const part1 = useMemo(() => tasks.filter((t) => Number(t.part_number) === 1), [tasks])
  const part2 = useMemo(() => tasks.filter((t) => Number(t.part_number) === 2), [tasks])

  useEffect(() => {
    if (!visibleTaskId && tasks[0]) setVisibleTaskId(String(tasks[0].id))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks.length])

  const scrollToTask = useCallback((taskId: string) => {
    setTimeout(() => {
      taskRefs.current[taskId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
      setVisibleTaskId(taskId)
    }, 40)
  }, [])

  // ========= Desktop splitter events =========
  const toggleQuestionSize = () => {
    setIsMiniQ((p) => {
      const next = !p
      setQWidth(next ? MINI_Q_W : NORMAL_Q_W)
      return next
    })
  }

  const onPointerDown = (e: React.PointerEvent) => {
    if (!layoutRef.current) return
    setDragging(true)
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging || !layoutRef.current) return
    const rect = layoutRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left

    const NAV_W = 96
    const SPLITTER_W = 18
    const totalW = rect.width
    const rightSpace = totalW - x
    const desiredQ = rightSpace - NAV_W - SPLITTER_W

    const nextQ = clamp(desiredQ, MIN_Q_W, MAX_Q_W)
    setQWidth(nextQ)
    setIsMiniQ(nextQ <= MINI_Q_W + 4)
  }

  const onPointerUp = () => setDragging(false)

  // ========= Mobile splitter =========
  const handleMobileMove = (clientY: number) => {
    if (!mDragging) return
    const h = (clientY / window.innerHeight) * 100
    setQHeight(clamp(h, 20, 80))
  }

  // ========= Submit =========
  const doSubmit = useCallback(async () => {
    if (!examId || isSubmitting) return

    // 1) task_id larni tekshiramiz (NaN bo'lsa to'xtaydi)
    const answers = tasks.map((t) => {
      const rawId = t.id
      const taskIdNum = Number(rawId)

      if (!Number.isFinite(taskIdNum)) {
        throw new Error(`task_id noto'g'ri (raqam emas): ${String(rawId)}`)
      }

      return {
        task_id: taskIdNum,
        content: (responsesRef.current[String(rawId)] || '').trim(),
      }
    })

    // 2) bo'sh kontent bo'lsa ham oldindan ogohlantirish (ixtiyoriy)
    const hasEmpty = answers.some((a) => a.content.length < 1)
    if (hasEmpty) {
      toast.error("Ba'zi javoblar bo'sh. Avval to'ldiring.")
      return
    }

    setIsSubmitting(true)
    try {
      // 3) real payload
      const payload = { answers }

      // DEBUG: console log (kerak bo'lsa vaqtincha qoldir)
      console.log('[WRITING_SUBMIT]', { examId, payload })

      const res = await submitWritingExamAPI(examId, payload)

      if (storageKey) localStorage.removeItem(storageKey)
      if (startedKey) localStorage.removeItem(startedKey)

      if (mode === 'mock' && attemptId) {
        await pullMockSkillResultAPI(Number(attemptId), 'WRITING')
        router.push(`/exams/process/${attemptId}?examId=${actualMockExamId || examId}`)
      } else {
        saveLastResult('writing', res.data)
        router.push(`/exams/results/writing`)
      }
    } catch (err: any) {
      console.error('[WRITING_SUBMIT_ERROR]', err)
      toast.error(err?.message || 'Topshirishda xatolik')
      setIsSubmitting(false)
    }
  }, [examId, mode, attemptId, actualMockExamId, isSubmitting, router, startedKey, storageKey, tasks])

  // ========= QuestionPaper (Part 1 shared prompt once) =========
  const QuestionPaper = ({ compact }: { compact?: boolean }) => {
    const p1Topic = part1[0]?.topic
    const p1Context = part1[0]?.context_text

    return (
      <div className={`${compact ? 'p-4' : 'p-8'} space-y-6`}>
        <div className="text-center">
          <h3 className="text-xl font-black uppercase italic text-orange-700">
            Question Paper
          </h3>
          <p className="text-[10px] font-black text-orange-300 tracking-widest uppercase mt-1">
            Writing
          </p>
        </div>

        {/* Part 1 */}
        <div className="rounded-3xl border border-orange-100 bg-white overflow-hidden">
          <div className="px-5 py-4 bg-orange-50 border-b border-orange-100">
            <h4 className="font-black uppercase text-orange-700">Part 1</h4>
          </div>

          <div className="p-5 space-y-4">
            {(p1Topic || p1Context) && (
              <div className="p-4 rounded-2xl bg-orange-50/40 border border-orange-100">
                {p1Topic && <p className="font-black text-slate-800">{p1Topic}</p>}
                {p1Context && (
                  <p className="mt-2 text-sm italic text-slate-600 whitespace-pre-line leading-relaxed">
                    {p1Context}
                  </p>
                )}
              </div>
            )}

            <div className="grid gap-4">
              {part1.map((t) => {
                const id = String(t.id)
                const { min, max } = getLimits(t)
                return (
                  <div
                    key={id}
                    className="p-4 rounded-2xl border border-orange-100 bg-white"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h5 className="font-black text-orange-700">
                        Task 1.{t.sub_part}
                      </h5>
                      <button
                        type="button"
                        onClick={() => {
                          setMobileView('answer')
                          scrollToTask(id)
                        }}
                        className="px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-orange-500 text-white hover:bg-orange-600 transition"
                      >
                        Answer
                      </button>
                    </div>
                    <p className="mt-3 text-sm text-slate-800 leading-relaxed">
                      {t.instruction}
                    </p>
                    <p className="mt-2 text-[11px] font-black text-slate-400">
                      Limit: {min}-{max} words
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Part 2 */}
        {part2.map((t) => {
          const id = String(t.id)
          const { min, max } = getLimits(t)
          return (
            <div
              key={id}
              className="rounded-3xl border border-orange-100 bg-white overflow-hidden"
            >
              <div className="px-5 py-4 bg-orange-50 border-b border-orange-100 flex items-center justify-between gap-3">
                <h4 className="font-black uppercase text-orange-700">Part 2</h4>
                <button
                  type="button"
                  onClick={() => {
                    setMobileView('answer')
                    scrollToTask(id)
                  }}
                  className="px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-orange-500 text-white hover:bg-orange-600 transition"
                >
                  Answer
                </button>
              </div>

              <div className="p-5 space-y-3">
                {t.topic && (
                  <p className="font-black text-slate-800">Topic: {t.topic}</p>
                )}
                {t.context_text && (
                  <p className="text-sm italic text-slate-600 whitespace-pre-line leading-relaxed bg-orange-50/40 border border-orange-100 p-4 rounded-2xl">
                    {t.context_text}
                  </p>
                )}
                {t.instruction && (
                  <p className="text-sm text-slate-800 leading-relaxed">
                    {t.instruction}
                  </p>
                )}
                <p className="inline-flex px-4 py-2 rounded-2xl bg-orange-50 border border-orange-100 font-black text-xs text-orange-700">
                  Write {min}-{max} words
                </p>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // ========= Guards =========
  if (!examId) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <p className="font-black text-slate-700">ID topilmadi</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-orange-500 w-10 h-10" />
      </div>
    )
  }

  if (!hasStarted) {
    return (
      <div className="h-screen flex items-center justify-center bg-orange-50 p-6">
        <div className="bg-white p-12 rounded-[50px] shadow-2xl text-center max-w-lg border-b-[10px] border-orange-500">
          <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Play size={40} className="ml-1" />
          </div>
          <h1 className="text-3xl font-black mb-3 italic text-slate-800 uppercase">
            {exam?.title || 'Writing Test'}
          </h1>
          <p className="text-slate-500 mb-8 font-medium">Tayyor bo‘lsangiz boshlang.</p>
          <button
            type="button"
            onClick={() => {
              setHasStarted(true)
              if (startedKey) localStorage.setItem(startedKey, 'true')
            }}
            className="w-full py-5 bg-orange-500 text-white rounded-2xl font-black text-xl hover:bg-orange-600 shadow-lg active:scale-95 transition"
          >
            TESTNI BOSHLASH
          </button>
        </div>
      </div>
    )
  }

  // ========= Page =========
  return (
    <div
      className="flex flex-col h-screen bg-[#FDFCFB] overflow-hidden"
      onMouseMove={(e) => handleMobileMove(e.clientY)}
      onMouseUp={() => setMDragging(false)}
      onTouchMove={(e) => handleMobileMove(e.touches[0].clientY)}
      onTouchEnd={() => setMDragging(false)}
    >
      <WritingHeader
        initialSeconds={(Number(exam?.duration_minutes) || 60) * 60}
        onFinish={() => setShowConfirmModal(true)}
        isSubmitting={isSubmitting}
      />

      {/* Submitting overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-white/90 backdrop-blur-xl z-[200] flex flex-col items-center justify-center">
          <div className="w-20 h-20 border-8 border-orange-100 border-t-orange-500 rounded-full animate-spin" />
          <h2 className="mt-6 text-xl font-black italic text-orange-700 uppercase tracking-tight">
            AI tekshirmoqda...
          </h2>
          <p className="mt-2 text-sm font-bold text-slate-400">Iltimos, kuting</p>
        </div>
      )}

      {/* Confirm modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[120] flex items-center justify-center p-6">
          <div className="bg-white rounded-[40px] p-10 max-w-md w-full text-center shadow-2xl">
            <h3 className="text-2xl font-black mb-3 italic uppercase text-orange-700">
              Imtihonni yakunlaysizmi?
            </h3>
            <p className="text-slate-500 font-medium mb-7">
              Javoblar yuboriladi va tekshiruv boshlanadi.
            </p>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-4 bg-slate-100 rounded-2xl font-black text-slate-700 hover:bg-slate-200 transition"
              >
                Yo‘q
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={async () => {
                  setShowConfirmModal(false)
                  await doSubmit()
                }}
                className="flex-1 py-4 bg-orange-500 text-white rounded-2xl font-black shadow-lg hover:bg-orange-600 transition disabled:opacity-60"
              >
                {isSubmitting ? 'Yuborilmoqda...' : 'HA, YUBORISH'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MOBILE ===================== */}
      <div className="lg:hidden flex-1 overflow-hidden p-3">
        {/* mobile top controls */}
        <div className="bg-white border border-orange-100 rounded-2xl p-2 flex items-center justify-between">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMobileView('both')}
              className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition ${
                mobileView === 'both'
                  ? 'bg-slate-900 text-white'
                  : 'bg-orange-50 text-orange-700'
              }`}
            >
              Ikki bo‘lim
            </button>
            <button
              type="button"
              onClick={() => setMobileView('question')}
              className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition ${
                mobileView === 'question'
                  ? 'bg-orange-600 text-white'
                  : 'bg-orange-50 text-orange-700'
              }`}
            >
              Savol
            </button>
            <button
              type="button"
              onClick={() => setMobileView('answer')}
              className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition ${
                mobileView === 'answer'
                  ? 'bg-orange-600 text-white'
                  : 'bg-orange-50 text-orange-700'
              }`}
            >
              Javob
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowConfirmModal(true)}
            className="px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-orange-500 text-white hover:bg-orange-600 transition"
          >
            Finish
          </button>
        </div>

        {/* both => splitter */}
        {mobileView === 'both' && (
          <div className="mt-3 h-[calc(100%-56px)] flex flex-col overflow-hidden">
            <div
              style={{ height: `${qHeight}%` }}
              className="overflow-hidden rounded-3xl border border-orange-100 bg-white"
            >
              <div className="h-full overflow-y-auto custom-scrollbar">
                <QuestionPaper compact />
              </div>
            </div>

            {/* handle */}
            <div
              onMouseDown={() => setMDragging(true)}
              onTouchStart={() => setMDragging(true)}
              className="my-2 h-9 rounded-2xl bg-orange-500 flex items-center justify-center cursor-ns-resize shadow-md relative select-none"
            >
              <div className="w-20 h-1.5 bg-white/40 rounded-full" />
              <GripHorizontal className="text-white absolute right-4" size={20} />
              <span className="text-[10px] text-white font-black uppercase tracking-widest px-3">
                Resize
              </span>
              <div className="w-20 h-1.5 bg-white/40 rounded-full" />
            </div>

            <div
              style={{ height: `${100 - qHeight}%` }}
              className="overflow-hidden rounded-3xl border border-orange-100 bg-white"
            >
              <div className="h-full overflow-y-auto custom-scrollbar p-4 space-y-7 pb-20">
                {tasks.map((t) => {
                  const id = String(t.id)
                  return (
                    <TaskTextArea
                      key={id}
                      task={t}
                      value={responses[id] || ''}
                      fontSize={16}
                      compact
                      onFocusTask={(tid) => setVisibleTaskId(tid)}
                      onDraftChange={onDraftChange}
                    />
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {mobileView === 'question' && (
          <div className="mt-3 h-[calc(100%-56px)] overflow-hidden rounded-3xl border border-orange-100 bg-white">
            <div className="h-full overflow-y-auto custom-scrollbar">
              <QuestionPaper compact />
            </div>
          </div>
        )}

        {mobileView === 'answer' && (
          <div className="mt-3 h-[calc(100%-56px)] overflow-hidden rounded-3xl border border-orange-100 bg-white">
            <div className="h-full overflow-y-auto custom-scrollbar p-4 space-y-7 pb-20">
              {/* mobile quick nav */}
              <div className="sticky top-0 z-20 bg-white/90 backdrop-blur border border-orange-100 rounded-2xl p-2">
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                  {tasks.map((t) => {
                    const id = String(t.id)
                    const active = visibleTaskId === id
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => scrollToTask(id)}
                        className={`shrink-0 px-4 py-2 rounded-2xl font-black text-[10px] uppercase tracking-widest border transition ${
                          active
                            ? 'bg-orange-600 text-white border-orange-200'
                            : 'bg-orange-50 text-orange-700 border-orange-100'
                        }`}
                      >
                        Task {taskLabel(t)}
                      </button>
                    )
                  })}
                </div>
              </div>

              {tasks.map((t) => {
                const id = String(t.id)
                return (
                  <div
                    key={id}
                    ref={(el) => {
                      taskRefs.current[id] = el
                    }}
                    onFocusCapture={() => setVisibleTaskId(id)}
                  >
                    <TaskTextArea
                      task={t}
                      value={responses[id] || ''}
                      fontSize={16}
                      compact
                      onFocusTask={(tid) => setVisibleTaskId(tid)}
                      onDraftChange={onDraftChange}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ===================== DESKTOP ===================== */}
      <div ref={layoutRef} className="hidden lg:flex flex-1 overflow-hidden">
        {/* ANSWERS */}
        <section className="flex-1 h-full overflow-y-auto custom-scrollbar p-10">
          <div className="max-w-4xl mx-auto space-y-10 pb-24 pt-6">
            {tasks.map((t) => {
              const id = String(t.id)
              return (
                <div
                  key={id}
                  ref={(el) => {
                    taskRefs.current[id] = el
                  }}
                >
                  <TaskTextArea
                    task={t}
                    value={responses[id] || ''}
                    fontSize={18}
                    onFocusTask={(tid) => {
                      setIsTyping(true)
                      setVisibleTaskId(tid)
                    }}
                    onDraftChange={onDraftChange}
                  />
                </div>
              )
            })}
          </div>
        </section>

        {/* SPLITTER HANDLE */}
        <div
          className="relative h-full bg-orange-50 border-l border-r border-orange-100 select-none"
          style={{ width: 18 }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              toggleQuestionSize()
            }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-2xl bg-white border border-orange-100 shadow-md flex items-center justify-center text-orange-700 hover:text-orange-800 hover:border-orange-200 transition"
            title={isMiniQ ? 'Kattalashtirish' : 'Kichraytirish'}
          >
            <ChevronsLeftRight size={18} />
          </button>
        </div>

        {/* QUESTIONS */}
        <section
          className="h-full overflow-y-auto bg-white custom-scrollbar border-r border-orange-100"
          style={{ width: qWidth }}
        >
          <QuestionPaper />
        </section>

        {/* RIGHT NAV (desktop) */}
        <aside
          className={`h-full w-24 border-l border-orange-100 bg-[#FDFCFB] flex items-center justify-center transition ${
            isTyping ? 'opacity-40' : 'opacity-100'
          }`}
          onMouseMove={() => setIsTyping(false)}
        >
          <div className="flex flex-col gap-3 pr-2">
            {tasks.map((t) => {
              const id = String(t.id)
              const active = visibleTaskId === id

              const content = (responses[id] || '').trim()
              const { min, max } = getLimits(t)
              const words = wc(content)
              const ok = content.length >= 10 && words >= min && words <= max

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => scrollToTask(id)}
                  className={`w-14 h-14 rounded-2xl font-black transition-all border ${
                    active
                      ? 'bg-orange-600 text-white border-orange-200 shadow'
                      : 'bg-white text-orange-700 border-orange-100 hover:bg-orange-50'
                  }`}
                  title={`Task ${taskLabel(t)}`}
                >
                  <div className="flex flex-col items-center justify-center leading-none">
                    <span className="text-sm">{taskLabel(t)}</span>
                    <span
                      className={`text-[9px] mt-1 ${ok ? 'opacity-95' : 'opacity-55'}`}
                    >
                      {ok ? 'OK' : '...'}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </aside>
      </div>
    </div>
  )
}

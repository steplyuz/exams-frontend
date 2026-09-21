"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { BookOpen, Headphones, PenLine, Mic, CheckCircle2, Circle, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { examsApi } from "@/lib/api/endpoints"
import type { EnrolledExam, MockSkillStatus, SkillType } from "@/lib/api/types"

const SKILLS: { skill: SkillType; label: string; icon: typeof BookOpen; startPath: (id: string) => string }[] = [
  { skill: "READING", label: "Reading", icon: BookOpen, startPath: (id) => `/exams/reading/start?id=${id}` },
  { skill: "LISTENING", label: "Listening", icon: Headphones, startPath: (id) => `/exams/listening/start?id=${id}` },
  { skill: "WRITING", label: "Writing", icon: PenLine, startPath: (id) => `/exams/writing/start?id=${id}` },
  { skill: "SPEAKING", label: "Speaking", icon: Mic, startPath: () => `/exams/speaking` },
]

export default function MockProcessPage() {
  const params = useParams<{ attemptId: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const attemptId = Number(params.attemptId)
  const examId = searchParams.get("examId")

  const [status, setStatus] = useState<MockSkillStatus[]>([])
  const [exam, setExam] = useState<EnrolledExam | null>(null)
  const [loading, setLoading] = useState(true)
  const [finishing, setFinishing] = useState(false)

  const load = useCallback(async () => {
    try {
      const [statusRes, examsRes] = await Promise.all([examsApi.status(attemptId), examsApi.list()])
      setStatus(statusRes)
      setExam(examsRes.find((e) => e.id === examId || e.attempt_id === attemptId) || null)
    } catch (err: any) {
      toast.error(err?.message || "Holatni yuklab bo'lmadi")
    } finally {
      setLoading(false)
    }
  }, [attemptId, examId])

  useEffect(() => {
    if (Number.isFinite(attemptId)) load()
  }, [attemptId, load])

  const skillIdFor = (skill: SkillType): string | null => {
    if (!exam) return null
    return { READING: exam.reading_id, LISTENING: exam.listening_id, WRITING: exam.writing_id, SPEAKING: exam.speaking_id }[skill]
  }

  const allSubmitted = status.length > 0 && status.every((s) => s.is_submitted)

  const handleFinish = async () => {
    setFinishing(true)
    try {
      await examsApi.finish(attemptId)
      toast.success("Imtihon yakunlandi")
      router.push("/exams/results")
    } catch (err: any) {
      toast.error(err?.message || "Yakunlashda xatolik yuz berdi")
      setFinishing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 pb-10 pt-6 sm:px-6">
      <div className="rounded-3xl border border-border bg-card p-7 shadow-sm sm:p-9">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Imtihon jarayoni</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {exam?.title || "Mock imtihon"} — bo'limlarni birma-bir topshiring.
        </p>
      </div>

      <div className="space-y-3">
        {SKILLS.map(({ skill, label, icon: Icon, startPath }) => {
          const s = status.find((x) => x.skill === skill)
          const submitted = s?.is_submitted ?? false
          const skillId = skillIdFor(skill)
          const disabled = submitted || (skill !== "SPEAKING" && !skillId)

          return (
            <div
              key={skill}
              className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                  <Icon className="size-5" />
                </div>
                <div>
                  <p className="font-bold text-foreground">{label}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    {submitted ? (
                      <>
                        <CheckCircle2 className="size-3.5 text-emerald-600" /> Topshirildi
                      </>
                    ) : (
                      <>
                        <Circle className="size-3.5" /> Kutilmoqda
                      </>
                    )}
                  </p>
                </div>
              </div>
              <button
                disabled={disabled}
                onClick={() => {
                  const path = skill === "SPEAKING" ? startPath("") : startPath(skillId!)
                  const url = skill === "SPEAKING" ? path : `${path}&mode=mock&attemptId=${attemptId}&examId=${examId ?? ""}`
                  router.push(url)
                }}
                className="shrink-0 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-primary-foreground transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-40"
              >
                {submitted ? "Bajarildi" : "Boshlash"}
              </button>
            </div>
          )
        })}
      </div>

      <button
        disabled={!allSubmitted || finishing}
        onClick={handleFinish}
        className="w-full rounded-2xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-40"
      >
        {finishing ? "Yakunlanmoqda..." : allSubmitted ? "Imtihonni yakunlash" : "Barcha bo'limlarni tugating"}
      </button>
    </div>
  )
}

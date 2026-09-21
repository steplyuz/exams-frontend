"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { BookOpen, Headphones, PenLine, ChevronLeft, Clock3 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { readLastResult, type ResultSkill } from "@/lib/exams-result-storage"
import type { ListeningResultDetail, ReadingResultDetail, WritingResult } from "@/lib/api/types"

const SKILL_META: Record<ResultSkill, { title: string; icon: typeof BookOpen; catalog: string }> = {
  reading: { title: "Reading natijasi", icon: BookOpen, catalog: "/exams/reading" },
  listening: { title: "Listening natijasi", icon: Headphones, catalog: "/exams/listening" },
  writing: { title: "Writing natijasi", icon: PenLine, catalog: "/exams/writing" },
}

export default function SkillResultPage() {
  const params = useParams<{ skill: string }>()
  const router = useRouter()
  const skill = (params?.skill as ResultSkill) in SKILL_META ? (params.skill as ResultSkill) : null

  const [result, setResult] = useState<unknown>(null)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (!skill) return
    setResult(readLastResult(skill))
    setChecked(true)
  }, [skill])

  if (!skill) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 text-center text-sm text-muted-foreground">
        Noma'lum bo'lim
      </div>
    )
  }

  const meta = SKILL_META[skill]
  const Icon = meta.icon

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 pb-10 pt-6 sm:px-6">
      <button
        onClick={() => router.push(meta.catalog)}
        className="group flex items-center gap-3 text-muted-foreground transition-colors hover:text-foreground"
      >
        <div className="flex size-9 items-center justify-center rounded-xl border border-border bg-card shadow-sm transition-colors group-hover:bg-muted">
          <ChevronLeft size={18} className="transition-transform group-hover:-translate-x-0.5" />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{meta.title.split(" ")[0]}ga qaytish</span>
      </button>

      <div className="rounded-3xl border border-border bg-card p-7 shadow-sm sm:p-9">
        <div className="flex size-11 items-center justify-center rounded-xl bg-secondary text-primary">
          <Icon className="size-5" />
        </div>
        <h1 className="mt-5 text-2xl font-bold tracking-tight sm:text-3xl">{meta.title}</h1>

        {!checked ? null : !result ? (
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            Bu sessiyada natija topilmadi. Sahifa yangilangan yoki boshqa tabda ochilgan bo'lishi mumkin.
          </p>
        ) : skill === "writing" ? (
          <WritingResultView result={result as WritingResult} />
        ) : (
          <SummaryResultView result={result as ReadingResultDetail | ListeningResultDetail} />
        )}
      </div>

      <button
        onClick={() => router.push(meta.catalog)}
        className="w-full rounded-2xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
      >
        Boshqa test tanlash
      </button>
    </div>
  )
}

function SummaryResultView({ result }: { result: ReadingResultDetail | ListeningResultDetail }) {
  const s = result.summary
  return (
    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Stat label="To'g'ri javob" value={`${s.correct_answers}/${s.total_questions}`} />
      <Stat label="Foiz" value={`${Math.round(s.percentage)}%`} />
      <Stat label="Ball" value={String(s.standard_score)} />
      <Stat label="CEFR" value={s.cefr_level || "—"} highlight />
    </div>
  )
}

function WritingResultView({ result }: { result: WritingResult }) {
  if (!result.is_finalized) {
    return (
      <div className="mt-6 flex items-center gap-3 rounded-2xl border border-dashed border-border p-5">
        <Clock3 className="size-5 shrink-0 text-muted-foreground" />
        <p className="text-sm leading-6 text-muted-foreground">
          Insho yuborildi va tekshiruv navbatida. Baholangach shu yerda ko'rinadi.
        </p>
      </div>
    )
  }
  return (
    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
      <Stat label="Xom ball" value={String(result.raw_score)} />
      <Stat label="Ball" value={String(result.scaled_score)} />
      <Stat label="CEFR" value={result.cefr_level || "—"} highlight />
    </div>
  )
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-muted/40 p-4 text-center">
      {highlight ? (
        <Badge variant="default" className="text-sm">{value}</Badge>
      ) : (
        <div className="text-xl font-black tracking-tight text-foreground">{value}</div>
      )}
      <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  )
}

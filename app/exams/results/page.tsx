"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { BarChart3, ChevronLeft, Loader2, Inbox } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { examsApi } from "@/lib/api/endpoints"
import type { EnrolledExam, MockFinalResult } from "@/lib/api/types"

export default function ResultsHubPage() {
  const router = useRouter()
  const [exams, setExams] = useState<EnrolledExam[]>([])
  const [results, setResults] = useState<Record<number, MockFinalResult>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const list = await examsApi.list()
        setExams(list)
        const finished = list.filter((e) => e.is_finished && e.attempt_id)
        const pairs = await Promise.all(
          finished.map(async (e) => {
            try {
              return [e.attempt_id as number, await examsApi.result(e.attempt_id as number)] as const
            } catch {
              return null
            }
          })
        )
        const map: Record<number, MockFinalResult> = {}
        for (const pair of pairs) if (pair) map[pair[0]] = pair[1]
        setResults(map)
      } catch (err) {
        console.error("Natijalarni yuklashda xatolik:", err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 pb-10 pt-6 sm:px-6">
      <button
        onClick={() => router.push("/exams")}
        className="group flex items-center gap-3 text-muted-foreground transition-colors hover:text-foreground"
      >
        <div className="flex size-9 items-center justify-center rounded-xl border border-border bg-card shadow-sm transition-colors group-hover:bg-muted">
          <ChevronLeft size={18} className="transition-transform group-hover:-translate-x-0.5" />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Imtihonlarga qaytish</span>
      </button>

      <div className="rounded-3xl border border-border bg-card p-7 shadow-sm sm:p-9">
        <div className="flex size-11 items-center justify-center rounded-xl bg-secondary text-primary">
          <BarChart3 className="size-5" />
        </div>
        <h1 className="mt-5 text-2xl font-bold tracking-tight sm:text-3xl">Natijalarim</h1>
        <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
          Sizga biriktirilgan mock imtihon(lar) natijasi shu yerda ko'rinadi.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 w-full animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : exams.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border py-20 text-center">
          <Inbox className="mx-auto mb-4 text-muted-foreground/60" size={36} />
          <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Biriktirilgan imtihon topilmadi
          </p>
        </div>
      ) : (
        <div className="space-y-3 pb-6">
          {exams.map((exam) => {
            const result = exam.attempt_id ? results[exam.attempt_id] : undefined
            return (
              <div key={exam.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-bold text-foreground">{exam.title}</h3>
                  <Badge variant={exam.is_finished ? "success" : "muted"}>
                    {exam.is_finished ? "Yakunlangan" : exam.attempt_status || "Boshlanmagan"}
                  </Badge>
                </div>
                {result ? (
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
                    <MiniStat label="Reading" value={result.reading_ball} />
                    <MiniStat label="Listening" value={result.listening_ball} />
                    <MiniStat label="Writing" value={result.writing_ball} />
                    <MiniStat label="Speaking" value={result.speaking_ball} />
                    <div className="rounded-xl bg-primary/10 p-3 text-center">
                      <div className="text-lg font-black text-primary">{result.overall_score}</div>
                      <div className="mt-0.5 text-[9px] font-bold uppercase tracking-widest text-primary">
                        {result.cefr_level}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">
                    {exam.is_finished ? "Natija hisoblanmoqda…" : "Imtihon hali yakunlanmagan."}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-muted/40 p-3 text-center">
      <div className="text-lg font-black text-foreground">{value}</div>
      <div className="mt-0.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  )
}

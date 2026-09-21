"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Headphones, Clock, FileText, ChevronRight, ChevronLeft, Search, Inbox } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { getListeningExamsAPI } from "@/lib/cefr-api/listening"

interface ListeningExamItem {
  id: string
  title: string
  isActive: boolean
  level: string
  duration: number
  totalQuestions: number
}

export default function ListeningPage() {
  const router = useRouter()
  const [exams, setExams] = useState<ListeningExamItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const fetchExams = async () => {
      try {
        setLoading(true)
        const response = await getListeningExamsAPI()
        const dataArray = Array.isArray(response.data) ? response.data : []

        const formatted: ListeningExamItem[] = dataArray
          .filter((item) => !item.is_mock)
          .map((item) => ({
            id: String(item.id),
            title: item.title || "Nomsiz test",
            isActive: item.is_active ?? true,
            level: item.level || "B2",
            duration: item.duration || 35,
            totalQuestions: item.total_questions || 30,
          }))
        setExams(formatted)
      } catch (err) {
        console.error("Listening testlarni yuklashda xatolik:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchExams()
  }, [])

  const filteredTests = useMemo(
    () =>
      exams.filter(
        (test) =>
          test.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          test.level.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [exams, searchTerm]
  )

  const handleTestClick = (test: ListeningExamItem) => {
    if (!test.isActive) return
    router.push(`/exams/listening/start?id=${test.id}`)
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 pb-10 pt-6 sm:px-6">
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
          <Headphones className="size-5" />
        </div>
        <h1 className="mt-5 text-2xl font-bold tracking-tight sm:text-3xl">Listening</h1>
        <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
          Sizga tayinlangan tinglab tushunish testlarini shu yerdan boshlang.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Test nomi yoki darajasini qidiring..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-2xl border border-border bg-card py-3.5 pl-11 pr-4 text-sm font-medium outline-none transition-all focus:border-ring focus:ring-3 focus:ring-ring/20"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 w-full animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : (
        <div className="space-y-3 pb-6">
          <AnimatePresence mode="popLayout">
            {filteredTests.map((test, index) => (
              <motion.div
                key={test.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ delay: index * 0.04 }}
                onClick={() => handleTestClick(test)}
                className={`group flex flex-col items-start justify-between gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:border-ring/40 hover:shadow-md sm:flex-row sm:items-center ${
                  !test.isActive ? "pointer-events-none opacity-60" : "cursor-pointer"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Headphones size={22} />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-foreground">{test.title}</h3>
                      <Badge variant="muted">{test.level}</Badge>
                      {!test.isActive && <Badge variant="outline">Yaqinda</Badge>}
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Clock size={13} /> {test.duration} daqiqa
                      </span>
                      <span className="flex items-center gap-1.5">
                        <FileText size={13} /> {test.totalQuestions} savol
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex size-10 shrink-0 items-center justify-center self-end rounded-xl bg-muted text-muted-foreground transition-all group-hover:translate-x-1 group-hover:bg-primary group-hover:text-primary-foreground sm:self-auto">
                  <ChevronRight size={20} />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredTests.length === 0 && (
            <div className="rounded-2xl border-2 border-dashed border-border py-20 text-center">
              <Inbox className="mx-auto mb-4 text-muted-foreground/60" size={36} />
              <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                Hozircha testlar mavjud emas
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

"use client"

import Link from "next/link"
import { Mic, ShieldCheck, Volume2, ChevronLeft } from "lucide-react"

const GUIDE_ITEMS: [typeof Mic, string, string][] = [
  [Mic, "Mikrofon", "Yozuv boshlanishidan oldin brauzer mikrofoniga ruxsat bering."],
  [Volume2, "Tinch joy", "Audio sifatini yaxshilash uchun shovqinsiz joy tanlang."],
  [ShieldCheck, "Bir marta yuborish", "Yozuvni tekshirib, barcha qismlarga javob berganingizdan keyin yakunlang."],
]

export default function SpeakingIntroPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 pb-10 pt-6 sm:px-6">
      <Link
        href="/exams"
        className="group flex items-center gap-3 text-muted-foreground transition-colors hover:text-foreground"
      >
        <div className="flex size-9 items-center justify-center rounded-xl border border-border bg-card shadow-sm transition-colors group-hover:bg-muted">
          <ChevronLeft size={18} className="transition-transform group-hover:-translate-x-0.5" />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Imtihonlarga qaytish</span>
      </Link>

      <div className="rounded-3xl border border-border bg-card p-7 shadow-sm sm:p-9">
        <p className="text-sm font-semibold text-primary">Speaking</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Speaking imtihoniga tayyorlaning</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Boshlashdan oldin quyidagilarga e'tibor bering.
        </p>

        <div className="mt-7 space-y-4">
          {GUIDE_ITEMS.map(([Icon, title, text]) => (
            <div key={title} className="flex gap-4 rounded-xl border border-border p-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                <Icon className="size-5" />
              </div>
              <div>
                <p className="font-semibold">{title}</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{text}</p>
              </div>
            </div>
          ))}
        </div>

        <Link
          href="/exams/speaking/pre-check"
          className="mt-7 inline-flex rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Pre-checkga o'tish
        </Link>
      </div>
    </div>
  )
}

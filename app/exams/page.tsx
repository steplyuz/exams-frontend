"use client"

import Link from "next/link"
import { BookOpen, Headphones, PenLine, Mic, ChevronRight, BarChart3 } from "lucide-react"

const SKILLS = [
  {
    href: "/exams/reading",
    icon: BookOpen,
    title: "Reading",
    description: "Matnlarni o'qib, savollarga javob bering.",
  },
  {
    href: "/exams/listening",
    icon: Headphones,
    title: "Listening",
    description: "Audio yozuvlarni tinglab, savollarni bajaring.",
  },
  {
    href: "/exams/writing",
    icon: PenLine,
    title: "Writing",
    description: "Berilgan topshiriqlar bo'yicha insho yozing.",
  },
  {
    href: "/exams/speaking",
    icon: Mic,
    title: "Speaking",
    description: "Savollarga ovozli javob yozib yuboring.",
  },
]

export default function ExamsHubPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-10 sm:px-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Imtihonlar</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Quyidagi 4 ta bo'limdan birini tanlang va sizga tayinlangan testni boshlang.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {SKILLS.map(({ href, icon: Icon, title, description }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:border-ring/40 hover:shadow-md"
          >
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <Icon className="size-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">{title}</h2>
                <ChevronRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </div>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
            </div>
          </Link>
        ))}
      </div>

      <Link
        href="/exams/results"
        className="flex items-center justify-between rounded-2xl border border-dashed border-border p-5 text-sm font-semibold text-muted-foreground transition-colors hover:border-ring/40 hover:text-foreground"
      >
        <span className="flex items-center gap-2">
          <BarChart3 className="size-4" /> Natijalarim
        </span>
        <ChevronRight className="size-4" />
      </Link>
    </div>
  )
}

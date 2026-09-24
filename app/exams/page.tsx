"use client"

import Image from "next/image"
import Link from "next/link"
import { BookOpen, Headphones, PenLine, Mic, DoorOpen } from "lucide-react"

const SKILLS = [
  {
    href: "/exams/reading",
    key: "reading",
    title: "Reading",
    icon: BookOpen,
    image: "/images/oqish.png",
    status: "login" as const,
  },
  {
    href: "/exams/listening",
    key: "listening",
    title: "Listening",
    icon: Headphones,
    image: "/images/tinglash.png",
    status: "login" as const,
  },
  {
    href: "/exams/writing",
    key: "writing",
    title: "Writing",
    icon: PenLine,
    image: "/images/yozish.png",
    status: "login" as const,
  },
  {
    href: "/exams/speaking",
    key: "speaking",
    title: "Speaking",
    icon: Mic,
    image: "/images/microPhone.png",
    status: "last" as const,
  },
]

function SkillCard({
  title,
  icon: Icon,
  image,
  status,
  href,
}: (typeof SKILLS)[number]) {
  return (
    <div className="flex w-full max-w-[360px] flex-col overflow-hidden rounded-2xl border border-black/5 bg-white shadow-[0_6px_20px_rgba(0,0,0,0.06)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_10px_26px_rgba(0,0,0,0.10)]">
      {/* Head */}
      <div className="flex items-center justify-between bg-gradient-to-br from-[#0A6B5B] to-[#10897A] px-4 py-3">
        <span className="flex items-center gap-2 text-sm font-bold text-white">
          <Icon className="size-4" />
          {title}
        </span>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold text-white ${
            status === "last" ? "bg-emerald-500" : "bg-amber-500"
          }`}
        >
          {status === "last" ? "Last" : "Login"}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-1 items-center justify-center bg-[#f8fafc] py-10">
        <div className="flex size-[190px] items-center justify-center rounded-full bg-[#f1f5f9] shadow-inner">
          <Image
            src={image}
            alt={title}
            width={190}
            height={190}
            className="h-[70%] w-[70%] object-contain"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-black/5 bg-white p-4">
        <Link
          href={href}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#0A6B5B] to-[#10897A] py-2.5 text-sm font-semibold text-white transition hover:brightness-95"
        >
          <DoorOpen className="size-4" />
          Login
        </Link>
      </div>
    </div>
  )
}

export default function ExamsHubPage() {
  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <main className="mx-auto max-w-6xl px-6 py-10">
        {/* Grid capped at the width of exactly 3 cards (360px * 3 + gaps), centered,
            so columns stay card-sized instead of stretching across the page.
            The 4th, odd-one-out card is pinned to the middle column so it centers. */}
        <div className="mx-auto grid max-w-[1128px] grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SKILLS.map((skill, i) => {
            const isTrailingSingle =
              i === SKILLS.length - 1 && SKILLS.length % 3 === 1
            return (
              <div
                key={skill.key}
                className={`flex justify-center ${isTrailingSingle ? "sm:col-span-2 lg:col-span-1 lg:col-start-2" : ""}`}
              >
                <SkillCard {...skill} />
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Home, ClipboardCheck, LogOut } from "lucide-react"
import { Toaster } from "sonner"

import { useAuth } from "@/lib/auth/auth-context"

const LANGS = [
  { code: "uz", flag: "🇺🇿" },
  { code: "en", flag: "🇬🇧" },
] as const

export default function ExamsLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [lang, setLang] = useState<"uz" | "en">("en")

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`)
    }
  }, [isLoading, isAuthenticated, pathname, router])

  if (isLoading || !isAuthenticated) {
    return <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">Yuklanmoqda...</div>
  }

  return (
    // h-screen + overflow-hidden on the shell: header keeps its natural height
    // (shrink-0) and <main> takes exactly what's left (flex-1 min-h-0), so the
    // page never grows taller than the viewport and no scrollbar appears.
    <div className="flex h-screen flex-col overflow-hidden bg-[#f7f8fa]">
      <Toaster richColors position="top-center" />

      <header className="flex shrink-0 items-center justify-between border-b border-black/5 bg-white px-6 py-3">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex size-10 items-center justify-center rounded-xl border border-gray-200 text-gray-600 transition hover:bg-gray-50"
          >
            <Home className="size-5" />
          </Link>

          <Link href="/exams" className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#0A6B5B] to-[#10897A] text-white shadow-sm">
              <ClipboardCheck className="size-5" />
            </div>
            <span className="text-lg font-bold text-gray-900">Exam System</span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {user?.mk_id && (
            <span className="hidden rounded-full border border-gray-200 px-3 py-1 font-mono text-xs font-semibold text-gray-500 sm:inline">
              {user.mk_id}
            </span>
          )}

          <button
            onClick={() => logout().then(() => router.replace("/login"))}
            className="flex items-center gap-2 rounded-full bg-gradient-to-br from-[#0A6B5B] to-[#10897A] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-95"
          >
            <LogOut className="size-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>

        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
    </div>
  )
}
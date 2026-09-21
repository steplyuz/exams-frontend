"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ChevronLeft, Mic, ShieldCheck } from "lucide-react"
import { speakingApi } from "@/lib/api/endpoints"
import { useAuth } from "@/lib/auth/auth-context"

export default function SpeakingPreCheckPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const [ok, setOk] = useState(false)
  const [error, setError] = useState("")
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) return
    speakingApi
      .myAssignedTest()
      .then(() => setOk(true))
      .catch((e) => setError(e instanceof Error ? e.message : "Faol Speaking sessiya topilmadi."))
  }, [isAuthenticated])

  async function testMic() {
    setChecking(true)
    setError("")
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((t) => t.stop())
      setOk(true)
    } catch {
      setError("Mikrofonga ruxsat berilmadi.")
    } finally {
      setChecking(false)
    }
  }

  if (isLoading) {
    return <div className="flex min-h-svh items-center justify-center text-muted-foreground">Yuklanmoqda...</div>
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 px-4 pb-10 pt-6 sm:px-6">
      <Link
        href="/exams/speaking"
        className="group flex items-center gap-3 text-muted-foreground transition-colors hover:text-foreground"
      >
        <div className="flex size-9 items-center justify-center rounded-xl border border-border bg-card shadow-sm transition-colors group-hover:bg-muted">
          <ChevronLeft size={18} className="transition-transform group-hover:-translate-x-0.5" />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Orqaga</span>
      </Link>

      <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
        <ShieldCheck className="mx-auto size-12 text-primary" />
        <h1 className="mt-5 text-2xl font-bold">Speaking pre-check</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sessiya va mikrofonni imtihondan oldin tekshiring.
        </p>

        {error && (
          <p className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>
        )}

        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={testMic}
            disabled={!isAuthenticated || checking}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity disabled:opacity-50"
          >
            <Mic className="size-4" />
            {checking ? "Tekshirilmoqda..." : "Mikrofonni tekshirish"}
          </button>
          {ok && (
            <Link
              href="/exams/speaking/session"
              className="inline-flex rounded-lg border border-border px-5 py-3 text-sm font-semibold transition-colors hover:bg-muted"
            >
              Speakingga kirish
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

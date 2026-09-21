"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { LogOut } from "lucide-react"
import { Toaster } from "sonner"

import { useAuth } from "@/lib/auth/auth-context"

export default function ExamsLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`)
    }
  }, [isLoading, isAuthenticated, pathname, router])

  if (isLoading || !isAuthenticated) {
    return <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">Yuklanmoqda...</div>
  }

  return (
    <div className="min-h-svh bg-background">
      <Toaster richColors position="top-center" />
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
        <div className="container-shell flex h-16 items-center justify-between">
          <Link href="/exams" className="text-lg font-bold tracking-tight">
            examx<span className="text-primary">.</span>steply.uz
          </Link>
          <div className="flex items-center gap-4">
            {user?.mk_id && (
              <span className="hidden rounded-full border border-border px-3 py-1 font-mono text-xs font-semibold text-muted-foreground sm:inline">
                {user.mk_id}
              </span>
            )}
            <button
              onClick={() => logout().then(() => router.replace("/login"))}
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Chiqish</span>
            </button>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}

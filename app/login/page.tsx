  "use client"

  import { Suspense, useEffect, useId, useRef, useState } from "react"
  import Image from "next/image"
  import { useRouter, useSearchParams } from "next/navigation"
  import { AlertCircle, ArrowRight, IdCard, Loader2 } from "lucide-react"

  import { authApi } from "@/lib/api/endpoints"
  import { useAuth } from "@/lib/auth/auth-context"
  import { parseId } from "@/lib/candidate-id"

  // ─── Tokens ──────────────────────────────────────────────────────────────────
  // Lime and ink are sampled from the logo. LIME_TEXT is a darker lime used only for
  // the headline: brand lime on near-white is ~1.1:1 contrast, #7A9A00 is ~3.2:1
  // (passes WCAG for large text).

  const LIME = "#E4F60A"
  const LIME_TEXT = "#7A9A00"
  const ID_EXAMPLE = "MK-290706568"

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  function getSafeRedirect(next: string | null): string {
    if (next && next.startsWith("/") && !next.startsWith("//") && !next.includes("\\")) {
      return next
    }
    return "/exams"
  }

  const prefersReducedMotion = () =>
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches

  /** Entrance animation via the Web Animations API — no keyframes file needed. */
  function useEntrance<T extends HTMLElement>(keyframes: Keyframe[], options: KeyframeAnimationOptions) {
    const ref = useRef<T>(null)
    useEffect(() => {
      const el = ref.current
      if (!el || prefersReducedMotion()) return
      el.animate(keyframes, { fill: "backwards", easing: "cubic-bezier(0.16, 1, 0.3, 1)", ...options })
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    return ref
  }

  // ─── Brand ───────────────────────────────────────────────────────────────────

  // ─── S path kept only for BackgroundS (the big decorative shape) ──────────────
  const S_PATH = "M23 48L12 66L12 68L8 75L4 87L3 95L2 96L2 101L1 102L1 113L0 114L1 131L2 132L2 137L7 155L17 176L22 184L34 198L47 209L61 218L65 219L70 222L87 227L92 227L93 228L316 228L317 229L324 229L330 232L339 242L341 248L341 261L337 270L329 278L324 280L58 280L57 281L45 282L32 287L20 295L13 302L6 312L6 314L1 325L1 330L0 331L0 361L4 366L6 367L300 367L301 368L308 368L309 367L316 367L317 368L324 368L325 367L346 367L347 366L352 366L353 365L357 365L364 363L385 353L399 343L412 330L420 320L421 317L425 312L434 293L439 275L439 270L441 263L441 239L440 238L440 232L439 231L438 222L430 200L428 198L428 196L420 183L407 168L399 161L386 152L376 147L362 142L354 141L353 140L346 140L345 139L115 139L107 135L101 128L97 118L97 109L98 108L98 105L103 96L108 91L114 88L375 88L376 87L386 87L387 86L394 85L402 81L404 81L415 74L426 63L433 51L437 38L437 6L434 2L430 0L108 0L107 1L100 1L99 2L87 4L73 10L71 10L61 15L41 29Z"
  const S_VIEWBOX = "0 0 442 369"

  // ─── Logo: uses the image from /public/logo.png ───────────────────────────────
  // Replace "logo.png" with your actual filename. Keep the file in /public.
  // Recommended: PNG/WebP with transparent background, min 400px wide.

  const LOGO_SIZES = {
    sm: { w: 80,  h: 28  }, // card (compact)
    md: { w: 110, h: 38  }, // header / default
    lg: { w: 140, h: 48  }, // large hero use
  } as const

  function Logo({ size = "md" }: { size?: keyof typeof LOGO_SIZES }) {
    const { w, h } = LOGO_SIZES[size]
    return (
      <Image
        src="/logo.png"
        alt="Steply.uz"
        width={w}
        height={h}
        priority
        style={{ height: h, width: "auto", maxWidth: w }}
        className="object-contain"
      />
    )
  }

  /** The giant faded S in the background: same path, lime → transparent gradient. */
  function BackgroundS() {
    const gid = useId()
    const ref = useEntrance<HTMLDivElement>(
      [
        { opacity: 0, transform: "translate3d(-40px, 40px, 0)" },
        { opacity: 1, transform: "translate3d(0, 0, 0)" },
      ],
      { duration: 1400, delay: 50 },
    )
    return (
      <div
        ref={ref}
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-[16vw] -left-[6vw] w-[84vw] lg:-bottom-[8vw] lg:-left-[2vw] lg:w-[58vw]"
      >
        {/* Tilted and stretched like the reference; slow float is the only ambient motion */}
        <div className="origin-bottom-left -rotate-[13deg] scale-x-[1.45] animate-[steply-float_14s_ease-in-out_infinite] motion-reduce:animate-none">
          <svg viewBox={S_VIEWBOX} className="w-full">
            <defs>
              <linearGradient id={gid} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor={LIME} stopOpacity="0.85" />
                <stop offset="0.55" stopColor={LIME} stopOpacity="0.45" />
                <stop offset="1" stopColor={LIME} stopOpacity="0.05" />
              </linearGradient>
            </defs>
            <path d={S_PATH} fill={`url(#${gid})`} />
          </svg>
        </div>
        <style>{`@keyframes steply-float { 0%,100% { translate: 0 0 } 50% { translate: 0 -14px } }`}</style>
      </div>
    )
  }

  // ─── Form ────────────────────────────────────────────────────────────────────

  function LoginForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { refresh } = useAuth()
    const inputRef = useRef<HTMLInputElement>(null)
    const fieldRef = useRef<HTMLDivElement>(null)

    const [candidateId, setCandidateId] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const [touched, setTouched] = useState(false)

    const trimmed = candidateId.trim()
    const parsed = trimmed ? parseId(trimmed) : null
    const showFormatError = touched && trimmed.length > 0 && !parsed
    const errorText = error || (showFormatError ? `Format noto'g'ri. Namuna: ${ID_EXAMPLE}` : "")

    // Autofocus on desktop only — on mobile it pops the keyboard over everything
    useEffect(() => {
      if (window.matchMedia("(min-width: 1024px)").matches) inputRef.current?.focus()
    }, [])

    function fail(message: string) {
      setError(message)
      setLoading(false)
      if (!prefersReducedMotion()) {
        fieldRef.current?.animate(
          [
            { transform: "translateX(0)" },
            { transform: "translateX(-8px)" },
            { transform: "translateX(7px)" },
            { transform: "translateX(-4px)" },
            { transform: "translateX(2px)" },
            { transform: "translateX(0)" },
          ],
          { duration: 380, easing: "ease-out" },
        )
      }
    }

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      setCandidateId(e.target.value.toUpperCase().replace(/\s+/g, ""))
      if (error) setError("")
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
      e.preventDefault()
      setTouched(true)
      setError("")

      if (!parsed) {
        fail(`ID formati noto'g'ri. Namuna: ${ID_EXAMPLE}`)
        return
      }

      setLoading(true)
      try {
        const res = await authApi.candidateLogin(parsed.raw)
        if (res.status !== "success") {
          fail(res.message || "Bu ID topilmadi yoki hali faollashtirilmagan.")
          return
        }
        await refresh()
        // Keep loading=true so the button doesn't flash back during navigation
        router.push(getSafeRedirect(searchParams.get("next")))
      } catch (err) {
        const raw = err instanceof Error ? err.message : ""
        const isInternal =
          !raw ||
          raw.includes("TURBOPACK") ||
          raw.includes("webpack") ||
          raw.includes("is not a function") ||
          raw.includes("imported_module") ||
          raw.length > 120
        fail(isInternal ? "Serverga ulanib bo'lmadi. Internetni tekshirib, qayta urinib ko'ring." : raw)
      }
    }

    return (
      <form onSubmit={handleSubmit} noValidate className="w-full">
        <label htmlFor="candidateId" className="sr-only">
          Nomzod ID
        </label>

        <div ref={fieldRef} className="relative">
          <IdCard
            className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-[#8A8C94]"
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            id="candidateId"
            name="candidateId"
            type="text"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            autoCapitalize="characters"
            maxLength={32}
            value={candidateId}
            onChange={handleChange}
            onBlur={() => setTouched(true)}
            placeholder={`Masalan: ${ID_EXAMPLE}`}
            required
            aria-invalid={!!errorText}
            aria-describedby={errorText ? "candidate-error" : undefined}
            disabled={loading}
            className={[
              "h-[52px] w-full rounded-xl border bg-white pl-14 pr-4 text-[15px] font-medium text-[#0B0B0B]",
              "outline-none transition-[border-color,box-shadow] placeholder:text-[#B0B1B9]",
              "focus:border-[#0B0B0B] focus:ring-4 focus:ring-[#E4F60A]/60 disabled:opacity-60",
              errorText ? "border-red-500" : parsed ? "border-[#9DC000]" : "border-[#DCDDE2]",
            ].join(" ")}
          />
        </div>

        {errorText && (
          <p id="candidate-error" role="alert" className="mt-3 flex items-start gap-2 text-sm text-red-600">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {errorText}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className="group mt-6 flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#D4F53C] px-5
                    text-[15px] font-semibold text-[#0B0B0B] transition-[transform,background-color,box-shadow]
                    hover:bg-[#CAF02A] hover:shadow-[0_8px_28px_rgba(180,226,0,0.38)] active:scale-[0.99]
                    focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0B0B0B]/15
                    disabled:cursor-wait disabled:opacity-70 motion-reduce:transition-none"
        >
          {loading ? (
            <>
              <Loader2 className="size-5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
              Tekshirilmoqda…
            </>
          ) : (
            <>
              Kirish
              <ArrowRight
                className="size-5 transition-transform group-hover:translate-x-1 motion-reduce:transition-none"
                aria-hidden="true"
              />
            </>
          )}
        </button>
      </form>
    )
  }

  // ─── Page ────────────────────────────────────────────────────────────────────

  export default function LoginPage() {
    const headlineRef = useEntrance<HTMLDivElement>(
      [
        { opacity: 0, transform: "translateY(18px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      { duration: 900, delay: 150 },
    )
    const cardRef = useEntrance<HTMLDivElement>(
      [
        { opacity: 0, transform: "translateY(24px) scale(0.98)" },
        { opacity: 1, transform: "translateY(0) scale(1)" },
      ],
      { duration: 900, delay: 300 },
    )

    return (
      <main
        className="relative isolate min-h-svh overflow-hidden bg-[#FBFCF6] text-[#0B0B0B]"
        style={{
          backgroundImage: `radial-gradient(ellipse 40% 45% at 0% 0%, rgba(228,246,10,0.28), transparent 70%),
                            radial-gradient(ellipse 35% 40% at 100% 100%, rgba(228,246,10,0.45), transparent 70%)`,
        }}
      >
        <BackgroundS />

        <div
          className="relative grid min-h-svh w-full items-center gap-10 px-5 py-8
                    sm:px-10 lg:grid-cols-[1fr_minmax(0,50%)] lg:gap-0 lg:px-0 lg:py-0"
        >
          {/* Left: headline only — no logo */}
          <div ref={headlineRef} className="hidden items-center self-stretch lg:flex lg:pl-[8vw] xl:pl-[10vw]">
            <h1 className="text-[clamp(2.4rem,3.6vw,3.8rem)] font-extrabold leading-[1.1] tracking-[-0.03em]">
              Ta&lsquo;lim sifatini
              <br />
              <span style={{ color: LIME_TEXT }}>birgalikda oshiramiz</span>
            </h1>
          </div>

          {/* Right: card */}
          <div
            ref={cardRef}
            className="mx-auto w-full max-w-[480px] rounded-[28px] bg-white/92 px-6 py-10 shadow-[0_24px_64px_rgba(20,24,0,0.07)]
                      ring-1 ring-black/[0.045] backdrop-blur-sm sm:px-12 sm:py-14
                      lg:mx-auto lg:max-w-[420px] lg:rounded-[32px] lg:px-[52px] lg:py-[68px]"
          >
            <div className="flex justify-center">
              <Logo size="lg" />
            </div>

            <h2 className="mb-7 mt-7 text-2xl font-bold tracking-[-0.02em] sm:text-[26px]">Kirish</h2>

            {/* useSearchParams requires a Suspense boundary in the App Router */}
            <Suspense fallback={<div className="h-[140px]" aria-hidden="true" />}>
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </main>
    )
  }
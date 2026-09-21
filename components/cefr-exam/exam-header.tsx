"use client"

import { useEffect, useState } from "react"
import {
    Clock,
    BookCheck,
    Loader2,
    BookOpen
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { authService } from "@/lib/api/auth"
import type { ExamsMe } from "@/lib/api/types"

type SectionType = "reading" | "listening" | "writing" | "speaking" | "process"

interface ExamHeaderProps {
    initialSeconds?: number
    currentSection: SectionType
    onFinish?: () => void
}

const SECTION_CONFIG = {
    // Ikonkalar uchun PNG yo'llarini to'g'rilab chiqing
    reading: { label: "O'qish tushunish qismi", icon: BookOpen },
    listening: { label: "Tinglash tushunish qismi", icon: "/listening.png" },
    writing: { label: "Yozish qismi", icon: "/writing.png" }, // /wrting xatosi tuzatildi
    speaking: { label: "Gapirish qismi", icon: "/speaking.png" },
    process: { label: "Imthon Jarayon", icon: BookCheck } // Bu Lucide komponenti bo'lib qolaveradi
}

export default function ExamHeader({
    initialSeconds = 3600,
    currentSection = "reading",
    onFinish,
}: ExamHeaderProps) {
    const [timeRemaining, setTimeRemaining] = useState(initialSeconds)
    const [userData, setUserData] = useState<ExamsMe | null>(null)
    const [loadingUser, setLoadingUser] = useState(true)

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await authService.getMe()
                setUserData(res)
            } catch (err) {
                console.error("User fetch error in header:", err)
            } finally {
                setLoadingUser(false)
            }
        }
        fetchUser()
    }, [])

    useEffect(() => {
        if (timeRemaining <= 0) return
        const timer = setInterval(() => {
            setTimeRemaining((prev) => prev - 1)
        }, 1000)
        return () => clearInterval(timer)
    }, [timeRemaining])

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }

    const activeConfig = SECTION_CONFIG[currentSection]
    // Ikonka turini aniqlaymiz
    const IconContent = activeConfig.icon

    const getInitials = (name: string) => {
        return name?.split(" ").map(n => n[0]).join("").toUpperCase() || "U"
    }

    return (
        <header className="sticky top-0 z-30 w-full border-b bg-white/80 backdrop-blur-md shadow-sm">
            <div className="flex items-center justify-between px-4 py-3 md:px-8">

                {/* CHAP TOMON: BO'LIM NOMI VA IKONKA */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center  text-[#17776A]">
                        {typeof IconContent === 'string' ? (
                            <img 
                                src={IconContent} 
                                alt="section icon" 
                                className="h-12 w-12" 
                            />
                        ) : (
                            // @ts-ignore - Lucide icon component
                            <IconContent className="h-10 w-10" />
                        )}
                    </div>
                    <p className="hidden text-xs font-black uppercase tracking-widest text-gray-500 sm:inline-block leading-none">
                        {activeConfig.label}
                    </p>
                </div>


                {/* O'NG TOMON: PROFIL */}
                <div className="flex items-center gap-3">
                    <div className="hidden text-right sm:block">
                        {loadingUser ? (
                            <div className="h-4 w-24 bg-slate-100 animate-pulse rounded" />
                        ) : (
                            <>
                                <p className="text-sm font-black text-slate-900 leading-none mb-1 truncate max-w-[150px]">
                                    {userData?.full_name || "Foydalanuvchi"}
                                </p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Candidate</p>
                            </>
                        )}
                    </div>

                    <Avatar className="h-10 w-10 border-2 border-white shadow-sm ring-1 ring-slate-100">
                        <AvatarFallback className="bg-[#17776A] text-white font-bold text-xs uppercase">
                            {loadingUser ? <Loader2 className="h-4 w-4 animate-spin" /> : getInitials(userData?.full_name || "U")}
                        </AvatarFallback>
                    </Avatar>
                </div>

            </div>
        </header>
    )
}


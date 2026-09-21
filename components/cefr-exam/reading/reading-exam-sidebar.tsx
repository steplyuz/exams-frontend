"use client"

import { Minus, Plus, Type, Video, CheckCircle2, Menu, X, Clock } from "lucide-react"
import React, { useState } from "react"

interface ExamSidebarProps {
    currentQuestion: number
    totalQuestions: number
    answered: Record<number, boolean>
    timeLeft: string
    fontSize: number
    onSelectQuestion: (q: number) => void
    onFinish: () => void
    onIncreaseFontSize: () => void
    onDecreaseFontSize: () => void
}

export default function ReadingExamSidebar({
    currentQuestion, totalQuestions, answered, timeLeft, fontSize,
    onSelectQuestion, onFinish, onIncreaseFontSize, onDecreaseFontSize
}: ExamSidebarProps) {
    const [isOpen, setIsOpen] = useState(false) // Mobil menyu holati
    const questions = Array.from({ length: totalQuestions }, (_, i) => i + 1)

    const SidebarContent = () => (
        <div className="flex flex-col h-full max-h-screen">

            {/* 1. VAQT VA YAKUNLASH */}
            <div className="shrink-0 space-y-3 mb-4">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-black mb-1">Qolgan vaqt</span>
                    <div className="text-2xl lg:text-3xl font-mono font-black text-slate-800 tabular-nums">
                        {timeLeft}
                    </div>
                </div>
                <button
                    onClick={onFinish}
                    className="w-full bg-blue-600 hover:bg-red-600 text-white font-bold py-3 lg:py-3.5 rounded-xl text-[11px] lg:text-xs transition-all active:scale-95 uppercase tracking-wider shadow-lg shadow-blue-100"
                >
                    Yakunlash
                </button>
            </div>

            {/* 2. SOZLAMALAR */}
            <div className="bg-white p-2 lg:p-3 rounded-xl border border-slate-200 shadow-sm shrink-0 mb-4">
                <div className="flex items-center justify-between">
                    <button onClick={onDecreaseFontSize} className="w-8 h-8 lg:w-9 lg:h-9 flex items-center justify-center bg-slate-50 rounded-lg border border-slate-100 font-black text-xs">-A</button>
                    <span className="text-[9px] lg:text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Type className="w-3.5 h-3.5 text-blue-500" /> Matn
                    </span>
                    <button onClick={onIncreaseFontSize} className="w-8 h-8 lg:w-9 lg:h-9 flex items-center justify-center bg-slate-50 rounded-lg border border-slate-100 font-black text-xs">A+</button>
                </div>
            </div>

            {/* 3. SAVOLLAR NAVIGATORI */}
            <div className="flex flex-col min-h-0 mb-4 bg-white rounded-2xl lg:rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-3 lg:p-4 pb-2 flex items-center justify-between shrink-0 border-b border-slate-50">
                    <span className="text-[10px] uppercase tracking-widest text-slate-500 font-black">Savollar</span>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                        {Object.keys(answered).length}/{totalQuestions}
                    </span>
                </div>

                {/* Skroll qismi - balandlikni faqat kerakli miqdorda cheklaymiz */}
                <div className="overflow-y-auto p-3 lg:p-4 custom-scrollbar max-h-[280px] lg:max-h-[320px]">
                    <div className="grid grid-cols-7 lg:grid-cols-5 gap-2">
                        {questions.map((q) => {
                            const isActive = q === currentQuestion
                            const isDone = answered[q]
                            return (
                                <button
                                    key={q}
                                    onClick={() => {
                                        onSelectQuestion(q);
                                        if (window.innerWidth < 1024) setIsOpen(false);
                                    }}
                                    className={`w-8 h-8 lg:w-9 lg:h-9 mx-auto flex items-center justify-center rounded-full border-2 text-[10px] lg:text-[11px] font-black transition-all
                        ${isActive ? "bg-blue-600 text-white border-blue-600"
                                            : isDone ? "bg-emerald-500 text-white border-emerald-500"
                                                : "bg-slate-50 text-slate-400 border-slate-100"}`}
                                >
                                    {q}
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* 4. KAMERA */}
            <div className="hidden lg:block shrink-0">
                <div className="bg-slate-900 aspect-video rounded-2xl overflow-hidden relative border-2 border-white shadow-xl">
                    <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5 bg-black/50 px-2 py-1 rounded-full backdrop-blur-md border border-white/10">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="text-[8px] text-white font-black uppercase tracking-widest">Live</span>
                    </div>
                    <div className="w-full h-full flex items-center justify-center bg-slate-800">
                        <Video className="text-slate-700" size={24} />
                    </div>
                </div>
            </div>
        </div>
    )

    return (
        <>
            {/* MOBIL UCHUN TEPADAGI PANEL */}
            {!isOpen && (
                <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 bg-white/90 backdrop-blur-xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.12)] px-4 py-2 rounded-full transition-all animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex items-center gap-2 px-3 border-r border-slate-200 pr-4">
                        <Clock size={16} className="text-blue-600" />
                        <span className="font-mono font-black text-slate-700 tabular-nums">{timeLeft}</span>
                    </div>
                    <button
                        onClick={() => setIsOpen(true)}
                        className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-200 active:scale-90 transition-transform"
                    >
                        <Menu size={20} />
                    </button>
                </div>
            )}

            {/* ASOSIY SIDEBAR (Desktopda o'ngda, Mobilda pastdan yuqoriga) */}
            <aside className={`
            fixed lg:relative z-[100] lg:z-auto
            /* Mobil holati */
            bottom-0 left-0 right-0 h-[85vh] rounded-t-[32px] 
            /* Desktop holati */
            lg:h-screen lg:w-72 lg:rounded-none lg:translate-y-0
            
            bg-[#F8FAFC] border-t lg:border-t-0 lg:border-l border-slate-200 
            flex flex-col shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] lg:shadow-none
            transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1)
            ${isOpen ? "translate-y-0" : "translate-y-full lg:translate-y-0"}
        `}>
                {/* Mobilda tepasidagi kichik chiziq (Handle) */}
                <div className="lg:hidden flex flex-col items-center pt-3 pb-1">
                    <div className="w-12 h-1.5 bg-slate-300 rounded-full mb-2"></div>
                    <div className="w-full flex items-center justify-between px-6 pb-2 border-b border-slate-100">
                        <span className="font-bold text-slate-800 uppercase text-[10px] tracking-widest">Navigator</span>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1.5 bg-slate-100 rounded-full text-slate-600 active:scale-90 transition-all"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Sidebar mazmuni */}
                <div className="flex-1 overflow-hidden p-5 flex flex-col h-full">
                    <SidebarContent />
                </div>
            </aside>

            {/* Mobilda orqa fonni xiralashtirish */}
            {isOpen && (
                <div
                    onClick={() => setIsOpen(false)}
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[90] lg:hidden transition-opacity duration-300"
                />
            )}
        </>
    )
}
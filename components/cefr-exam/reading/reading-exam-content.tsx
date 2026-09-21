"use client"

import { useState, useCallback, useRef, useEffect, useMemo } from "react"
import { Eraser, Folder, BookOpen, HelpCircle, CheckCircle2 } from "lucide-react"
import QuestionRenderer, { GapFillFillRenderer } from "@/components/cefr-exam/reading/reading-question-renderer"
import HighlightText from "@/components/highlight-text"
import type { ReadingExam } from "@/lib/cefr-types/reading"

interface ReadingExamContentProps {
    examData: ReadingExam;
    currentQuestion: number;
    answered: Record<number, boolean>;
    answers: Record<number, string>;
    onAnswer: (questionId: number, value: string) => void;
    onSelectQuestion: (dbId: number) => void;
    fontSize?: number;
    revMap: Record<number, number>;
}

export default function ReadingExamContent({
    examData,
    currentQuestion,
    answers,
    onAnswer,
    onSelectQuestion,
    fontSize = 18,
    revMap = {},
}: ReadingExamContentProps) {
    const [activePartIndex, setActivePartIndex] = useState(0)
    const [highlightsByPart, setHighlightsByPart] = useState<Record<number, any[]>>({})
    const [activeColor, setActiveColor] = useState("#fef08a")
    const [sidebarWidth, setSidebarWidth] = useState(45)
    const [isResizing, setIsResizing] = useState(false)
    const [activeView, setActiveView] = useState<"passage" | "questions">("passage")

    const containerRef = useRef<HTMLDivElement>(null)
    const currentPart = examData.parts[activePartIndex];
    const currentHighlights = highlightsByPart[activePartIndex] || [];

    // Part to'liq bajarilganini tekshirish (Hamma javoblar belgilangan bo'lsa)
    const isPartDone = useMemo(() => (partIndex: number) => {
        const partQuestions = examData.parts[partIndex].questions;
        return partQuestions.every(q => answers[Number(q.id)] && answers[Number(q.id)].trim() !== "");
    }, [examData.parts, answers]);

    useEffect(() => {
        if (!examData?.parts) return;
        const pIdx = examData.parts.findIndex(p =>
            p.questions.some(q => Number(q.id) === Number(currentQuestion))
        )
        if (pIdx !== -1 && pIdx !== activePartIndex) {
            setActivePartIndex(pIdx)
        }
    }, [currentQuestion, examData.parts, activePartIndex])

    const handleAddHighlight = useCallback((newHl: any) => {
        setHighlightsByPart(prev => ({
            ...prev,
            [activePartIndex]: [...(prev[activePartIndex] || []), newHl]
        }));
    }, [activePartIndex]);

    const handleRemoveHighlight = useCallback((id: string) => {
        setHighlightsByPart(prev => ({
            ...prev,
            [activePartIndex]: (prev[activePartIndex] || []).filter(h => h.id !== id)
        }));
    }, [activePartIndex]);

    const renderPassage = () => {
        if (!currentPart?.passage) return null;
        const text = currentPart.passage;
        const gapFillQs = currentPart.questions.filter(q => q.type === "GAP_FILL");
        const segments = text.split(/_{3,}|__________/g);
        let currentGlobalOffset = 0;

        return (
            <div className="leading-[2.2] md:leading-[2.5] text-justify whitespace-pre-wrap text-slate-800 select-text"
                style={{ fontSize: `${fontSize}px` }}>
                {segments.map((segment, i) => {
                    const q = gapFillQs[i];
                    const qId = q ? Number(q.id) : null;
                    const displayNum = qId ? revMap[qId] : "";
                    const thisSegmentOffset = currentGlobalOffset;
                    currentGlobalOffset += segment.length + 10;

                    return (
                        <span key={i} className="inline">
                            <HighlightText
                                text={segment}
                                highlights={currentHighlights}
                                onAddHighlight={handleAddHighlight}
                                onRemoveHighlight={handleRemoveHighlight}
                                offset={thisSegmentOffset}
                                activeColor={activeColor}
                            />
                            {i < segments.length - 1 && qId && (
                                <input
                                    type="text"
                                    value={answers[qId] || ""}
                                    onChange={e => onAnswer(qId, e.target.value)}
                                    onFocus={() => onSelectQuestion(qId)}
                                    placeholder={`(${displayNum})`}
                                    className={`w-24 md:w-32 h-8 mx-1 px-2 border-b-2 outline-none text-center font-bold transition-all rounded-t-md
                                        ${Number(currentQuestion) === qId
                                            ? "border-blue-600 bg-blue-50 ring-2 ring-blue-100"
                                            : "border-blue-300 bg-blue-50/30"}`}
                                />
                            )}
                        </span>
                    )
                })}
            </div>
        )
    }

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing || !containerRef.current) return;
            const containerWidth = containerRef.current.offsetWidth;
            const rect = containerRef.current.getBoundingClientRect();
            const newWidth = ((containerWidth - (e.clientX - rect.left)) / containerWidth) * 100;
            if (newWidth > 20 && newWidth < 80) setSidebarWidth(newWidth);
        };
        const handleMouseUp = () => setIsResizing(false);
        if (isResizing) {
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseup", handleMouseUp);
        }
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isResizing]);

    return (
        <div ref={containerRef} className="flex flex-col h-full bg-white overflow-hidden relative border border-gray-200 shadow-sm rounded-lg">

            {/* PART NAVIGATION */}
            <div className="h-14 bg-white border-b flex items-center shrink-0 z-10 overflow-x-auto no-scrollbar px-4 shadow-sm">
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl mx-auto border border-slate-200/50">
                    {examData.parts.map((_, idx) => {
                        const done = isPartDone(idx);
                        const active = activePartIndex === idx;

                        return (
                            <button
                                key={idx}
                                onClick={() => {
                                    setActivePartIndex(idx);
                                    const firstQ = examData.parts[idx].questions[0];
                                    if (firstQ) onSelectQuestion(Number(firstQ.id));
                                }}
                                className={`
                        flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] md:text-[11px] font-black transition-all duration-300 whitespace-nowrap
                        ${active
                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-200 ring-1 ring-blue-700 scale-[1.05] z-10"
                                        : done
                                            ? "bg-emerald-500 text-emerald-50 shadow-sm"
                                            : "text-slate-400 hover:bg-slate-200/50"
                                    }
                    `}
                            >
                                {/* Icon o'zgarishi: Done bo'lsa Check, Active bo'lsa Folder (o'zgaruvchan fill bilan) */}
                                {done && !active ? (
                                    <CheckCircle2 size={13} className="text-emerald-50 animate-in zoom-in" />
                                ) : (
                                    <Folder
                                        size={13}
                                        className={`transition-colors ${active ? "text-blue-100 fill-blue-100/30" : "text-slate-300"}`}
                                    />
                                )}

                                <span className="tracking-widest uppercase italic">
                                    {idx + 1}
                                </span>

                                {/* Active bo'lganda yonida kichik chiziqcha yoki Done bo'lganda indicator */}
                                {active && <div className="w-1 h-3 bg-blue-300 rounded-full animate-pulse" />}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* MOBILE VIEW SWITCHER */}
            <div className="lg:hidden flex border-b bg-slate-50 shrink-0">
                <button
                    onClick={() => setActiveView("passage")}
                    className={`flex-1 py-3 flex items-center justify-center gap-2 text-xs font-bold transition-all ${activeView === "passage" ? "bg-white text-blue-600 border-b-2 border-blue-600" : "text-slate-400"}`}
                >
                    <BookOpen size={16} /> Matnni O'qish
                </button>
                <button
                    onClick={() => setActiveView("questions")}
                    className={`flex-1 py-3 flex items-center justify-center gap-2 text-xs font-bold transition-all ${activeView === "questions" ? "bg-white text-blue-600 border-b-2 border-blue-600" : "text-slate-400"}`}
                >
                    <HelpCircle size={16} /> Savollar
                </button>
            </div>

            <div className="flex flex-1 overflow-hidden relative">

                {/* LEFT SIDE: Passage (MATN) - PB-32 qo'shildi */}
                <div
                    style={{ width: typeof window !== 'undefined' && window.innerWidth < 1024 ? '100%' : `${100 - sidebarWidth}%` }}
                    className={`h-full overflow-y-auto p-5 md:p-8 pb-32 lg:pb-8 bg-white no-copy transition-all duration-300
                        ${activeView === "passage" ? "block" : "hidden lg:block"}
                    `}
                >
                    <div className="max-w-3xl mx-auto">
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 border-b pb-4 gap-4">
                            <h2 className="font-black text-blue-900 uppercase italic tracking-tighter" style={{ fontSize: `${fontSize + 4}px` }}>
                                {currentPart.title}
                            </h2>
                            <div className="flex gap-2 bg-slate-50 p-1.5 rounded-full border self-start md:self-auto">
                                <button onClick={() => setActiveColor("transparent")} className={`p-1.5 rounded-full transition ${activeColor === "transparent" ? "bg-blue-100 text-blue-600" : "text-slate-400"}`}>
                                    <Eraser size={14} />
                                </button>
                                {['#fef08a', '#bbf7d0', '#fecaca'].map(c => (
                                    <button key={c} onClick={() => setActiveColor(c)} className="w-6 h-6 rounded-full border" style={{ backgroundColor: c, outline: activeColor === c ? '2px solid #3b82f6' : 'none', outlineOffset: '2px' }} />
                                ))}
                            </div>
                        </div>
                        {renderPassage()}
                    </div>
                </div>

                {/* RESIZER BAR */}
                <div
                    onMouseDown={() => setIsResizing(true)}
                    className={`hidden lg:block w-1 cursor-col-resize transition-colors ${isResizing ? 'bg-blue-500' : 'bg-gray-200'} hover:bg-blue-400`}
                />

                {/* RIGHT SIDE: Questions (SAVOLLAR) - PB-32 qo'shildi */}
                <div
                    style={{ width: typeof window !== 'undefined' && window.innerWidth < 1024 ? '100%' : `${sidebarWidth}%` }}
                    className={`h-full overflow-y-auto p-4 md:p-6 pb-32 lg:pb-6 bg-slate-50 border-l transition-all duration-300
                        ${activeView === "questions" ? "block" : "hidden lg:block"}
                    `}
                >
                    <div className="max-w-lg mx-auto space-y-4">
                        {currentPart.questions.map((q) => {
                            const qId = Number(q.id);
                            const displayNum = revMap[qId] || q.question_number || q.id;
                            if (q.type === "GAP_FILL") return null;

                            return (
                                <div key={q.id}
                                    onClick={() => onSelectQuestion(qId)}
                                    className={`p-4 md:p-5 rounded-2xl md:rounded-3xl border bg-white transition-all cursor-pointer 
                                        ${Number(currentQuestion) === qId ? "border-blue-400 shadow-lg ring-1 ring-blue-100" : "border-gray-100"}`}
                                >
                                    <div className="flex gap-3 md:gap-4 text-left">
                                        <div className="shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-[10px] md:text-[11px]">
                                            {displayNum}
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <p className="font-bold text-slate-800 mb-3 text-sm leading-relaxed">{q.text}</p>
                                            {q.type === "GAP_FILL_FILL" ? (
                                                <GapFillFillRenderer answer={answers[qId] || ""} onInputChange={(v) => onAnswer(qId, v)} fontSize={fontSize} />
                                            ) : (
                                                <QuestionRenderer question={q} answer={answers[qId] || ""} onAnswer={v => onAnswer(qId, v)} onInputChange={v => onAnswer(qId, v)} fontSize={fontSize} />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}
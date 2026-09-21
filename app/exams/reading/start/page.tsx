"use client"

import { useEffect, useState, useRef, useCallback, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import ExamHeader from "@/components/cefr-exam/exam-header"
import ReadingExamContent from "@/components/cefr-exam/reading/reading-exam-content"
import ReadingExamSidebar from "@/components/cefr-exam/reading/reading-exam-sidebar"
import { getReadingExamByIdAPI, submitReadingExamAPI } from "@/lib/cefr-api/reading"
import { pullMockSkillResultAPI } from "@/lib/cefr-api/mock"
import { saveLastResult } from "@/lib/exams-result-storage"
import type { ReadingExam } from "@/lib/cefr-types/reading"
import { Loader2, AlertCircle, Play } from "lucide-react"
import { toast } from "sonner"
import { motion } from "framer-motion"

export default function ExamPage() {
    const searchParams = useSearchParams()
    const router = useRouter()

    // --- URL PARAMETERS ---
    const testId = searchParams.get("id")
    const mode = searchParams.get("mode") // "mock" yoki null
    const attemptId = searchParams.get("attemptId") // Mock urinish ID si

    // --- STATE ---
    const [test, setTest] = useState<ReadingExam | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [timeLeft, setTimeLeft] = useState<number | null>(null)
    const [currentVirtualId, setCurrentVirtualId] = useState<number>(1)
    const [idMap, setIdMap] = useState<Record<number, number>>({})
    const [revMap, setRevMap] = useState<Record<number, number>>({})
    const [answers, setAnswers] = useState<Record<number, string>>({})
    const [answered, setAnswered] = useState<Record<number, boolean>>({})

    const [hasStarted, setHasStarted] = useState<boolean>(() => {
        if (typeof window !== "undefined" && testId) {
            return localStorage.getItem(`reading-${testId}-started`) === "true"
        }
        return false
    })

    const answersRef = useRef<Record<number, string>>({})
    const [fontSize, setFontSize] = useState(18)
    const [isFinishModalOpen, setIsFinishModalOpen] = useState(false)
    const isExamFinished = useRef(false)
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- 🏁 FINISH LOGIC (MOCK & SINGLE) ---
    const handleFinish = useCallback(async () => {
        if (!testId || isExamFinished.current || isSubmitting) return;

        setIsSubmitting(true);
        isExamFinished.current = true;

        // URL parametrlarini olish
        const actualMockExamId = searchParams.get("examId");
        const attemptIdFromUrl = searchParams.get("attemptId");

        // 1. Javoblarni Backend kutgan formatga o'tkazamiz
        // Swagger: { "answers": [ { "question_id": 0, "answers": ["string"] } ] }
        const finalAnswers = { ...answersRef.current };
        const formattedAnswersArray = Object.entries(finalAnswers).map(([dbId, value]) => ({
            question_id: Number(dbId),
            // Javob har doim massiv ichida string bo'lishi kerak
            answers: Array.isArray(value) ? value.map(String) : [String(value)]
        }));

        try {
            // Javob har doim shu orqali saqlanadi — mock rejimda ham (bo'lim
            // natijasi shu yerda yaratiladi), keyin mock urinishga "tortiladi".
            const response = await submitReadingExamAPI(String(testId), {
                answers: formattedAnswersArray,
                exam_attempt_id: attemptIdFromUrl ? Number(attemptIdFromUrl) : null,
            });

            localStorage.removeItem(`reading-${testId}-started`);
            localStorage.removeItem(`reading-${testId}-answers`);
            localStorage.removeItem(`reading-${testId}-time`);

            if (mode === "mock" && attemptIdFromUrl) {
                await pullMockSkillResultAPI(Number(attemptIdFromUrl), "READING");
                toast.success("Reading yakunlandi");
                router.push(`/exams/process/${attemptIdFromUrl}?examId=${actualMockExamId || testId}`);
            } else {
                toast.success("Test yakunlandi");
                saveLastResult("reading", response.data);
                router.push(`/exams/results/reading`);
            }
        } catch (err: any) {
            console.error("Reading submit error:", err);
            toast.error(err?.message || "Natijani saqlashda xatolik yuz berdi");
            setIsSubmitting(false);
            isExamFinished.current = false;
        }
    }, [testId, mode, isSubmitting, router, searchParams]);
    
    // --- 📥 DATA FETCHING ---
    useEffect(() => {
        if (!testId) return;

        const fetchExam = async () => {
            setLoading(true);
            try {
                const response = await getReadingExamByIdAPI(testId);
                const examData = response.data;
                setTest(examData);

                const mapping: Record<number, number> = {};
                const reverseMapping: Record<number, number> = {};
                let counter = 1;

                examData.parts.forEach((part: any) => {
                    part.questions.forEach((q: any) => {
                        const dbId = Number(q.id);
                        mapping[counter] = dbId;
                        reverseMapping[dbId] = counter;
                        counter++;
                    });
                });

                setIdMap(mapping);
                setRevMap(reverseMapping);

                const sessionStarted = localStorage.getItem(`reading-${testId}-started`) === "true";
                if (sessionStarted) {
                    setHasStarted(true);
                    const savedAnswers = localStorage.getItem(`reading-${testId}-answers`);
                    if (savedAnswers) {
                        const parsed = JSON.parse(savedAnswers);
                        setAnswers(parsed);
                        answersRef.current = parsed;
                        const newAnswered: Record<number, boolean> = {};
                        Object.keys(parsed).forEach(id => newAnswered[Number(id)] = !!parsed[id].trim());
                        setAnswered(newAnswered);
                    }
                    const savedTime = localStorage.getItem(`reading-${testId}-time`);
                    setTimeLeft(savedTime ? parseInt(savedTime, 10) : examData.duration_minutes * 60);
                } else {
                    setTimeLeft(examData.duration_minutes * 60);
                }
                setCurrentVirtualId(1);
            } catch (err: any) {
                setError(err.message || "Xatolik yuz berdi");
            } finally {
                setLoading(false);
            }
        };
        fetchExam();
    }, [testId]);

    // --- ⏱️ TIMER ---
    useEffect(() => {
        if (!testId || timeLeft === null || !test || !hasStarted || isExamFinished.current) return;
        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev === null || prev <= 1) {
                    clearInterval(interval);
                    handleFinish();
                    return 0;
                }
                const nextTime = prev - 1;
                localStorage.setItem(`reading-${testId}-time`, nextTime.toString());
                return nextTime;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [test, timeLeft, hasStarted, testId, handleFinish]);

    // --- 🛡️ BROWSER PROTECTION ---
    useEffect(() => {
        if (!hasStarted) return;
        const preventDefault = (e: BeforeUnloadEvent) => {
            if (!isExamFinished.current) { e.preventDefault(); e.returnValue = ""; }
        };
        window.history.pushState(null, "", window.location.href);
        const handlePopState = () => {
            if (!isExamFinished.current) window.history.pushState(null, "", window.location.href);
        };
        window.addEventListener("beforeunload", preventDefault);
        window.addEventListener("popstate", handlePopState);
        return () => {
            window.removeEventListener("beforeunload", preventDefault);
            window.removeEventListener("popstate", handlePopState);
        };
    }, [hasStarted]);

    // --- ⌨️ HANDLERS ---
    const handleAnswer = (questionId: number, value: string) => {
        if (!testId) return;
        setAnswers((prev) => {
            const newAnswers = { ...prev, [questionId]: value };
            answersRef.current = newAnswers;
            localStorage.setItem(`reading-${testId}-answers`, JSON.stringify(newAnswers));
            return newAnswers;
        });
        setAnswered((prev) => ({ ...prev, [questionId]: !!value.trim() }));
    };

    const virtualAnswered = useMemo(() => {
        const result: Record<number, boolean> = {};
        Object.entries(answered).forEach(([dbId, status]) => {
            const vId = revMap[Number(dbId)];
            if (vId) result[vId] = status;
        });
        return result;
    }, [answered, revMap]);

    const unansweredQuestions = useMemo(() => {
        const total = Object.keys(idMap).length;
        const remaining: number[] = [];
        for (let i = 1; i <= total; i++) {
            if (!virtualAnswered[i]) remaining.push(i);
        }
        return remaining;
    }, [idMap, virtualAnswered]);

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    };

    const startExam = () => {
        if (!testId) return;
        const elem = document.documentElement;
        if (elem.requestFullscreen) elem.requestFullscreen().catch(() => { });
        localStorage.setItem(`reading-${testId}-started`, "true");
        setHasStarted(true);
    };

    // --- RENDER LOGIC ---
    if (!testId) return (
        <div className="h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <h2 className="text-xl font-bold">Xatolik: ID topilmadi</h2>
        </div>
    );

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-slate-50">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mr-2" />
            <span className="font-bold text-slate-500">Yuklanmoqda...</span>
        </div>
    );

    if (error || !test) return (
        <div className="h-screen flex flex-col items-center justify-center bg-slate-50 text-center p-6">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <h2 className="text-xl font-bold mb-2">Xatolik yuz berdi</h2>
            <p className="text-slate-600 mb-6">{error || "Test topilmadi"}</p>
            <button onClick={() => router.back()} className="px-6 py-3 bg-slate-800 text-white rounded-xl">Orqaga</button>
        </div>
    );

    if (!hasStarted) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
                <div className="bg-white p-10 rounded-[40px] shadow-2xl text-center max-w-lg border-4 border-white animate-in zoom-in duration-300">
                    <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Play size={40} className="ml-1" />
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-800 mb-4 uppercase italic tracking-tight">{test.title}</h1>
                    <p className="text-slate-500 mb-8 font-medium italic">Reading bo&apos;limini boshlashga tayyormisiz?</p>
                    <button onClick={startExam} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-lg uppercase shadow-xl hover:bg-blue-700 active:scale-95 transition-all">
                        Bo'limni boshlash
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen flex-col bg-white overflow-hidden relative select-none">
            <ExamHeader currentSection="reading" />
            <div className="flex flex-1 overflow-hidden flex-row">
                <main className="flex-1 overflow-hidden relative">
                    <ReadingExamContent
                        examData={test!}
                        currentQuestion={idMap[currentVirtualId]}
                        answered={answered}
                        answers={answers}
                        revMap={revMap}
                        onAnswer={handleAnswer}
                        onSelectQuestion={(dbId) => setCurrentVirtualId(revMap[dbId])}
                        fontSize={fontSize}
                    />
                </main>
                <ReadingExamSidebar
                    currentQuestion={currentVirtualId}
                    totalQuestions={Object.keys(idMap).length}
                    answered={virtualAnswered}
                    timeLeft={formatTime(timeLeft || 0)}
                    onSelectQuestion={(vId) => setCurrentVirtualId(vId)}
                    onFinish={() => setIsFinishModalOpen(true)}
                    fontSize={fontSize}
                    onIncreaseFontSize={() => setFontSize(s => Math.min(s + 2, 30))}
                    onDecreaseFontSize={() => setFontSize(s => Math.max(s - 2, 12))}
                />
            </div>

            {/* 🏁 FINISH MODAL */}
            {isFinishModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[32px] shadow-2xl max-w-md w-full p-8 text-center border-4 border-white">
                        <h2 className="text-2xl font-black text-slate-800 mb-2 uppercase italic tracking-tight">Bo'limni yakunlash</h2>

                        {unansweredQuestions.length > 0 ? (
                            <div className="mb-8 text-left p-6 bg-amber-50 rounded-[24px] border border-amber-100">
                                <p className="text-amber-700 font-bold mb-4 text-center text-sm uppercase italic">Sizda {unansweredQuestions.length} ta savol qoldi:</p>
                                <div className="flex flex-wrap justify-center gap-2 max-h-40 overflow-y-auto">
                                    {unansweredQuestions.map(num => (
                                        <span key={num} className="w-10 h-10 flex items-center justify-center bg-white rounded-xl text-xs font-black text-slate-400 border border-slate-200 shadow-sm">{num}</span>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <p className="text-slate-500 font-bold mb-8 uppercase tracking-tight">Barcha savollar bajarildi. Tasdiqlaysizmi?</p>
                        )}

                        <div className="flex gap-4">
                            <button onClick={() => setIsFinishModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase hover:bg-slate-200 transition-all">Qaytish</button>
                            <button
                                disabled={isSubmitting}
                                onClick={handleFinish}
                                className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Yakunlash"}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
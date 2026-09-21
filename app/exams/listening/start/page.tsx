"use client"

import { useEffect, useState, useRef, useCallback, useMemo, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import ExamHeader from "@/components/cefr-exam/exam-header"
import ListeningExamContent from "@/components/cefr-exam/listening/listening-exam-content"
import ListeningExamSidebar from "@/components/cefr-exam/listening/listening-exam-sidebar"
import { Loader2, AlertCircle, Play } from "lucide-react"
import { toast } from "sonner"

// API
import { getListeningExamByIdAPI, submitListeningExamAPI } from "@/lib/cefr-api/listening"
import { pullMockSkillResultAPI } from "@/lib/cefr-api/mock"
import { saveLastResult } from "@/lib/exams-result-storage"
import type { ListeningExam } from "@/lib/cefr-types/listening"

function ExamLogic() {
    const searchParams = useSearchParams()
    const router = useRouter()

    // --- URL PARAMETERS ---
    const testId = searchParams.get("id")
    const mode = searchParams.get("mode") // "mock" yoki null
    const attemptId = searchParams.get("attemptId") // Mock urinish ID si
    const actualMockExamId = searchParams.get("examId") // Dashboardga qaytish uchun

    // --- STATE ---
    const [test, setTest] = useState<ListeningExam | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false) // 🟢 Submit holati

    const [hasStarted, setHasStarted] = useState(false)
    const [currentQuestion, setCurrentQuestion] = useState<number>(1)
    const [activePartIndex, setActivePartIndex] = useState(0)

    const [answers, setAnswers] = useState<Record<string, string>>({})
    const [answered, setAnswered] = useState<Record<string, boolean>>({})
    const answersRef = useRef<Record<string, string>>({})

    const [status, setStatus] = useState<"reading" | "playing" | "ending" | "finished">("reading")
    const [countdown, setCountdown] = useState(10)
    const [fontSize, setFontSize] = useState(18)
    const [volume, setVolume] = useState(80)
    const [audioProgress, setAudioProgress] = useState(0)
    const [audioCurrentTime, setAudioCurrentTime] = useState(0)
    const [isFinishModalOpen, setIsFinishModalOpen] = useState(false)

    // ----------------------------------------------------
    // 1. DATA FETCHING & SESSION RECOVERY
    // ----------------------------------------------------
    useEffect(() => {
        if (!testId) { setLoading(false); return; }

        const fetchExam = async () => {
            try {
                setLoading(true);
                const response: any = await getListeningExamByIdAPI(testId);
                let rawData = response?.data || response;

                if (!rawData) throw new Error("Ma'lumot topilmadi");

                const formattedData: ListeningExam = {
                    id: String(rawData.id || rawData._id),
                    title: rawData.title || "Listening Test",
                    isDemo: rawData.is_demo ?? false,
                    isFree: rawData.is_free ?? false,
                    sections: rawData.sections || "Listening",
                    level: rawData.level || "Medium",
                    duration: rawData.duration || 30,
                    totalQuestions: rawData.total_questions || 0,
                    parts: Array.isArray(rawData.parts) ? rawData.parts.map((p: any) => ({
                        id: String(p.id),
                        partNumber: p.part_number,
                        title: p.title,
                        instruction: p.instruction,
                        taskType: p.task_type,
                        audioLabel: p.audio_label,
                        context: p.context,
                        passage: p.passage,
                        mapImage: p.map_image,
                        options: p.options || [],
                        questions: Array.isArray(p.questions) ? p.questions.map((q: any) => ({
                            id: String(q.id),
                            questionNumber: q.question_number,
                            type: q.type,
                            question: q.question,
                            correctAnswer: q.correct_answer,
                            options: q.options || []
                        })) : []
                    })) : []
                };

                setTest(formattedData);

                const savedSession = localStorage.getItem(`listening-session-${testId}`);
                if (savedSession) {
                    const parsed = JSON.parse(savedSession);
                    setAnswers(parsed.answers || {});
                    setAnswered(parsed.answered || {});
                    answersRef.current = parsed.answers || {};
                    setActivePartIndex(parsed.activePartIndex || 0);
                    setStatus(parsed.status || "reading");
                    setCountdown(parsed.countdown ?? 10);
                    setAudioCurrentTime(parsed.audioCurrentTime || 0);
                    setHasStarted(true);
                }
            } catch (err: any) {
                setError("Testni yuklab bo'lmadi.");
            } finally {
                setLoading(false);
            }
        };
        fetchExam();
    }, [testId]);

    // ----------------------------------------------------
    // 2. FINISH LOGIC (MOCK & SINGLE)
    // ----------------------------------------------------
    const handleFinish = useCallback(async () => {
        // 1. Validatsiya: Test ID bormi va hozir submit ketyaptimi?
        if (!testId || isSubmitting) return;

        setIsSubmitting(true);

        try {
            // Fullscreen rejimini yopish
            if (document.fullscreenElement) {
                await document.exitFullscreen().catch(() => { });
            }

            // exam_id + user_answers (question_number -> javob) — backend
            // shu formatni kutadi (Reading/Writing'dagi answers massividan farqli).
            const response = await submitListeningExamAPI({
                exam_id: testId,
                user_answers: answersRef.current,
                exam_attempt_id: attemptId ? Number(attemptId) : null,
            });

            localStorage.removeItem(`listening-session-${testId}`);

            if (mode === "mock" && attemptId) {
                await pullMockSkillResultAPI(Number(attemptId), "LISTENING");
                toast.success("Listening yakunlandi");
                router.push(`/exams/process/${attemptId}?examId=${actualMockExamId}`);
            } else {
                toast.success("Test muvaffaqiyatli topshirildi!");
                saveLastResult("listening", response.data);
                router.push(`/exams/results/listening`);
            }

            setStatus("finished");
        } catch (err: any) {
            console.error("Listening submit error:", err);
            toast.error(err?.message || "Natijani saqlashda xatolik yuz berdi.");
            setIsSubmitting(false);
        }
    }, [testId, mode, attemptId, actualMockExamId, isSubmitting, router]);
    
    // Timer & Session Storage Logic (Reading'dagidek qisqartirildi)
    useEffect(() => {
        if (!hasStarted || status !== "reading") return;
        if (countdown <= 0) { setStatus("playing"); return; }
        const timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
        return () => clearInterval(timer);
    }, [hasStarted, status, countdown]);

    useEffect(() => {
        if (!testId || !hasStarted || status === "finished") return;
        localStorage.setItem(`listening-session-${testId}`, JSON.stringify({
            answers, answered, activePartIndex, status, audioCurrentTime, countdown
        }));
    }, [answers, answered, activePartIndex, status, audioCurrentTime, countdown, hasStarted, testId]);

    const handleAnswer = useCallback((questionId: string | number, value: string) => {
        const idStr = String(questionId);
        setAnswers(prev => ({ ...prev, [idStr]: value }));
        setAnswered(prev => ({ ...prev, [idStr]: !!value.trim() }));
        answersRef.current[idStr] = value;
    }, []);

    // ----------------------------------------------------
    // 3. RENDER LOGIC
    // ----------------------------------------------------
    if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600" /></div>;

    if (!hasStarted) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
                <div className="bg-white p-10 rounded-[40px] shadow-2xl text-center max-w-lg border-4 border-white animate-in zoom-in duration-300">
                    <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Play size={40} className="ml-1" />
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-800 mb-4 uppercase italic tracking-tight">{test?.title}</h1>
                    <p className="text-slate-500 mb-8 font-medium italic">listening bo&apos;limini boshlashga tayyormisiz?</p>
                    <button onClick={() => { setHasStarted(true); setStatus("reading"); setCountdown(10); }} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-lg uppercase shadow-xl hover:bg-blue-700 active:scale-95 transition-all">
                        Bo'limni boshlash
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen flex-col bg-white overflow-hidden relative select-none">
            <ExamHeader currentSection="listening" />
            <div className="flex flex-1 overflow-hidden">
                <main className="flex-1 overflow-hidden relative">
                    <ListeningExamContent
                        examData={test!}
                        currentQuestion={currentQuestion}
                        answers={answers}
                        status={status}
                        activePartIndex={activePartIndex}
                        fontSize={fontSize}
                        volume={volume}
                        onAnswer={handleAnswer}
                        onSelectQuestion={setCurrentQuestion}
                        onTimeUpdate={(c: number, d: number) => {
                            setAudioCurrentTime(c);
                            if (d > 0) setAudioProgress((c / d) * 100);
                        }}
                        onTransitionToEnding={() => setStatus("ending")}
                        onNextPart={() => {
                            if (activePartIndex < test!.parts.length - 1) {
                                setActivePartIndex(p => p + 1);
                                setStatus("reading");
                                setCountdown(10);
                                setAudioCurrentTime(0);
                            } else {
                                setIsFinishModalOpen(true);
                            }
                        }}
                        initialTime={audioCurrentTime}
                    />
                </main>
                <ListeningExamSidebar
                    currentQuestion={currentQuestion}
                    answered={answered}
                    timeLeft={status === "reading" ? `00:${String(countdown).padStart(2, '0')}` : formatTime(audioCurrentTime)}
                    progress={audioProgress}
                    status={status}
                    fontSize={fontSize}
                    volume={volume}
                    onVolumeChange={setVolume}
                    onSelectQuestion={setCurrentQuestion}
                    onFinish={() => setIsFinishModalOpen(true)}
                    onIncreaseFontSize={() => setFontSize(s => Math.min(s + 2, 30))}
                    onDecreaseFontSize={() => setFontSize(s => Math.max(s - 2, 12))}
                    activePartIndex={activePartIndex}
                />
            </div>

            {/* FINISH MODAL */}
            {isFinishModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[32px] p-8 max-w-md w-full text-center border-4 border-white">
                        <h2 className="text-2xl font-black mb-4 uppercase">Testni yakunlash</h2>
                        <div className="flex gap-4">
                            <button onClick={() => setIsFinishModalOpen(false)} className="flex-1 py-4 bg-slate-100 rounded-2xl font-black uppercase">Qaytish</button>
                            <button onClick={handleFinish} disabled={isSubmitting} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase flex items-center justify-center gap-2">
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Yakunlash"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export default function ListeningExamPage() {
    return <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>}><ExamLogic /></Suspense>
}
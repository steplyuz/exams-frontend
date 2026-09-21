"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import { CheckCircle2, Folder, Headphones } from "lucide-react"
import { ListeningExam, ListeningQuestion } from "@/lib/cefr-types/listening"
import { MatchingDropdown } from "./listening-question-renderer"

interface ListeningExamContentProps {
  examData: ListeningExam | null
  currentQuestion: number
  answers: Record<string, string>
  onAnswer: (questionId: string | number, value: string) => void
  onSelectQuestion: (qIndex: number) => void
  activePartIndex: number
  onSelectPart?: (index: number) => void
  status: "reading" | "playing" | "ending" | "finished"
  fontSize: number
  volume: number
  onNextPart: () => void
  onTransitionToEnding: () => void
  onTimeUpdate: (current: number, duration: number) => void
  initialTime: number

  // Admin controls (hozircha ishlatilmayapti, lekin props’da qoldirdim)
  isAdmin?: boolean
  onReorderParts?: (fromIndex: number, toIndex: number) => void
  onDeletePart?: (index: number) => void
  onEditPart?: (index: number) => void
}

export default function ListeningExamContent({
  examData,
  currentQuestion,
  answers,
  onAnswer,
  onSelectQuestion,
  activePartIndex,
  status,
  fontSize,
  volume,
  onNextPart,
  onTransitionToEnding,
  onTimeUpdate,
  initialTime,
  onSelectPart,
}: ListeningExamContentProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  // --- 1) PART DONE ---
  const isPartDone = useMemo(
    () => (partIdx: number) => {
      if (!examData?.parts?.[partIdx]) return false
      const partQuestions = examData.parts[partIdx].questions || []
      return partQuestions.every((q) => {
        const v = answers[String(q.id)]
        return v && v.trim() !== ""
      })
    },
    [examData, answers]
  )

  // --- 2) VOLUME ---
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = (volume ?? 80) / 100
  }, [volume])

  // --- 3) AUDIO PLAYBACK ---
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !examData?.parts?.[activePartIndex]) return

    const currentPart = examData.parts[activePartIndex]
    let targetSrc = ""

    if (status === "playing") {
      targetSrc = currentPart.audioLabel || ""
    } else if (status === "ending") {
      const pNum = currentPart.partNumber || activePartIndex + 1
      targetSrc = `/audios/this_is_the_end_part_${pNum}.mp3`
    }

    const playAudio = async () => {
      if (!targetSrc) {
        audio.pause()
        setIsPlaying(false)
        return
      }

      const currentSrc = audio.getAttribute("src")
      if (currentSrc !== targetSrc) {
        audio.src = targetSrc
        audio.load()
        if (status === "playing" && initialTime > 0) {
          audio.currentTime = initialTime
        }
      }

      try {
        await audio.play()
        setIsPlaying(true)
      } catch (e) {
        console.error("Audio error:", e)
        if (status === "ending") onNextPart()
        else if (status === "playing") onTransitionToEnding()
      }
    }

    playAudio()

    return () => {
      audio.pause()
      setIsPlaying(false)
    }
  }, [status, activePartIndex, examData, initialTime, onNextPart, onTransitionToEnding])

  // --- 4) GAP FILL PASSAGE ---
  const renderGapFillPassage = (text: string, questions: ListeningQuestion[]) => {
    if (!text) return null
    const parts = text.split(/_{3,}|__________/g)

    return (
      <div
        className="leading-[2.8] text-justify text-slate-800 bg-white p-5 md:p-10 rounded-xl border border-slate-200 shadow-sm mb-10 min-w-0"
        style={{ fontSize: `${fontSize}px` }}
      >
        {parts.map((part, i) => {
          const q = questions[i]
          const qId = q ? String(q.id) : null
          const qNum = q ? Number(q.questionNumber) : null

          return (
            <span key={i} className="inline min-w-0">
              <span
                className="break-words"
                style={{ overflowWrap: "anywhere" }}
                dangerouslySetInnerHTML={{ __html: part }}
              />
              {i < parts.length - 1 && qId && (
                <input
                  type="text"
                  value={answers[qId] || ""}
                  onChange={(e) => onAnswer(qId, e.target.value)}
                  onFocus={() => qNum && onSelectQuestion(qNum)}
                  className={`w-24 md:w-32 h-9 mx-1 px-2 border-b-2 outline-none text-center font-bold text-blue-700 bg-blue-50 border-blue-400 rounded-t-lg transition-all 
                    ${currentQuestion === qNum ? "ring-2 ring-blue-500 bg-white shadow-md" : ""}`}
                  placeholder={`(${qNum})`}
                />
              )}
            </span>
          )
        })}
      </div>
    )
  }

  if (!examData?.parts?.length) return null

  const currentPart = examData.parts[activePartIndex]
  if (!currentPart) return <div className="p-10 text-center">Part not found</div>

  const isFullWidthPassage =
    currentPart.taskType === "GAP_FILL" || (!!currentPart.passage && currentPart.passage.length > 0)
  const isMapLayout = currentPart.taskType === "MAP_DIAGRAM" || !!currentPart.mapImage

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] overflow-x-hidden min-w-0">
      {/* PART TABS */}
      <div className="h-16 bg-white border-b flex items-center shrink-0 z-20 overflow-x-auto no-scrollbar px-4 shadow-sm min-w-0">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl mx-auto border border-slate-200/50 min-w-max">
          {examData.parts.map((_, idx) => {
            const done = isPartDone(idx)
            const active = activePartIndex === idx

            return (
              <button
                key={idx}
                onClick={() => {
                  onSelectPart?.(idx)
                  const firstQ = examData.parts[idx]?.questions?.[0]
                  if (firstQ) onSelectQuestion(Number(firstQ.questionNumber))
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black transition-all duration-300 whitespace-nowrap
                  ${
                    active
                      ? "bg-blue-600 text-white shadow-lg scale-105"
                      : done
                      ? "bg-emerald-500 text-white"
                      : "text-slate-400 hover:bg-slate-200"
                  }`}
              >
                {done && !active ? <CheckCircle2 size={14} /> : <Folder size={14} />}
                <span>{idx + 1}</span>
              </button>
            )
          })}
        </div>
      </div>

      <audio
        ref={audioRef}
        onTimeUpdate={(e) =>
          status === "playing" && onTimeUpdate(e.currentTarget.currentTime, e.currentTarget.duration)
        }
        onEnded={() => {
          if (status === "playing") onTransitionToEnding()
          else if (status === "ending") onNextPart()
        }}
      />

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 bg-[#F1F5F9]/50 flex flex-col md:flex-row gap-6 relative min-w-0">
        {/* MAP IMAGE */}
        {isMapLayout && currentPart.mapImage && (
          <div className="w-full md:w-1/2 shrink-0 min-w-0 h-auto bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden md:sticky md:top-0 self-start">
            <div className="p-3 md:p-4 flex flex-col items-center min-w-0">
              <span className="self-start text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                <Headphones size={12} /> Reference Image
              </span>
              <img
                src={currentPart.mapImage}
                alt="Exam Visual"
                className="w-full h-auto max-h-[60vh] md:max-h-[75vh] object-contain rounded-lg"
                loading="eager"
                decoding="async"
              />
            </div>
          </div>
        )}

        {/* QUESTIONS SECTION */}
        <div
          className={`flex-1 w-full max-w-4xl mx-auto pb-32 md:pb-10 min-w-0 ${
            isMapLayout ? "md:w-1/2" : "w-full"
          }`}
        >
          <div className="mb-6 min-w-0">
            <h2 className="text-xl md:text-2xl font-black text-slate-800 uppercase italic break-words">
              Part {activePartIndex + 1}: {currentPart.title}
            </h2>
            <div className="h-1 w-16 bg-blue-600 rounded-full my-2"></div>
            <p className="text-slate-500 text-sm italic break-words" style={{ overflowWrap: "anywhere" }}>
              {currentPart.instruction}
            </p>
          </div>

          <div
            className={`grid gap-6 items-start min-w-0 ${
              isFullWidthPassage || isMapLayout ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"
            }`}
          >
            {isFullWidthPassage ? (
              renderGapFillPassage(currentPart.passage || "", currentPart.questions)
            ) : (
              currentPart.questions.map((q) => {
                const qId = String(q.id)
                const qNum = Number(q.questionNumber)
                const isActive = currentQuestion === qNum

                // MATCHING
                if (q.type === "MATCHING") {
                  return (
                    <MatchingDropdown
                      key={qId}
                      q={q}
                      qId={qId}
                      answer={answers[qId]}
                      onAnswer={onAnswer}
                      onSelect={onSelectQuestion}
                      isActive={isActive}
                    />
                  )
                }

                const hasOptions = q.type === "MULTIPLE_CHOICE" && q.options && q.options.length > 0

                return (
                  <div
                    key={qId}
                    id={`q-${qNum}`}
                    onClick={() => onSelectQuestion(qNum)}
                    className={`p-4 md:p-6 rounded-2xl border-2 transition-all bg-white cursor-pointer min-w-0
                      ${
                        isActive
                          ? "border-blue-500 ring-4 ring-blue-500/5 shadow-md"
                          : "border-transparent hover:border-slate-200"
                      }`}
                  >
                    <div className="flex gap-4 min-w-0">
                      <span
                        className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-black
                          ${isActive ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"}`}
                      >
                        {qNum}
                      </span>

                      <div className="flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                        {q.question && (
                          <p
                            className="font-bold text-slate-800 mb-4 text-sm md:text-base break-words min-w-0"
                            style={{ overflowWrap: "anywhere" }}
                            dangerouslySetInnerHTML={{ __html: q.question }}
                          />
                        )}

                        {hasOptions ? (
                          <div className="space-y-2 min-w-0">
                            {q.options?.map((opt) => (
                              <label
                                key={opt.value}
                                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all min-w-0
                                  ${
                                    answers[qId] === opt.value
                                      ? "bg-blue-50 border-blue-500"
                                      : "border-slate-100 hover:bg-slate-50"
                                  }`}
                              >
                                <input
                                  type="radio"
                                  checked={answers[qId] === opt.value}
                                  onChange={() => onAnswer(qId, opt.value)}
                                  className="hidden"
                                />
                                <div
                                  className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0
                                    ${
                                      answers[qId] === opt.value
                                        ? "border-blue-600 bg-blue-600"
                                        : "border-slate-300"
                                    }`}
                                >
                                  {answers[qId] === opt.value && (
                                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                  )}
                                </div>
                                <span
                                  className="text-sm font-bold text-slate-700 break-words min-w-0"
                                  style={{ overflowWrap: "anywhere" }}
                                >
                                  <span className="text-blue-600 mr-2">{opt.value})</span>
                                  {opt.label}
                                </span>
                              </label>
                            ))}
                          </div>
                        ) : (
                          <input
                            type="text"
                            value={answers[qId] || ""}
                            onChange={(e) => onAnswer(qId, e.target.value)}
                            placeholder="Your answer..."
                            className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-blue-500 font-bold min-w-0"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
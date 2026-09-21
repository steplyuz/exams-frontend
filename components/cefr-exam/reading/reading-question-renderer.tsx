"use client"

import { useState, useRef, useEffect, useLayoutEffect } from "react"
import { createPortal } from "react-dom"
import { ChevronDown, Check, X } from "lucide-react"
import type { Question } from "@/lib/cefr-types/reading"

interface QuestionRendererProps {
    question: Question
    answer: string
    onAnswer: (value: string) => void
    onInputChange: (value: string) => void
    fontSize?: number
}

// ----------------------------------------------------------------------
// 1. TRUE/FALSE/NOT GIVEN (Grid Layout)
// ----------------------------------------------------------------------
export function TrueFalseNotGivenRenderer({
    answer,
    onAnswer,
    fontSize = 13
}: {
    answer: string
    onAnswer: (value: string) => void
    fontSize?: number
}) {
    const options = [
        { label: "TRUE", value: "A" },
        { label: "FALSE", value: "B" },
        { label: "NOT GIVEN", value: "C" }
    ]

    return (
        <div className="grid grid-cols-3 gap-1.5 w-full">
            {options.map((option) => {
                const isActive = answer === option.value;
                return (
                    <button
                        key={option.value}
                        onClick={() => onAnswer(option.value)}
                        className={`px-1 py-1.5 rounded-md border text-[10px] sm:text-xs font-bold transition-all duration-200 shadow-sm truncate
                            ${isActive
                                ? "bg-blue-600 border-blue-600 text-white"
                                : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                            }`}
                        style={{ fontSize: `${Math.min(fontSize - 2, 12)}px` }}
                        title={option.label}
                    >
                        {option.label}
                    </button>
                )
            })}
        </div>
    )
}

// ----------------------------------------------------------------------
// 2. MULTIPLE CHOICE (Grid Layout + Overflow Safe)
// ----------------------------------------------------------------------
export function MultipleChoiceRenderer({
    question,
    answer,
    onAnswer,
    fontSize = 13
}: {
    question: Question
    answer: string
    onAnswer: (value: string) => void
    fontSize?: number
}) {
    return (
        <div className="space-y-1.5 w-full max-w-full">
            {question.options?.map((option) => {
                const isSelected = answer === option.label;
                return (
                    <button
                        key={option.value}
                        onClick={() => onAnswer(option.label)}
                        className={`w-full grid grid-cols-[auto_1fr] gap-2.5 p-2 rounded-lg border transition-all duration-200 text-left group
                            ${isSelected
                                ? "bg-blue-50 border-blue-400/50 shadow-sm"
                                : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                            }`}
                    >
                        {/* Harf */}
                        <div 
                            className={`w-5 h-5 flex items-center justify-center rounded text-[10px] font-bold border transition-colors mt-0.5
                            ${isSelected
                                ? "bg-blue-600 border-blue-600 text-white"
                                : "bg-slate-50 border-slate-200 text-slate-400 group-hover:border-slate-300"
                            }`}
                        >
                            {option.value}
                        </div>

                        {/* Matn */}
                        <div className="min-w-0 overflow-hidden">
                            <span 
                                className={`block break-words leading-tight ${isSelected ? "text-blue-900 font-semibold" : "text-slate-600 font-medium"}`}
                                style={{ fontSize: `${Math.min(fontSize, 14)}px` }}
                            >
                                {option.label}
                            </span>
                        </div>
                    </button>
                )
            })}
        </div>
    )
}

// ----------------------------------------------------------------------
// 3. GAP FILL INPUT
// ----------------------------------------------------------------------
export function GapFillFillRenderer({
    answer,
    onInputChange,
    fontSize = 13
}: {
    answer: string
    onInputChange: (value: string) => void
    fontSize?: number
}) {
    return (
        <div className="w-full max-w-full">
            <input
                type="text"
                placeholder="Type answer..."
                value={answer || ""}
                onChange={(e) => onInputChange(e.target.value)}
                onClick={(e) => e.stopPropagation()} 
                className="w-full min-w-0 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 font-medium text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-slate-400 shadow-sm"
                style={{ fontSize: `${Math.min(fontSize, 14)}px` }}
            />
        </div>
    )
}

// ----------------------------------------------------------------------
// 4. SELECT MATCHING (Scroll-Proof & Grid)
// ----------------------------------------------------------------------
export function SelectRenderer({
    question,
    answer,
    onAnswer,
    fontSize = 13,
    placeholder = "Select..."
}: {
    question: Question
    answer: string
    onAnswer: (value: string) => void
    fontSize?: number
    placeholder?: string
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
    const buttonRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const selectedOption = question.options?.find(opt => opt.value === answer);

    // Pozitsiyani yangilash (Scroll qilganda ham chaqiriladi)
    const updatePosition = () => {
        if (!buttonRef.current || !isOpen) return;
        
        const rect = buttonRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        const spaceBelow = viewportHeight - rect.bottom;
        
        const menuHeight = Math.min((question.options?.length || 0) * 40 + 40, 300);
        const opensUpwards = spaceBelow < menuHeight + 10;
        const maxWidth = viewportWidth - 20;

        setMenuStyle({
            position: "fixed",
            left: `${rect.left}px`,
            width: `${rect.width}px`, 
            maxWidth: `${maxWidth}px`,
            // Scroll qilganda menyu qotib qolmasligi uchun doimiy yangilanadi
            top: opensUpwards ? "auto" : `${rect.bottom + 4}px`,
            bottom: opensUpwards ? `${viewportHeight - rect.top + 4}px` : "auto",
            zIndex: 99999,
        });
    };

    // Scroll va Resize hodisalarini kuzatish
    useLayoutEffect(() => {
        if (isOpen) {
            updatePosition();
            // capture: true muhim, chunki scroll hodisasi bubling qilmaydi
            window.addEventListener("scroll", updatePosition, { capture: true });
            window.addEventListener("resize", updatePosition);
        }
        return () => {
            window.removeEventListener("scroll", updatePosition, { capture: true });
            window.removeEventListener("resize", updatePosition);
        };
    }, [isOpen]);

    // Tashqariga bosganda yopish
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            // Agar menyu ichiga yoki tugma ichiga bosilmagan bo'lsa
            if (
                menuRef.current && !menuRef.current.contains(event.target as Node) &&
                buttonRef.current && !buttonRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        }
        if (isOpen) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    // Portal Menyu
    const DropdownMenu = (
        <div 
            ref={menuRef}
            className="flex flex-col bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100"
            style={{ ...menuStyle, maxHeight: "300px" }}
        >
            {/* Clear Button */}
            {answer && (
                <div className="flex justify-end px-2 py-1.5 border-b border-slate-50 bg-slate-50/50">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onAnswer(""); setIsOpen(false); }}
                        className="text-[10px] flex items-center gap-1 text-red-500 hover:text-red-600 font-semibold px-2 py-0.5 rounded hover:bg-red-50 transition-colors"
                    >
                        <X size={10} /> Clear
                    </button>
                </div>
            )}

            {/* Options */}
            <div className="overflow-y-auto p-1 space-y-0.5 custom-scrollbar">
                {question.options?.map((option, idx) => {
                    const isSelected = answer === option.value;
                    return (
                        <div
                            key={idx}
                            onClick={() => { onAnswer(option.value); setIsOpen(false); }}
                            // Grid Layout (Xuddi Multiple Choice kabi)
                            className={`grid grid-cols-[auto_1fr] gap-2.5 px-2.5 py-2 rounded-md cursor-pointer transition-colors border
                                ${isSelected 
                                    ? "bg-blue-50 border-blue-100" 
                                    : "border-transparent hover:bg-slate-50"
                                }`}
                        >
                            {/* Checkbox/Badge */}
                            <div className={`mt-0.5 w-4 h-4 flex items-center justify-center rounded text-[9px] font-bold border transition-colors
                                ${isSelected ? "bg-blue-600 text-white border-blue-600" : "bg-slate-50 text-slate-400 border-slate-200"}`}>
                                {isSelected ? <Check size={10} strokeWidth={3} /> : option.value}
                            </div>

                            {/* Matn */}
                            <div className="min-w-0">
                                <span 
                                    className={`block text-xs sm:text-sm leading-tight break-words ${isSelected ? "text-slate-800 font-bold" : "text-slate-600 font-medium"}`}
                                    style={{ fontSize: `${Math.min(fontSize - 1, 13)}px` }}
                                >
                                    {option.label}
                                </span>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );

    return (
        <>
            <div className="relative w-full max-w-full">
                <button
                    ref={buttonRef}
                    onClick={() => setIsOpen(!isOpen)}
                    // Grid Layout (Tugma uchun)
                    className={`w-full grid grid-cols-[1fr_auto] items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 text-left bg-white
                        ${isOpen 
                            ? "border-blue-400 ring-2 ring-blue-500/10 shadow-sm" 
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                >
                    <div className="min-w-0 overflow-hidden">
                        {selectedOption ? (
                            <div className="flex items-center gap-2">
                                <span className="shrink-0 flex h-4 w-4 items-center justify-center rounded bg-blue-100 text-blue-700 text-[9px] font-bold">
                                    {selectedOption.value}
                                </span>
                                {/* Truncate (Tugma ichida sig'magan matn kesiladi) */}
                                <span 
                                    className="block truncate font-semibold text-slate-800"
                                    style={{ fontSize: `${Math.min(fontSize, 14)}px` }}
                                    title={selectedOption.label} 
                                >
                                    {selectedOption.label}
                                </span>
                            </div>
                        ) : (
                            <span className="text-slate-400 text-xs sm:text-sm font-medium block truncate">{placeholder}</span>
                        )}
                    </div>
                    
                    <ChevronDown 
                        size={14} 
                        className={`text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180 text-blue-500" : ""}`} 
                    />
                </button>
            </div>
            
            {/* Portal Body ga ulanadi (Z-index muammosi bo'lmaydi) */}
            {isOpen && typeof document !== 'undefined' && createPortal(DropdownMenu, document.body)}
        </>
    )
}

// ----------------------------------------------------------------------
// ASOSIY RENDER
// ----------------------------------------------------------------------
export default function QuestionRenderer({
    question,
    answer = "",
    onAnswer,
    onInputChange,
    fontSize = 14
}: QuestionRendererProps) {

    if (!question) return null;

    const commonProps = { question, answer, onAnswer, onInputChange, fontSize }

    switch (question.type) {
        case "TRUE_FALSE_NOT_GIVEN":
            return <TrueFalseNotGivenRenderer {...commonProps} />

        case "MULTIPLE_CHOICE":
            return <MultipleChoiceRenderer {...commonProps} />

        case "GAP_FILL_FILL":
            return <GapFillFillRenderer {...commonProps} />

        case "TEXT_MATCH":
            return <SelectRenderer {...commonProps} placeholder="Select Paragraph..." />

        case "HEADINGS_MATCH":
            return <SelectRenderer {...commonProps} placeholder="Select Heading..." />

        case "GAP_FILL":
            return null

        default:
            return (
                <div className="p-2 bg-red-50 border border-red-200 rounded text-[10px] text-red-600 font-medium">
                    Unsupported: {question.type}
                </div>
            )
    }
}
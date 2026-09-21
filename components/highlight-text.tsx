"use client"

import { useCallback, useRef } from "react"

export interface TextHighlight {
  id: string
  start: number
  end: number
  color: string
}

interface HighlightTextProps {
  text: string
  highlights: TextHighlight[]
  onAddHighlight: (highlight: TextHighlight) => void
  onRemoveHighlight: (id: string) => void
  offset?: number
  activeColor?: string
}

/**
 * Renders a chunk of passage text and lets the candidate drag-select part of
 * it to highlight it in `activeColor`. Clicking an existing highlight removes
 * it. Offsets are tracked against the *segment's* own text so callers can
 * stitch multiple segments (e.g. around gap-fill inputs) into one passage.
 */
export default function HighlightText({
  text,
  highlights,
  onAddHighlight,
  onRemoveHighlight,
  offset = 0,
  activeColor = "#fef08a",
}: HighlightTextProps) {
  const ref = useRef<HTMLSpanElement>(null)

  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed || !ref.current) return

    const range = selection.getRangeAt(0)
    if (!ref.current.contains(range.commonAncestorContainer)) return

    const preRange = document.createRange()
    preRange.selectNodeContents(ref.current)
    preRange.setEnd(range.startContainer, range.startOffset)
    const start = preRange.toString().length
    const length = range.toString().length
    if (length === 0) return

    onAddHighlight({
      id: `hl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      start: start + offset,
      end: start + length + offset,
      color: activeColor,
    })
    selection.removeAllRanges()
  }, [offset, activeColor, onAddHighlight])

  const relevant = highlights
    .map((h) => ({ ...h, start: h.start - offset, end: h.end - offset }))
    .filter((h) => h.end > 0 && h.start < text.length)
    .sort((a, b) => a.start - b.start)

  const nodes: React.ReactNode[] = []
  let cursor = 0
  relevant.forEach((h) => {
    const start = Math.max(0, h.start)
    const end = Math.min(text.length, h.end)
    if (end <= start) return
    if (start > cursor) nodes.push(text.slice(cursor, start))
    nodes.push(
      <mark
        key={h.id}
        style={{ backgroundColor: h.color }}
        className="cursor-pointer rounded-[3px] px-0.5"
        title="Belgilashni olib tashlash uchun bosing"
        onClick={(e) => {
          e.stopPropagation()
          onRemoveHighlight(h.id)
        }}
      >
        {text.slice(start, end)}
      </mark>
    )
    cursor = end
  })
  if (cursor < text.length) nodes.push(text.slice(cursor))

  return (
    <span ref={ref} onMouseUp={handleMouseUp}>
      {nodes.length > 0 ? nodes : text}
    </span>
  )
}

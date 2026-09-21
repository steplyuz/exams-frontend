'use client'

import React, { useEffect, useRef } from 'react'

type EssayInputProps = {
  value: string
  onChange: (next: string) => void
  placeholder?: string
  fontSize?: number
  className?: string
  onFocus?: () => void
  onBlur?: () => void
}

export default function EssayInput({
  value,
  onChange,
  placeholder = '',
  fontSize = 18,
  className,
  onFocus,
  onBlur,
}: EssayInputProps) {
  const ref = useRef<HTMLDivElement>(null)
  const lastValue = useRef<string>(value)

  // Sync external value -> DOM (avoid cursor jump if same)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (lastValue.current === value) return
    el.innerText = value
    lastValue.current = value
  }, [value])

  const stopAll = (e: any) => {
    e.stopPropagation?.()
    // React synthetic -> native
    e.nativeEvent?.stopImmediatePropagation?.()
  }

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-multiline="true"
      spellCheck
      style={{ fontSize }}
      className={
        className ??
        'w-full h-full outline-none leading-relaxed text-gray-700 whitespace-pre-wrap break-words'
      }
      data-placeholder={placeholder}
      // ===== CAPTURE PHASE: global hotkeylarni 100% o'ldiradi =====
      onKeyDownCapture={stopAll}
      onKeyUpCapture={stopAll}
      onKeyPressCapture={stopAll}
      onPointerDownCapture={stopAll}
      onFocusCapture={(e) => {
        stopAll(e)
        onFocus?.()
      }}
      onBlurCapture={(e) => {
        stopAll(e)
        onBlur?.()
      }}
      // input event: update value
      onInput={() => {
        const next = ref.current?.innerText ?? ''
        lastValue.current = next
        onChange(next)
      }}
    />
  )
}
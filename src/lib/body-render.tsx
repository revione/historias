'use client'

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useSpeech } from './speech-context'

type WordSpan = { off: number; len: number; sent: number }

function stripInline(s: string): string {
  return s
    .replace(/\*\*\*(.+?)\*\*\*/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/\b_(.+?)_\b/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[(.+?)\]\((.+?)\)/g, '$1')
}

function sentenceIndexAt(starts: number[], off: number): number {
  // largest i such that starts[i] <= off
  let lo = 0, hi = starts.length - 1, ans = 0
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (starts[mid] <= off) { ans = mid; lo = mid + 1 } else { hi = mid - 1 }
  }
  return ans
}

type BuildCtx = {
  plain: string
  baseOffset: number
  sentenceStarts: number[]
  wordClass: string
}

function wordSpans(text: string, ctx: BuildCtx, keyPrefix: string): React.ReactNode[] {
  const parts = text.split(/(\s+)/)
  const out: React.ReactNode[] = []
  let i = 0
  for (const part of parts) {
    if (!part) continue
    if (/^\s+$/.test(part)) {
      out.push(part)
      ctx.plain += part
    } else {
      const off = ctx.baseOffset + ctx.plain.length
      const sent = sentenceIndexAt(ctx.sentenceStarts, off)
      out.push(
        <span key={`${keyPrefix}-${i++}`} data-off={off} data-len={part.length} data-sent={sent} className={ctx.wordClass}>
          {part}
        </span>,
      )
      ctx.plain += part
    }
  }
  return out
}

export type BuildBodyResult = {
  elems: React.ReactNode[]
  plain: string
}

// Returns the rendered body (with each word wrapped in a span) and the plain
// text representation that is fed to the speech synthesis engine. Offsets in
// the spans are absolute positions inside the full spoken text (which starts
// with the title), so they can be matched against the live char index.
export function buildBody(
  md: string,
  baseOffset: number,
  sentenceStarts: number[],
  wordClass: string,
): BuildBodyResult {
  const ctx: BuildCtx = { plain: '', baseOffset, sentenceStarts, wordClass }
  const blocks = md.split(/\n\n+/)
  const elems: React.ReactNode[] = []
  let firstEmitted = false

  blocks.forEach((b, bi) => {
    const trimmed = b.trim()
    if (!trimmed) return

    // Table detection (kept inline for rendering; no spoken text emitted)
    const lines = trimmed.split('\n')
    const isTable =
      lines.length >= 2 &&
      lines[0].includes('|') &&
      /^\|?[\s\-|]+\|?$/.test(lines[1])

    if (isTable) {
      const headers = lines[0].split('|').map(c => c.trim()).filter(Boolean)
      const rows = lines.slice(2).map(l => l.split('|').map(c => c.trim()).filter(Boolean))
      elems.push(
        <table key={`b${bi}`}>
          <thead><tr>{headers.map((h, hi) => <th key={hi}>{stripInline(h)}</th>)}</tr></thead>
          <tbody>
            {rows.map((r, ri) => (
              <tr key={ri}>{r.map((c, ci) => <td key={ci}>{stripInline(c)}</td>)}</tr>
            ))}
          </tbody>
        </table>,
      )
      return
    }

    if (firstEmitted) ctx.plain += '\n\n'
    firstEmitted = true

    if (trimmed.startsWith('# ')) {
      const text = stripInline(trimmed.slice(2))
      elems.push(<h1 key={`b${bi}`}>{wordSpans(text, ctx, `h1-${bi}`)}</h1>)
    } else if (trimmed.startsWith('## ')) {
      const text = stripInline(trimmed.slice(3))
      elems.push(<h2 key={`b${bi}`}>{wordSpans(text, ctx, `h2-${bi}`)}</h2>)
    } else if (trimmed.startsWith('### ')) {
      const text = stripInline(trimmed.slice(4))
      elems.push(<h3 key={`b${bi}`}>{wordSpans(text, ctx, `h3-${bi}`)}</h3>)
    } else if (trimmed.startsWith('---')) {
      elems.push(<hr key={`b${bi}`} />)
      // Roll back the '\n\n' separator: <hr /> emits nothing spoken
      ctx.plain = ctx.plain.slice(0, -2)
      firstEmitted = ctx.plain.length > 0
    } else if (lines.every(l => /^\d+\.\s/.test(l.trimStart()))) {
      const items = lines.map(l => stripInline(l.replace(/^\s*\d+\.\s*/, '')))
      const liNodes: React.ReactNode[] = []
      items.forEach((it, i) => {
        const nodes = wordSpans(it, ctx, `ol-${bi}-${i}`)
        liNodes.push(<li key={i}>{nodes}</li>)
        if (i < items.length - 1) ctx.plain += '\n'
      })
      elems.push(<ol key={`b${bi}`}>{liNodes}</ol>)
    } else if (lines.every(l => l.trimStart().startsWith('- '))) {
      const items = lines.map(l => stripInline(l.replace(/^\s*-\s*/, '')))
      const liNodes: React.ReactNode[] = []
      items.forEach((it, i) => {
        const nodes = wordSpans(it, ctx, `ul-${bi}-${i}`)
        liNodes.push(<li key={i}>{nodes}</li>)
        if (i < items.length - 1) ctx.plain += '\n'
      })
      elems.push(<ul key={`b${bi}`}>{liNodes}</ul>)
    } else {
      const text = stripInline(trimmed.replace(/\n/g, ' '))
      elems.push(<p key={`b${bi}`}>{wordSpans(text, ctx, `p-${bi}`)}</p>)
    }
  })

  return { elems, plain: ctx.plain }
}

// Compute absolute sentence start positions inside the given fullText, mirroring
// the chunker used by speech-context.
export function computeSentenceStarts(text: string): number[] {
  const re = /(?<=[.!?¿¡])\s+/g
  const starts: number[] = []
  let pos = 0
  while (pos < text.length && /\s/.test(text[pos])) pos++
  if (pos < text.length) starts.push(pos)
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    const next = m.index + m[0].length
    if (next < text.length) starts.push(next)
  }
  return starts
}

type HighlightedBodyProps = {
  body: string
  title: string
  className?: string
  wordClass: string
  wordActiveClass: string
  sentActiveClass: string
  onPlainText?: (plain: string) => void
  scrollBtnClass?: string
  scrollBtnLabel?: string
}

// Renders the body with per-word spans and imperatively toggles highlight
// classes in response to speech progress. No re-renders on each tick.
export function HighlightedBody({
  body,
  title,
  className,
  wordClass,
  wordActiveClass,
  sentActiveClass,
  onPlainText,
  scrollBtnClass,
  scrollBtnLabel = '↓',
}: HighlightedBodyProps) {
  const { liveCharIndexRef, liveSentenceIndexRef, state, seekTo } = useSpeech()
  const containerRef = useRef<HTMLDivElement>(null)
  const wordsRef = useRef<{ el: HTMLSpanElement; off: number; len: number; sent: number }[]>([])
  const activeWordRef = useRef<HTMLSpanElement | null>(null)
  const activeSentRef = useRef<number>(-1)
  const offscreenRef = useRef(false)
  const [showScrollBtn, setShowScrollBtn] = useState(false)

  const { elems, plainBody, fullText } = useMemo(() => {
    const titleText = title ? `${title}.` : ''
    const head = titleText ? `${titleText}\n\n` : ''
    // First pass: compute sentence starts using a tentative fullText. We need
    // to know sentence boundaries before we can tag each word with data-sent.
    // The body's plain content is deterministic from the renderer, so we
    // bootstrap by running the builder once with an empty starts array (only
    // affects data-sent), then recompute the real starts from the resulting
    // fullText. This is good enough because data-sent is recomputed on render
    // and not depended on by the speech engine itself.
    const tentative = buildBody(body, head.length, [], wordClass)
    const ft = head + tentative.plain
    const starts = computeSentenceStarts(ft)
    const final = buildBody(body, head.length, starts, wordClass)
    return { elems: final.elems, plainBody: final.plain, fullText: head + final.plain }
  }, [body, title, wordClass])

  // Notify parent of plain text so it can be passed to speak(). Only fires
  // when the computed text changes.
  useEffect(() => {
    onPlainText?.(plainBody)
  }, [plainBody, onPlainText])

  // Index word spans whenever the body re-renders.
  useEffect(() => {
    const el = containerRef.current
    if (!el) { wordsRef.current = []; return }
    const nodes = Array.from(el.querySelectorAll<HTMLSpanElement>(`.${wordClass}`))
    wordsRef.current = nodes.map(n => ({
      el: n,
      off: Number(n.dataset.off),
      len: Number(n.dataset.len),
      sent: Number(n.dataset.sent),
    }))
    // Reset any leftover state from a previous render.
    activeWordRef.current = null
    activeSentRef.current = -1
  }, [elems, wordClass])

  // rAF loop while speech is playing: update word + sentence highlight by
  // reading the live refs. Avoids re-rendering the whole body on each tick.
  useEffect(() => {
    if (!state.playing) {
      // Clear any highlight when speech stops.
      if (activeWordRef.current) {
        activeWordRef.current.classList.remove(wordActiveClass)
        activeWordRef.current = null
      }
      if (activeSentRef.current >= 0) {
        wordsRef.current.forEach(w => {
          if (w.sent === activeSentRef.current) w.el.classList.remove(sentActiveClass)
        })
        activeSentRef.current = -1
      }
      if (offscreenRef.current) {
        offscreenRef.current = false
        setShowScrollBtn(false)
      }
      return
    }

    let raf = 0
    const tick = () => {
      const ci = liveCharIndexRef.current
      const si = liveSentenceIndexRef.current
      const words = wordsRef.current

      // Sentence highlight
      if (si !== activeSentRef.current) {
        if (activeSentRef.current >= 0) {
          words.forEach(w => { if (w.sent === activeSentRef.current) w.el.classList.remove(sentActiveClass) })
        }
        if (si >= 0) {
          words.forEach(w => { if (w.sent === si) w.el.classList.add(sentActiveClass) })
        }
        activeSentRef.current = si
      }

      // Word highlight: binary search by offset
      if (words.length > 0) {
        let lo = 0, hi = words.length - 1, found: typeof words[0] | null = null
        while (lo <= hi) {
          const mid = (lo + hi) >> 1
          const w = words[mid]
          if (ci < w.off) hi = mid - 1
          else if (ci >= w.off + w.len) lo = mid + 1
          else { found = w; break }
        }
        const target = found ? found.el : null
        if (target !== activeWordRef.current) {
          if (activeWordRef.current) activeWordRef.current.classList.remove(wordActiveClass)
          if (target) target.classList.add(wordActiveClass)
          activeWordRef.current = target
        }
      }

      // Offscreen check for active word — drives scroll-to-active button.
      const active = activeWordRef.current
      if (active) {
        const r = active.getBoundingClientRect()
        const vh = window.innerHeight || document.documentElement.clientHeight
        const off = r.bottom < 0 || r.top > vh
        if (off !== offscreenRef.current) {
          offscreenRef.current = off
          setShowScrollBtn(off)
        }
      } else if (offscreenRef.current) {
        offscreenRef.current = false
        setShowScrollBtn(false)
      }

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [state.playing, wordActiveClass, sentActiveClass, liveCharIndexRef, liveSentenceIndexRef])

  // Click on a word: seek the speech engine to that position.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onClick = (e: MouseEvent) => {
      const span = (e.target as HTMLElement).closest(`.${wordClass}`) as HTMLSpanElement | null
      if (!span) return
      const off = Number(span.dataset.off)
      if (!Number.isFinite(off)) return
      const total = fullText.length
      if (total > 0) seekTo(off / total)
    }
    el.addEventListener('click', onClick)
    return () => el.removeEventListener('click', onClick)
  }, [wordClass, fullText, seekTo])

  const scrollToActive = useCallback(() => {
    const el = activeWordRef.current
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [])

  return (
    <>
      <div ref={containerRef} className={className}>{elems}</div>
      {showScrollBtn && (
        <button
          type="button"
          className={scrollBtnClass}
          onClick={scrollToActive}
          aria-label="scroll to current word"
        >
          {scrollBtnLabel}
        </button>
      )}
    </>
  )
}

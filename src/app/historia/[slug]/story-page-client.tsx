'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/lib/language-context'
import { useSpeech, type SpeechLang } from '@/lib/speech-context'
import { HighlightedBody } from '@/lib/body-render'
import { getStories } from '@/app/actions'
import type { Story, Lang, Section } from '@/lib/stories'
import styles from './story-page.module.css'

const LANGS: Lang[] = ['es', 'de', 'en']

const MIN_W = 560
const MAX_W = 1200
const DEFAULT_W = 720
const STORAGE_KEY = 'story-width'

const BACK: Record<Lang, string> = { es: '← volver', de: '← zurück', en: '← back' }
const PLAY: Record<Lang, string> = { es: 'escuchar', de: 'anhören', en: 'listen' }
const STOP_LABEL: Record<Lang, string> = { es: 'detener', de: 'stoppen', en: 'stop' }
const DESC: Record<Lang, string> = { es: 'descripción', de: 'Beschreibung', en: 'description' }

function tagLabel(tag: string) { return tag.replace(/-/g, ' ') }

function formatDate(d: string, lang: Lang) {
  const locale = lang === 'es' ? 'es-ES' : lang === 'de' ? 'de-DE' : 'en-US'
  if (!d) return '—'
  try { return new Date(d).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }) }
  catch { return d }
}

export function StoryPageClient({ id, initialStory, initialSection }: { id: string; initialStory: Story; initialSection: Section }) {
  const router = useRouter()
  const { lang, setLang } = useLanguage()
  const { speak, stop, state: speechState } = useSpeech()
  const [story, setStory] = useState<Story>(initialStory)
  const bodyPlainRef = useRef('')
  const [width, setWidth] = useState<number>(DEFAULT_W)
  const [resizing, setResizing] = useState(false)
  const dragRef = useRef<{ startX: number; startW: number; side: 1 | -1 } | null>(null)

  useEffect(() => {
    const saved = Number(localStorage.getItem(STORAGE_KEY))
    if (saved >= MIN_W && saved <= MAX_W) setWidth(saved)
  }, [])

  const updateWidth = useCallback((w: number) => {
    const clamped = Math.min(MAX_W, Math.max(MIN_W, Math.round(w)))
    setWidth(clamped)
    localStorage.setItem(STORAGE_KEY, String(clamped))
  }, [])

  const startResize = useCallback((side: 1 | -1) => (e: React.PointerEvent) => {
    e.preventDefault()
    dragRef.current = { startX: e.clientX, startW: width, side }
    setResizing(true)
    ;(e.target as Element).setPointerCapture(e.pointerId)
  }, [width])

  const onResizeMove = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current
    if (!d) return
    const delta = (e.clientX - d.startX) * d.side * 2
    updateWidth(d.startW + delta)
  }, [updateWidth])

  const endResize = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return
    dragRef.current = null
    setResizing(false)
    try { (e.target as Element).releasePointerCapture(e.pointerId) } catch {}
  }, [])

  // Use the section that was passed from the server — always correct for this story
  const section = initialSection

  useEffect(() => {
    getStories(lang, initialSection).then(stories => {
      const found = stories.find(s => s.id === id)
      if (found) setStory(found)
    })
  }, [lang, id, initialSection])

  // Stop speech on unmount or navigation to avoid stale audio across stories.
  useEffect(() => {
    return () => stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fix browser back: store section so back button returns to it
  useEffect(() => {
    window.history.replaceState({ section, url: window.location.pathname }, '')
  }, [section])

  const isPlaying = speechState.playing && speechState.title === story.title

  const handlePlainText = useCallback((p: string) => { bodyPlainRef.current = p }, [])

  const startSpeak = useCallback(() => {
    const parts: string[] = []
    if (story.title) parts.push(story.title + '.')
    if (story.body) parts.push(bodyPlainRef.current)
    else if (story.description) parts.push(story.description)
    speak(parts.join('\n\n'), lang as SpeechLang, story.title)
  }, [speak, story, lang])

  return (
    <main
      className={`${styles.main} ${resizing ? styles.resizing : ''}`}
      style={{ ['--story-width' as string]: `${width}px` }}
    >
      <div className={styles.topBar}>
        <button onClick={() => router.push(`/${section}`)} className={styles.back}>{BACK[lang]}</button>
        <div className={styles.widthControl}>
          <input
            type="range"
            min={MIN_W}
            max={MAX_W}
            step={10}
            value={width}
            onChange={(e) => updateWidth(Number(e.target.value))}
            className={styles.widthSlider}
            aria-label="ancho"
          />
          <span className={styles.widthLabel}>{width}px</span>
        </div>
        <div className={styles.langSwitcher}>
          {LANGS.map(l => (
            <button
              key={l}
              className={`${styles.langBtn} ${lang === l ? styles.langBtnActive : ''}`}
              onClick={() => setLang(l)}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <article className={styles.article}>
        <div
          className={`${styles.resizeHandle} ${styles.resizeHandleLeft} ${resizing ? styles.resizeHandleActive : ''}`}
          onPointerDown={startResize(-1)}
          onPointerMove={onResizeMove}
          onPointerUp={endResize}
          onPointerCancel={endResize}
          aria-label="ajustar ancho"
          role="separator"
        />
        <div
          className={`${styles.resizeHandle} ${styles.resizeHandleRight} ${resizing ? styles.resizeHandleActive : ''}`}
          onPointerDown={startResize(1)}
          onPointerMove={onResizeMove}
          onPointerUp={endResize}
          onPointerCancel={endResize}
          aria-label="ajustar ancho"
          role="separator"
        />
        <header className={styles.header}>
          <span className={styles.date}>{formatDate(story.date, lang)}</span>
          <h1 className={styles.title}>{story.title}</h1>
          <div className={styles.tags}>
            {story.tags.map(tag => (
              <span key={tag} className={styles.tag}>{tagLabel(tag)}</span>
            ))}
          </div>
          <button
            className={styles.playBtn}
            onClick={isPlaying ? stop : startSpeak}
          >
            {isPlaying ? `◼ ${STOP_LABEL[lang]}` : `▶ ${PLAY[lang]}`}
          </button>
        </header>

        <div className={styles.body}>
          {story.body ? (
            <HighlightedBody
              body={story.body}
              title={story.title}
              className={styles.bodyContent}
              wordClass={styles.word}
              wordActiveClass={styles.wordActive}
              sentActiveClass={styles.sentActive}
              scrollBtnClass={styles.scrollBtn}
              scrollBtnLabel="↓"
              onPlainText={handlePlainText}
            />
          ) : story.description ? (
            <div className={styles.section}>
              <span className={styles.sectionLabel}>{DESC[lang]}</span>
              <p className={styles.sectionText}>{story.description}</p>
            </div>
          ) : null}
        </div>
      </article>
    </main>
  )
}

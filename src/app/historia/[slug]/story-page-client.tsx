'use client'

import { useState, useEffect, useRef, memo } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/lib/language-context'
import { useSpeech, type SpeechLang } from '@/lib/speech-context'
import { getStories } from '@/app/actions'
import type { Story, Lang, Section } from '@/lib/stories'
import styles from './story-page.module.css'

const LANGS: Lang[] = ['es', 'de', 'en']

const BACK: Record<Lang, string> = { es: '← volver', de: '← zurück', en: '← back' }
const PLAY: Record<Lang, string> = { es: 'escuchar', de: 'anhören', en: 'listen' }
const STOP_LABEL: Record<Lang, string> = { es: 'detener', de: 'stoppen', en: 'stop' }
const DESC: Record<Lang, string> = { es: 'descripción', de: 'Beschreibung', en: 'description' }

function tagLabel(tag: string) { return tag.replace(/-/g, ' ') }

function mdToPlainText(md: string): string {
  return md
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/^\s*[-*]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/\|[^\n]+/g, '')
    .replace(/---+/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function storyToText(s: Story): string {
  const parts: string[] = []
  if (s.title) parts.push(s.title + '.')
  if (s.body) parts.push(mdToPlainText(s.body))
  else if (s.description) parts.push(s.description)
  return parts.join('\n\n')
}

function inlineMd(text: string): string {
  // Process in order: most specific first
  return text
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\b_(.+?)_\b/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
}

function mdToHtml(md: string): string {
  const blocks = md.split(/\n\n+/)
  return blocks.map(block => {
    const trimmed = block.trim()
    if (!trimmed) return ''
    if (trimmed.startsWith('# '))  return `<h1>${inlineMd(trimmed.slice(2))}</h1>`
    if (trimmed.startsWith('## ')) return `<h2>${inlineMd(trimmed.slice(3))}</h2>`
    if (trimmed.startsWith('### ')) return `<h3>${inlineMd(trimmed.slice(4))}</h3>`
    if (trimmed.startsWith('---')) return '<hr />'
    const lines = trimmed.split('\n')
    if (lines.length >= 2 && lines[0].includes('|') && lines[1].match(/^\|?[\s\-|]+\|?$/)) {
      const headers = lines[0].split('|').map(c => c.trim()).filter(Boolean)
      const rows = lines.slice(2).map(l => l.split('|').map(c => c.trim()).filter(Boolean))
      const thead = '<thead><tr>' + headers.map(h => `<th>${inlineMd(h)}</th>`).join('') + '</tr></thead>'
      const tbody = '<tbody>' + rows.map(r => '<tr>' + r.map(c => `<td>${inlineMd(c)}</td>`).join('') + '</tr>').join('') + '</tbody>'
      return `<table>${thead}${tbody}</table>`
    }
    if (lines.every(l => /^\d+\.\s/.test(l.trimStart()))) {
      return '<ol>' + lines.map(l => `<li>${inlineMd(l.replace(/^\s*\d+\.\s*/, ''))}</li>`).join('') + '</ol>'
    }
    if (lines.every(l => l.trimStart().startsWith('- '))) {
      return '<ul>' + lines.map(l => `<li>${inlineMd(l.replace(/^\s*-\s*/, ''))}</li>`).join('') + '</ul>'
    }
    return `<p>${inlineMd(trimmed.replace(/\n/g, ' '))}</p>`
  }).filter(Boolean).join('\n')
}

function formatDate(d: string, lang: Lang) {
  const locale = lang === 'es' ? 'es-ES' : lang === 'de' ? 'de-DE' : 'en-US'
  if (!d) return '—'
  try { return new Date(d).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }) }
  catch { return d }
}

export function StoryPageClient({ id, initialStory, initialSection }: { id: string; initialStory: Story; initialSection: Section }) {
  const router = useRouter()
  const { lang, setLang } = useLanguage()
  const { speak, stop, seekTo, state: speechState } = useSpeech()
  const [story, setStory] = useState<Story>(initialStory)

  // Use the section that was passed from the server — always correct for this story
  const section = initialSection

  useEffect(() => {
    getStories(lang, initialSection).then(stories => {
      const found = stories.find(s => s.id === id)
      if (found) setStory(found)
    })
  }, [lang, id, initialSection])

  // Fix browser back: store section so back button returns to it
  useEffect(() => {
    window.history.replaceState({ section, url: window.location.pathname }, '')
  }, [section])

  const isPlaying = speechState.playing && speechState.title === story.title

  return (
    <main className={styles.main}>
      <div className={styles.topBar}>
        <button onClick={() => router.push(`/${section}`)} className={styles.back}>{BACK[lang]}</button>
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
            onClick={isPlaying ? stop : () => speak(storyToText(story), lang as SpeechLang, story.title)}
          >
            {isPlaying ? `◼ ${STOP_LABEL[lang]}` : `▶ ${PLAY[lang]}`}
          </button>
        </header>

        <div className={styles.body}>
          {story.body ? (
            <BodyContent body={story.body} />
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

// Memoized body: renders markdown, never re-renders on speech changes
const BodyContent = memo(function BodyContent({ body }: { body: string }) {
  const bodyRef = useRef<HTMLDivElement>(null)

  // Click on paragraph → seek via word match in fullText
  const { liveFullTextRef } = useSpeech()
  useEffect(() => {
    const el = bodyRef.current
    if (!el) return
    function onClick(e: MouseEvent) {
      const p = (e.target as HTMLElement).closest('p') as HTMLElement | null
      if (!p) return
      const pText = p.textContent || ''
      if (!pText.trim()) return
      const fullText = liveFullTextRef.current
      if (!fullText) return
      // Find first content word of this paragraph in fullText
      const firstWord = pText.trim().split(/\s+/)[0]
      if (!firstWord) return
      const pos = fullText.indexOf(firstWord)
      if (pos < 0) return
      window.dispatchEvent(new CustomEvent('seek-to', { detail: pos / fullText.length }))
    }
    el.addEventListener('click', onClick)
    return () => el.removeEventListener('click', onClick)
  }, [])

  return <div ref={bodyRef} className={styles.bodyContent} dangerouslySetInnerHTML={{ __html: mdToHtml(body) }} />
})

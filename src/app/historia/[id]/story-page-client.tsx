'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/lib/language-context'
import { useSpeech, type SpeechLang } from '@/lib/speech-context'
import { getStories } from '@/app/actions'
import type { Story, Lang, Section } from '@/lib/stories'
import styles from './story-page.module.css'

const LANGS: Lang[] = ['es', 'de', 'en']

const BACK: Record<Lang, string> = { es: '← volver', de: '← zurück', en: '← back' }
const PLAY: Record<Lang, string> = { es: 'escuchar', de: 'anhören', en: 'listen' }
const STOP_LABEL: Record<Lang, string> = { es: 'detener', de: 'stoppen', en: 'stop' }
const WHAT: Record<Lang, string> = { es: 'qué pasó', de: 'was passierte', en: 'what happened' }

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
  if (s.what) parts.push(s.what)
  if (s.body) parts.push(mdToPlainText(s.body))
  return parts.join('\n\n')
}

function inlineMd(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
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
  const { lang, setLang } = useLanguage()
  const { speak, stop, state: speechState } = useSpeech()
  const [story, setStory] = useState<Story>(initialStory)

  useEffect(() => {
    getStories(lang, initialSection).then(stories => {
      const found = stories.find(s => s.id === id)
      if (found) setStory(found)
    })
  }, [lang, id, initialSection])

  const isPlaying = speechState.playing && speechState.title === story.title

  return (
    <main className={styles.main}>
      <div className={styles.topBar}>
        <Link href="/" className={styles.back}>{BACK[lang]}</Link>
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
            <div className={styles.bodyContent} dangerouslySetInnerHTML={{ __html: mdToHtml(story.body) }} />
          ) : story.what ? (
            <div className={styles.section}>
              <span className={styles.sectionLabel}>{WHAT[lang]}</span>
              <p className={styles.sectionText}>{story.what}</p>
            </div>
          ) : null}
        </div>
      </article>
    </main>
  )
}

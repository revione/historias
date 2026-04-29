'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import styles from './page.module.css'
import { getStories } from './actions'
import { useLanguage } from '@/lib/language-context'
import { useSpeech, type SpeechLang } from '@/lib/speech-context'
import type { Story, Tag, Lang, Section } from '@/lib/stories'
import { SECTIONS, DEFAULT_SECTION } from '@/lib/sections'
import { CATEGORY_TAGS, getStoryCategories } from '@/lib/categories'
import type { CategoryName } from '@/lib/categories'

type Translations = {
  recentLabel: string
  whatHappened: string
  noStories: string
  playAudio: string
  stopAudio: string
}

const T: Record<Lang, Translations> = {
  es: {
    recentLabel: 'últimas',
    whatHappened: 'qué pasó',
    noStories: 'no hay historias aquí todavía.',
    playAudio: 'escuchar',
    stopAudio: 'detener',
  },
  de: {
    recentLabel: 'zuletzt',
    whatHappened: 'was passierte',
    noStories: 'noch keine Geschichten hier.',
    playAudio: 'anhören',
    stopAudio: 'stoppen',
  },
  en: {
    recentLabel: 'recent',
    whatHappened: 'what happened',
    noStories: 'no stories here yet.',
    playAudio: 'listen',
    stopAudio: 'stop',
  },
}

const LANGS: Lang[] = ['es', 'de', 'en']

interface Props {
  initialBySection: Record<Section, Story[]>
}

export default function StoriesClient({ initialBySection }: Props) {
  const { lang, setLang } = useLanguage()
  const { speak, stop, state: speechState } = useSpeech()
  const [bySection, setBySection] = useState<Record<Section, Story[]>>(initialBySection)
  const [section, setSection] = useState<Section>(DEFAULT_SECTION)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterTag, setFilterTag] = useState<Tag | null>(null)
  const [filterCategory, setFilterCategory] = useState<CategoryName | null>(null)
  const [hoveredCat, setHoveredCat] = useState<CategoryName | null>(null)

  const t = T[lang]

  useEffect(() => {
    Promise.all(SECTIONS.map(s => getStories(lang, s.id).then(stories => [s.id, stories] as const)))
      .then(entries => {
        setBySection(Object.fromEntries(entries) as Record<Section, Story[]>)
      })
    setFilterTag(null)
    setFilterCategory(null)
    setExpanded(null)
  }, [lang])

  const stories = bySection[section] ?? []

  const filtered = filterTag
    ? stories.filter(s => s.tags.includes(filterTag))
    : filterCategory
    ? stories.filter(s => getStoryCategories(s.tags).includes(filterCategory))
    : stories

  const tagCounts = new Map<Tag, number>()
  stories.forEach(story => story.tags.forEach(tag => tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)))

  function clearFilter() {
    setFilterTag(null)
    setFilterCategory(null)
  }

  function switchSection(s: Section) {
    setSection(s)
    clearFilter()
    setExpanded(null)
  }

  function formatDate(d: string) {
    const locale = lang === 'es' ? 'es-ES' : lang === 'de' ? 'de-DE' : 'en-US'
    if (!d) return '—'
    try { return new Date(d).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }) }
    catch { return d }
  }

  const activeSectionConfig = SECTIONS.find(s => s.id === section)!
  const sectionLabel = activeSectionConfig.labels[lang]

  return (
    <main className={styles.main}>
      <div className={styles.sidebar}>
        <div className={styles.logo}>
          <span className={styles.logoAccent}>//</span> diario
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

        <div className={styles.navBlock}>
          {SECTIONS.map(cfg => (
            <div
              key={cfg.id}
              className={`${styles.navAllRow} ${section === cfg.id && !filterTag && !filterCategory ? styles.navAllActive : ''}`}
              onClick={() => switchSection(cfg.id)}
            >
              <span className={styles.navCount}>{(bySection[cfg.id] ?? []).length}</span>
              <span className={styles.navLabel}>{cfg.labels[lang]}</span>
            </div>
          ))}

          <div className={styles.recentBlock}>
            <span className={styles.recentHeader}>{t.recentLabel}</span>
            {stories.slice(0, 5).map(s => (
              <div
                key={s.id}
                className={styles.recentItem}
                onClick={() => { clearFilter(); setExpanded(s.id) }}
              >
                {s.title}
              </div>
            ))}
          </div>

          <div className={styles.catsBlock}>
            {(Object.keys(CATEGORY_TAGS) as CategoryName[]).map(cat => {
              const catCount = stories.filter(s => getStoryCategories(s.tags).includes(cat)).length
              if (catCount === 0) return null
              const subTags = CATEGORY_TAGS[cat].filter(tag => tagCounts.has(tag))
              return (
                <div
                  key={cat}
                  className={styles.catItem}
                  onMouseEnter={() => setHoveredCat(cat)}
                  onMouseLeave={() => setHoveredCat(null)}
                >
                  <div
                    className={`${styles.catRow} ${filterCategory === cat && !filterTag ? styles.catRowActive : ''}`}
                    onClick={() => { setFilterCategory(cat); setFilterTag(null) }}
                  >
                    <span className={styles.catCount}>{catCount}</span>
                    <span className={styles.catName}>{cat}</span>
                  </div>
                  {hoveredCat === cat && subTags.length > 0 && (
                    <div className={styles.subCats}>
                      {subTags.map(tag => (
                        <div
                          key={tag}
                          className={`${styles.subCatItem} ${filterTag === tag ? styles.subCatActive : ''}`}
                          onClick={() => { setFilterTag(tag); setFilterCategory(null) }}
                        >
                          <span className={styles.subCatCount}>{tagCounts.get(tag)}</span>
                          <span className={styles.subCatLabel}>{tagLabel(tag)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.contentHeader}>
          <h1 className={styles.pageTitle}>
            {filterTag ? tagLabel(filterTag) : filterCategory ? filterCategory : sectionLabel}
          </h1>
          <span className={styles.pageCount}>{filtered.length}</span>
        </div>

        {filtered.length === 0 && (
          <p className={styles.empty}>{t.noStories}</p>
        )}

        <div className={styles.list}>
          {filtered.map(s => (
            <div key={s.id} className={`${styles.card} ${expanded === s.id ? styles.cardOpen : ''}`}>
              <div className={styles.cardHeader} onClick={() => setExpanded(expanded === s.id ? null : s.id)}>
                <div className={styles.cardMeta}>
                  <span className={styles.cardDate}>{formatDate(s.date)}</span>
                  <Link
                    href={`/historia/${s.id}`}
                    className={styles.cardTitleLink}
                    onClick={e => e.stopPropagation()}
                  >
                    <h2 className={styles.cardTitle}>{s.title}</h2>
                  </Link>
                  <div className={styles.tags}>
                    {s.tags.map(tag => (
                      <span key={tag} className={`${styles.tag} ${styles['tag_' + tag] || styles.tagExtra}`}>{tagLabel(tag)}</span>
                    ))}
                  </div>
                  <div className={styles.cardInlineActions} onClick={e => e.stopPropagation()}>
                    {speechState.playing && speechState.title === s.title
                      ? <button className={styles.playBtn} onClick={stop}>◼ {t.stopAudio}</button>
                      : <button className={styles.playBtn} onClick={() => speak(storyToText(s), lang as SpeechLang, s.title)}>▶ {t.playAudio}</button>
                    }
                  </div>
                </div>
                <span className={`${styles.chevron} ${expanded === s.id ? styles.chevronOpen : ''}`}>↓</span>
              </div>

              {expanded !== s.id && (
                <p className={styles.preview}>
                  {(s.what || s.body || '').substring(0, 120)}
                  {(s.what || s.body || '').length > 120 ? '...' : ''}
                </p>
              )}

              {expanded === s.id && (
                <div className={styles.cardBody}>
                  {s.body ? (
                    <div className={styles.bodyContent} dangerouslySetInnerHTML={{ __html: mdToHtml(s.body) }} />
                  ) : (
                    <>
                      {s.what && <SectionView label={t.whatHappened} text={s.what} />}
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}

function SectionView({ label, text }: { label: string; text: string }) {
  return (
    <div className={styles.section}>
      <span className={styles.sectionLabel}>{label}</span>
      <p className={styles.sectionText}>{text}</p>
    </div>
  )
}

function tagLabel(tag: Tag) {
  return tag.replace(/-/g, ' ')
}

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

'use client'

import { useState, useEffect } from 'react'
import styles from './page.module.css'
import { createStory, updateStory, deleteStory, getStories } from './actions'
import { useLanguage } from '@/lib/language-context'
import type { Story, Tag, Lang } from '@/lib/stories'

// ─── Translations ─────────────────────────────────────────────────────────────

type Translations = {
  newStory: string
  storiesLabel: string
  allStories: string
  whatHappened: string
  titleLabel: string
  dateLabel: string
  tagsLabel: string
  addTagPlaceholder: string
  edit: string
  delete: string
  cancel: string
  save: string
  saving: string
  updating: string
  noStories: string
  newStoryTitle: string
  editStoryTitle: string
  deleteConfirm: string
  titlePlaceholder: string
  whatPlaceholder: string
}

const T: Record<Lang, Translations> = {
  es: {
    newStory: 'nueva historia',
    storiesLabel: 'historias',
    allStories: 'todas las historias',
    whatHappened: 'qué pasó',
    titleLabel: 'título',
    dateLabel: 'fecha',
    tagsLabel: 'etiquetas',
    addTagPlaceholder: 'nuevo tag',
    edit: 'editar',
    delete: 'borrar',
    cancel: 'cancelar',
    save: 'guardar',
    saving: 'guardando...',
    updating: 'actualizando...',
    noStories: 'no hay historias aquí todavía.',
    newStoryTitle: 'nueva historia',
    editStoryTitle: 'editar historia',
    deleteConfirm: '¿Borrar esta historia?',
    titlePlaceholder: 'Ej: Fiesta en el club, abril',
    whatPlaceholder: 'La situación, las personas, el contexto...',
  },
  de: {
    newStory: 'neue Geschichte',
    storiesLabel: 'Geschichten',
    allStories: 'alle Geschichten',
    whatHappened: 'was passierte',
    titleLabel: 'Titel',
    dateLabel: 'Datum',
    tagsLabel: 'Tags',
    addTagPlaceholder: 'neuer Tag',
    edit: 'bearbeiten',
    delete: 'löschen',
    cancel: 'abbrechen',
    save: 'speichern',
    saving: 'speichern...',
    updating: 'aktualisieren...',
    noStories: 'noch keine Geschichten hier.',
    newStoryTitle: 'neue Geschichte',
    editStoryTitle: 'Geschichte bearbeiten',
    deleteConfirm: 'Diese Geschichte löschen?',
    titlePlaceholder: 'z.B. Party im Club, April',
    whatPlaceholder: 'Die Situation, die Personen, der Kontext...',
  },
  en: {
    newStory: 'new story',
    storiesLabel: 'stories',
    allStories: 'all stories',
    whatHappened: 'what happened',
    titleLabel: 'title',
    dateLabel: 'date',
    tagsLabel: 'tags',
    addTagPlaceholder: 'new tag',
    edit: 'edit',
    delete: 'delete',
    cancel: 'cancel',
    save: 'save',
    saving: 'saving...',
    updating: 'updating...',
    noStories: 'no stories here yet.',
    newStoryTitle: 'new story',
    editStoryTitle: 'edit story',
    deleteConfirm: 'Delete this story?',
    titlePlaceholder: 'e.g. Party at the club, April',
    whatPlaceholder: 'The situation, the people, the context...',
  },
}

// ─── Component ────────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  title: '', date: '', what: '', tags: [] as Tag[]
}

const LANGS: Lang[] = ['es', 'de', 'en']

export default function StoriesClient({ initialStories }: { initialStories: Story[] }) {
  const { lang, setLang } = useLanguage()
  const [stories, setStories] = useState<Story[]>(initialStories)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [filterTag, setFilterTag] = useState<Tag | null>(null)
  const [tagInput, setTagInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  const t = T[lang]

  useEffect(() => {
    getStories(lang).then(setStories)
    setFilterTag(null)
    setExpanded(null)
  }, [lang])

  const filtered = filterTag ? stories.filter(s => s.tags.includes(filterTag)) : stories
  const allTags = Array.from(new Set([...stories.flatMap(s => s.tags), ...form.tags]))
  const visibleTags = allTags.filter(tag => stories.some(s => s.tags.includes(tag)) || form.tags.includes(tag))
  const tagCounts = new Map<Tag, number>()
  stories.forEach(story => story.tags.forEach(tag => tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)))

  function openNew() {
    setForm(EMPTY_FORM)
    setTagInput('')
    setEditId(null)
    setShowModal(true)
  }

  function openEdit(s: Story) {
    setForm({ title: s.title, date: s.date, what: s.what, tags: [...s.tags] })
    setTagInput('')
    setEditId(s.id)
    setShowModal(true)
  }

  function toggleTag(tag: Tag) {
    setForm(f => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter(t => t !== tag) : [...f.tags, tag]
    }))
  }

  function addCustomTag() {
    const tag = tagInput.trim().toLowerCase().replace(/\s+/g, '-')
    if (!tag) return
    setForm(f => f.tags.includes(tag) ? f : { ...f, tags: [...f.tags, tag] })
    setTagInput('')
  }

  async function save() {
    if (!form.title.trim()) return
    setSaving(true)
    if (editId) {
      await updateStory(lang, editId, form)
    } else {
      await createStory(lang, form)
    }
    setSaving(false)
    setShowModal(false)
    const updated = await getStories(lang)
    setStories(updated)
  }

  async function handleDelete(id: string) {
    if (!confirm(t.deleteConfirm)) return
    await deleteStory(lang, id)
    if (expanded === id) setExpanded(null)
    const updated = await getStories(lang)
    setStories(updated)
  }

  function formatDate(d: string) {
    const locale = lang === 'es' ? 'es-ES' : lang === 'de' ? 'de-DE' : 'en-US'
    if (!d) return '—'
    try { return new Date(d).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }) }
    catch { return d }
  }

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

        <div className={styles.statsBlock}>
          {[{ label: t.storiesLabel, count: stories.length, tag: null as Tag | null }]
            .concat(visibleTags.map(tag => ({ label: tagLabel(tag), count: tagCounts.get(tag) || 0, tag })))
            .map(({ label, count, tag }) => (
            <div
              key={label}
              className={`${styles.statItem} ${filterTag === tag ? styles.statItemActive : ''}`}
              onClick={() => setFilterTag(filterTag === tag ? null : tag)}
            >
              <span className={styles.statNum}>{count}</span>
              <span className={styles.statLabel}>{label}</span>
            </div>
          ))}
        </div>

        <button className={styles.addBtn} onClick={openNew}>+ {t.newStory}</button>
      </div>

      <div className={styles.content}>
        <div className={styles.contentHeader}>
          <h1 className={styles.pageTitle}>
            {filterTag ? tagLabel(filterTag) : t.allStories}
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
                  <h2 className={styles.cardTitle}>{s.title}</h2>
                  <div className={styles.tags}>
                    {s.tags.map(tag => (
                      <span key={tag} className={`${styles.tag} ${styles['tag_' + tag] || styles.tagExtra}`}>{tagLabel(tag)}</span>
                    ))}
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
                      {s.what && <Section label={t.whatHappened} text={s.what} />}
                    </>
                  )}
                  <div className={styles.cardActions}>
                    <button className={styles.editBtn}   onClick={() => openEdit(s)}>{t.edit}</button>
                    <button className={styles.deleteBtn} onClick={() => handleDelete(s.id)}>{t.delete}</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className={styles.modalBg} onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>{editId ? t.editStoryTitle : t.newStoryTitle}</h3>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className={styles.formGrid}>
              <FormField label={t.titleLabel}>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder={t.titlePlaceholder} />
              </FormField>
              <FormField label={t.dateLabel}>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </FormField>
            </div>
            <FormField label={t.whatHappened}>
              <textarea value={form.what} onChange={e => setForm(f => ({ ...f, what: e.target.value }))} rows={3} placeholder={t.whatPlaceholder} />
            </FormField>

            <FormField label={t.tagsLabel}>
              <div className={styles.tagSelector}>
                {visibleTags.map(tag => (
                  <button
                    key={tag}
                    className={`${styles.tagOpt} ${form.tags.includes(tag) ? styles['tagOpt_' + tag] || styles.tagOptSelected : ''}`}
                    onClick={() => toggleTag(tag)}
                  >
                    {tagLabel(tag)}
                  </button>
                ))}
                <input
                  className={styles.tagInput}
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addCustomTag()
                    }
                  }}
                  placeholder={t.addTagPlaceholder}
                />
                <button className={styles.tagOpt} onClick={addCustomTag}>+</button>
              </div>
            </FormField>
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setShowModal(false)}>{t.cancel}</button>
              <button className={styles.saveBtn} onClick={save} disabled={saving}>
                {saving ? t.saving : t.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

function Section({ label, text }: { label: string; text: string }) {
  return (
    <div className={styles.section}>
      <span className={styles.sectionLabel}>{label}</span>
      <p className={styles.sectionText}>{text}</p>
    </div>
  )
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={styles.formField}>
      <label className={styles.formLabel}>{label}</label>
      {children}
    </div>
  )
}

function tagLabel(tag: Tag) {
  return tag.replace(/-/g, ' ')
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
    // table: lines contain |
    if (lines.length >= 2 && lines[0].includes('|') && lines[1].match(/^\|?[\s\-|]+\|?$/)) {
      const headers = lines[0].split('|').map(c => c.trim()).filter(Boolean)
      const rows = lines.slice(2).map(l => l.split('|').map(c => c.trim()).filter(Boolean))
      const thead = '<thead><tr>' + headers.map(h => `<th>${inlineMd(h)}</th>`).join('') + '</tr></thead>'
      const tbody = '<tbody>' + rows.map(r => '<tr>' + r.map(c => `<td>${inlineMd(c)}</td>`).join('') + '</tr>').join('') + '</tbody>'
      return `<table>${thead}${tbody}</table>`
    }
    // numbered list
    if (lines.every(l => /^\d+\.\s/.test(l.trimStart()))) {
      return '<ol>' + lines.map(l => `<li>${inlineMd(l.replace(/^\s*\d+\.\s*/, ''))}</li>`).join('') + '</ol>'
    }
    // bullet list
    if (lines.every(l => l.trimStart().startsWith('- '))) {
      return '<ul>' + lines.map(l => `<li>${inlineMd(l.replace(/^\s*-\s*/, ''))}</li>`).join('') + '</ul>'
    }
    return `<p>${inlineMd(trimmed.replace(/\n/g, ' '))}</p>`
  }).filter(Boolean).join('\n')
}

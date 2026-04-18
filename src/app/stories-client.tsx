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
  signalsLabel: string
  patternsLabel: string
  insightsLabel: string
  allStories: string
  whatHappened: string
  signalsNoticed: string
  howIResponded: string
  insightPattern: string
  titleLabel: string
  dateLabel: string
  tagsLabel: string
  tagSignal: string
  tagPattern: string
  tagInsight: string
  tagPlace: string
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
  signalsPlaceholder: string
  responsePlaceholder: string
  insightPlaceholder: string
}

const T: Record<Lang, Translations> = {
  es: {
    newStory: 'nueva historia',
    storiesLabel: 'historias',
    signalsLabel: 'señales',
    patternsLabel: 'patrones',
    insightsLabel: 'insights',
    allStories: 'todas las historias',
    whatHappened: 'qué pasó',
    signalsNoticed: 'señales que noté',
    howIResponded: 'cómo respondí',
    insightPattern: 'insight / patrón',
    titleLabel: 'título',
    dateLabel: 'fecha',
    tagsLabel: 'etiquetas',
    tagSignal: 'Señal recibida',
    tagPattern: 'Patrón propio',
    tagInsight: 'Insight',
    tagPlace: 'Lugar',
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
    signalsPlaceholder: 'Lo que ella hizo, dijo, cómo se movió...',
    responsePlaceholder: 'Lo que hice, lo que no hice...',
    insightPlaceholder: 'Qué aprendí, qué se repite...',
  },
  de: {
    newStory: 'neue Geschichte',
    storiesLabel: 'Geschichten',
    signalsLabel: 'Signale',
    patternsLabel: 'Muster',
    insightsLabel: 'Erkenntnisse',
    allStories: 'alle Geschichten',
    whatHappened: 'was passierte',
    signalsNoticed: 'Signale bemerkt',
    howIResponded: 'wie ich reagierte',
    insightPattern: 'Erkenntnis / Muster',
    titleLabel: 'Titel',
    dateLabel: 'Datum',
    tagsLabel: 'Tags',
    tagSignal: 'Signal empfangen',
    tagPattern: 'Eigenes Muster',
    tagInsight: 'Erkenntnis',
    tagPlace: 'Ort',
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
    signalsPlaceholder: 'Was sie tat, sagte, wie sie sich bewegte...',
    responsePlaceholder: 'Was ich tat, was ich nicht tat...',
    insightPlaceholder: 'Was ich gelernt habe, was sich wiederholt...',
  },
  en: {
    newStory: 'new story',
    storiesLabel: 'stories',
    signalsLabel: 'signals',
    patternsLabel: 'patterns',
    insightsLabel: 'insights',
    allStories: 'all stories',
    whatHappened: 'what happened',
    signalsNoticed: 'signals I noticed',
    howIResponded: 'how I responded',
    insightPattern: 'insight / pattern',
    titleLabel: 'title',
    dateLabel: 'date',
    tagsLabel: 'tags',
    tagSignal: 'Signal received',
    tagPattern: 'Own pattern',
    tagInsight: 'Insight',
    tagPlace: 'Place',
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
    signalsPlaceholder: 'What she did, said, how she moved...',
    responsePlaceholder: 'What I did, what I didn\'t do...',
    insightPlaceholder: 'What I learned, what repeats...',
  },
}

// ─── Component ────────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  title: '', date: '', what: '', signals: '', response: '', insight: '', tags: [] as Tag[]
}

const LANGS: Lang[] = ['es', 'de', 'en']

export default function StoriesClient({ initialStories }: { initialStories: Story[] }) {
  const { lang, setLang } = useLanguage()
  const [stories, setStories] = useState<Story[]>(initialStories)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [filterTag, setFilterTag] = useState<Tag | null>(null)
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  const t = T[lang]

  const TAG_LABELS: Record<Tag, string> = {
    signal: t.tagSignal,
    pattern: t.tagPattern,
    insight: t.tagInsight,
    place: t.tagPlace,
  }

  useEffect(() => {
    getStories(lang).then(setStories)
    setFilterTag(null)
    setExpanded(null)
  }, [lang])

  const filtered = filterTag ? stories.filter(s => s.tags.includes(filterTag)) : stories
  const signalCount  = stories.filter(s => s.tags.includes('signal')).length
  const patternCount = stories.filter(s => s.tags.includes('pattern')).length
  const insightCount = stories.filter(s => s.tags.includes('insight')).length

  function openNew() {
    setForm(EMPTY_FORM)
    setEditId(null)
    setShowModal(true)
  }

  function openEdit(s: Story) {
    setForm({ title: s.title, date: s.date, what: s.what, signals: s.signals, response: s.response, insight: s.insight, tags: [...s.tags] })
    setEditId(s.id)
    setShowModal(true)
  }

  function toggleTag(tag: Tag) {
    setForm(f => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter(t => t !== tag) : [...f.tags, tag]
    }))
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
          {([
            { label: t.storiesLabel,  count: stories.length, tag: null             },
            { label: t.signalsLabel,  count: signalCount,    tag: 'signal'  as Tag },
            { label: t.patternsLabel, count: patternCount,   tag: 'pattern' as Tag },
            { label: t.insightsLabel, count: insightCount,   tag: 'insight' as Tag },
          ] as const).map(({ label, count, tag }) => (
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
            {filterTag ? TAG_LABELS[filterTag] : t.allStories}
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
                      <span key={tag} className={`${styles.tag} ${styles['tag_' + tag]}`}>{TAG_LABELS[tag]}</span>
                    ))}
                  </div>
                </div>
                <span className={`${styles.chevron} ${expanded === s.id ? styles.chevronOpen : ''}`}>↓</span>
              </div>

              {expanded !== s.id && (
                <p className={styles.preview}>{s.what?.substring(0, 120)}{s.what?.length > 120 ? '...' : ''}</p>
              )}

              {expanded === s.id && (
                <div className={styles.cardBody}>
                  {s.what     && <Section label={t.whatHappened}   text={s.what} />}
                  {s.signals  && <Section label={t.signalsNoticed} text={s.signals} />}
                  {s.response && <Section label={t.howIResponded}  text={s.response} />}
                  {s.insight  && <Section label={t.insightPattern} text={s.insight} />}
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
            <FormField label={t.signalsNoticed}>
              <textarea value={form.signals} onChange={e => setForm(f => ({ ...f, signals: e.target.value }))} rows={2} placeholder={t.signalsPlaceholder} />
            </FormField>
            <FormField label={t.howIResponded}>
              <textarea value={form.response} onChange={e => setForm(f => ({ ...f, response: e.target.value }))} rows={2} placeholder={t.responsePlaceholder} />
            </FormField>
            <FormField label={t.insightPattern}>
              <textarea value={form.insight} onChange={e => setForm(f => ({ ...f, insight: e.target.value }))} rows={2} placeholder={t.insightPlaceholder} />
            </FormField>
            <FormField label={t.tagsLabel}>
              <div className={styles.tagSelector}>
                {(['signal', 'pattern', 'insight', 'place'] as Tag[]).map(tag => (
                  <button
                    key={tag}
                    className={`${styles.tagOpt} ${form.tags.includes(tag) ? styles['tagOpt_' + tag] : ''}`}
                    onClick={() => toggleTag(tag)}
                  >
                    {TAG_LABELS[tag]}
                  </button>
                ))}
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

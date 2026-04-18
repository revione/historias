'use client'

import { useState, useEffect } from 'react'
import styles from './page.module.css'

type Tag = 'señal' | 'patron' | 'insight' | 'lugar'

interface Story {
  id: string
  title: string
  date: string
  what: string
  signals: string
  response: string
  insight: string
  tags: Tag[]
}

const TAG_LABELS: Record<Tag, string> = {
  señal: 'Señal recibida',
  patron: 'Patrón propio',
  insight: 'Insight',
  lugar: 'Lugar',
}

const EMPTY_FORM = { title: '', date: '', what: '', signals: '', response: '', insight: '', tags: [] as Tag[] }

export default function Home() {
  const [stories, setStories] = useState<Story[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [filterTag, setFilterTag] = useState<Tag | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/stories')
      .then(r => r.json())
      .then(data => { setStories(data); setLoading(false) })
  }, [])

  const filtered = filterTag ? stories.filter(s => s.tags.includes(filterTag)) : stories

  const signalCount = stories.filter(s => s.tags.includes('señal')).length
  const patternCount = stories.filter(s => s.tags.includes('patron')).length
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
      const res = await fetch(`/api/stories/${editId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const updated = await res.json()
      setStories(prev => prev.map(s => s.id === editId ? updated : s))
    } else {
      const res = await fetch('/api/stories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const created = await res.json()
      setStories(prev => [created, ...prev])
    }
    setSaving(false)
    setShowModal(false)
  }

  async function deleteStory(id: string) {
    if (!confirm('¿Borrar esta historia?')) return
    await fetch(`/api/stories/${id}`, { method: 'DELETE' })
    setStories(prev => prev.filter(s => s.id !== id))
    if (expanded === id) setExpanded(null)
  }

  function formatDate(d: string) {
    if (!d) return '—'
    try { return new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) }
    catch { return d }
  }

  return (
    <main className={styles.main}>
      <div className={styles.sidebar}>
        <div className={styles.logo}>
          <span className={styles.logoAccent}>//</span> diario
        </div>
        <div className={styles.statsBlock}>
          <div className={styles.statItem}>
            <span className={styles.statNum}>{stories.length}</span>
            <span className={styles.statLabel}>historias</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNum}>{signalCount}</span>
            <span className={styles.statLabel}>señales</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNum}>{patternCount}</span>
            <span className={styles.statLabel}>patrones</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNum}>{insightCount}</span>
            <span className={styles.statLabel}>insights</span>
          </div>
        </div>
        <div className={styles.filterBlock}>
          <p className={styles.filterTitle}>filtrar por</p>
          {(['señal', 'patron', 'insight', 'lugar'] as Tag[]).map(t => (
            <button
              key={t}
              className={`${styles.filterBtn} ${filterTag === t ? styles.filterActive : ''}`}
              onClick={() => setFilterTag(filterTag === t ? null : t)}
            >
              {TAG_LABELS[t]}
            </button>
          ))}
        </div>
        <button className={styles.addBtn} onClick={openNew}>+ nueva historia</button>
      </div>

      <div className={styles.content}>
        <div className={styles.contentHeader}>
          <h1 className={styles.pageTitle}>
            {filterTag ? TAG_LABELS[filterTag] : 'todas las historias'}
          </h1>
          <span className={styles.pageCount}>{filtered.length}</span>
        </div>

        {loading && <p className={styles.empty}>cargando...</p>}
        {!loading && filtered.length === 0 && (
          <p className={styles.empty}>no hay historias aquí todavía.</p>
        )}

        <div className={styles.list}>
          {filtered.map(s => (
            <div key={s.id} className={`${styles.card} ${expanded === s.id ? styles.cardOpen : ''}`}>
              <div className={styles.cardHeader} onClick={() => setExpanded(expanded === s.id ? null : s.id)}>
                <div className={styles.cardMeta}>
                  <span className={styles.cardDate}>{formatDate(s.date)}</span>
                  <h2 className={styles.cardTitle}>{s.title}</h2>
                  <div className={styles.tags}>
                    {s.tags.map(t => (
                      <span key={t} className={`${styles.tag} ${styles['tag_' + t]}`}>{TAG_LABELS[t]}</span>
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
                  {s.what && <Section label="qué pasó" text={s.what} />}
                  {s.signals && <Section label="señales que noté" text={s.signals} />}
                  {s.response && <Section label="cómo respondí" text={s.response} />}
                  {s.insight && <Section label="insight / patrón" text={s.insight} />}
                  <div className={styles.cardActions}>
                    <button className={styles.editBtn} onClick={() => openEdit(s)}>editar</button>
                    <button className={styles.deleteBtn} onClick={() => deleteStory(s.id)}>borrar</button>
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
              <h3>{editId ? 'editar historia' : 'nueva historia'}</h3>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className={styles.formGrid}>
              <FormField label="título">
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ej: Fiesta en el club, abril" />
              </FormField>
              <FormField label="fecha">
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </FormField>
            </div>
            <FormField label="¿qué pasó?">
              <textarea value={form.what} onChange={e => setForm(f => ({ ...f, what: e.target.value }))} rows={3} placeholder="La situación, las personas, el contexto..." />
            </FormField>
            <FormField label="señales que noté">
              <textarea value={form.signals} onChange={e => setForm(f => ({ ...f, signals: e.target.value }))} rows={2} placeholder="Lo que ella hizo, dijo, cómo se movió..." />
            </FormField>
            <FormField label="¿cómo respondí?">
              <textarea value={form.response} onChange={e => setForm(f => ({ ...f, response: e.target.value }))} rows={2} placeholder="Lo que hice, lo que no hice..." />
            </FormField>
            <FormField label="insight / patrón">
              <textarea value={form.insight} onChange={e => setForm(f => ({ ...f, insight: e.target.value }))} rows={2} placeholder="Qué aprendí, qué se repite..." />
            </FormField>
            <FormField label="etiquetas">
              <div className={styles.tagSelector}>
                {(['señal', 'patron', 'insight', 'lugar'] as Tag[]).map(t => (
                  <button
                    key={t}
                    className={`${styles.tagOpt} ${form.tags.includes(t) ? styles['tagOpt_' + t] : ''}`}
                    onClick={() => toggleTag(t)}
                  >
                    {TAG_LABELS[t]}
                  </button>
                ))}
              </div>
            </FormField>
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setShowModal(false)}>cancelar</button>
              <button className={styles.saveBtn} onClick={save} disabled={saving}>
                {saving ? 'guardando...' : 'guardar'}
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

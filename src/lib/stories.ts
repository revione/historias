import fs from 'fs'
import path from 'path'

export type Lang = 'es' | 'de' | 'en'
export type Tag = 'signal' | 'pattern' | 'insight' | 'place'

export interface Story {
  id: string
  title: string
  date: string
  what: string
  signals: string
  response: string
  insight: string
  tags: Tag[]
  body?: string
}

type Fields = Record<string, string | string[]>

function getContentDir(lang: Lang): string {
  return path.join(process.cwd(), 'content', 'historias', lang)
}

function parseFrontmatter(raw: string): Fields {
  const fields: Fields = {}
  const lines = raw.split('\n')
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) { i++; continue }
    const key = line.slice(0, colonIdx).trim()
    const rest = line.slice(colonIdx + 1).trim()
    if (rest === '>') {
      const block: string[] = []
      i++
      while (i < lines.length && (lines[i].startsWith('  ') || lines[i].startsWith('\t'))) {
        block.push(lines[i].trim())
        i++
      }
      fields[key] = block.join(' ')
    } else if (rest.startsWith('[') && rest.endsWith(']')) {
      fields[key] = rest.slice(1, -1).split(',').map(s => s.trim()).filter(Boolean)
      i++
    } else {
      fields[key] = rest
      i++
    }
  }
  return fields
}

function splitMdx(source: string): { fm: string; body: string } {
  const trimmed = source.trimStart()
  if (!trimmed.startsWith('---')) return { fm: '', body: source }
  const afterOpen = trimmed.slice(3)
  const closeIdx = afterOpen.indexOf('\n---')
  if (closeIdx === -1) return { fm: '', body: source }
  return { fm: afterOpen.slice(0, closeIdx), body: afterOpen.slice(closeIdx + 4) }
}

function serialiseFrontmatter(fields: Fields): string {
  const SCALAR = ['title', 'date', 'what', 'signals', 'response', 'insight']
  const ARRAY = ['tags']
  const keys = [
    ...SCALAR.filter(k => k in fields),
    ...ARRAY.filter(k => k in fields),
    ...Object.keys(fields).filter(k => !SCALAR.includes(k) && !ARRAY.includes(k)),
  ]
  return keys.map(key => {
    const val = fields[key]
    if (Array.isArray(val)) return `${key}: [${val.join(', ')}]`
    if (typeof val === 'string' && (val.length > 80 || val.includes('\n'))) {
      return `${key}: >\n  ${val.replace(/\n/g, '\n  ')}`
    }
    return `${key}: ${val}`
  }).join('\n')
}

export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function readStories(lang: Lang): Story[] {
  const dir = getContentDir(lang)
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.mdx'))
    .sort()
    .reverse()
    .map(filename => {
      const id = filename.replace(/\.mdx$/, '')
      const source = fs.readFileSync(path.join(dir, filename), 'utf-8')
      const { fm, body } = splitMdx(source)
      const bodyTrimmed = body.trim()
      return { id, ...parseFrontmatter(fm), ...(bodyTrimmed ? { body: bodyTrimmed } : {}) } as Story
    })
}

export function writeStory(lang: Lang, filename: string, fields: Fields, body = '') {
  const dir = getContentDir(lang)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(
    path.join(dir, filename),
    `---\n${serialiseFrontmatter(fields)}\n---\n${body}`,
    'utf-8'
  )
}

export function updateStoryFile(lang: Lang, id: string, updates: Fields) {
  const dir = getContentDir(lang)
  const filepath = path.join(dir, `${id}.mdx`)
  if (!fs.existsSync(filepath)) throw new Error(`Story not found: ${id}`)
  const source = fs.readFileSync(filepath, 'utf-8')
  const { fm, body } = splitMdx(source)
  const merged = { ...parseFrontmatter(fm), ...updates }
  fs.writeFileSync(filepath, `---\n${serialiseFrontmatter(merged)}\n---\n${body}`, 'utf-8')
}

export function deleteStoryFile(lang: Lang, id: string) {
  const dir = getContentDir(lang)
  const filepath = path.join(dir, `${id}.mdx`)
  if (fs.existsSync(filepath)) fs.unlinkSync(filepath)
}

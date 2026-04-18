import fs from 'fs'
import path from 'path'

const contentDir = path.join(process.cwd(), 'content', 'historias')

export type Tag = 'señal' | 'patron' | 'insight' | 'lugar'

export interface Story {
  id: string
  title: string
  date: string
  what: string
  signals: string
  response: string
  insight: string
  tags: Tag[]
}

type Fields = Record<string, string | string[]>

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

export function readStories(): Story[] {
  if (!fs.existsSync(contentDir)) return []
  return fs.readdirSync(contentDir)
    .filter(f => f.endsWith('.mdx'))
    .sort()
    .reverse()
    .map(filename => {
      const id = filename.replace(/\.mdx$/, '')
      const source = fs.readFileSync(path.join(contentDir, filename), 'utf-8')
      const { fm } = splitMdx(source)
      return { id, ...parseFrontmatter(fm) } as Story
    })
}

export function writeStory(filename: string, fields: Fields, body = '') {
  if (!fs.existsSync(contentDir)) fs.mkdirSync(contentDir, { recursive: true })
  fs.writeFileSync(
    path.join(contentDir, filename),
    `---\n${serialiseFrontmatter(fields)}\n---\n${body}`,
    'utf-8'
  )
}

export function updateStoryFile(id: string, updates: Fields) {
  const filepath = path.join(contentDir, `${id}.mdx`)
  if (!fs.existsSync(filepath)) throw new Error(`Story not found: ${id}`)
  const source = fs.readFileSync(filepath, 'utf-8')
  const { fm, body } = splitMdx(source)
  const merged = { ...parseFrontmatter(fm), ...updates }
  fs.writeFileSync(filepath, `---\n${serialiseFrontmatter(merged)}\n---\n${body}`, 'utf-8')
}

export function deleteStoryFile(id: string) {
  const filepath = path.join(contentDir, `${id}.mdx`)
  if (fs.existsSync(filepath)) fs.unlinkSync(filepath)
}

import fs from 'fs'
import path from 'path'
import { getSection, DEFAULT_SECTION, type SectionId } from './sections'

export type Lang = 'es' | 'de' | 'en'
export type Section = SectionId
export type Tag = string

export interface Story {
  id: string
  title: string
  date: string
  what: string
  tags: Tag[]
  body?: string
  section: Section
}

type Fields = Record<string, string | string[]>

function getContentDir(lang: Lang, section: Section): string {
  return path.join(process.cwd(), 'content', getSection(section).dir, lang)
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
    } else if (rest === '' && i + 1 < lines.length && /^\s+-\s/.test(lines[i + 1])) {
      const list: string[] = []
      i++
      while (i < lines.length && /^\s+-\s/.test(lines[i])) {
        list.push(lines[i].replace(/^\s+-\s+/, '').trim())
        i++
      }
      fields[key] = list.filter(Boolean)
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

export function readStories(lang: Lang, section: Section = DEFAULT_SECTION): Story[] {
  const dir = getContentDir(lang, section)
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.mdx'))
    .sort()
    .reverse()
    .map(filename => {
      const id = filename.replace(/\.mdx$/, '')
      const source = fs.readFileSync(path.join(dir, filename), 'utf-8')
      const { fm, body } = splitMdx(source)
      const fields = parseFrontmatter(fm)
      if (!Array.isArray(fields.tags)) fields.tags = []
      const bodyTrimmed = body.trim()
      return { id, section, ...fields, ...(bodyTrimmed ? { body: bodyTrimmed } : {}) } as Story
    })
}

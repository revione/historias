import type { Lang } from './stories'

export type SectionId = 'historias' | 'ai' | 'contexto-complicado'

export interface SectionConfig {
  id: SectionId
  dir: string
  labels: Record<Lang, string>
}

export const SECTIONS: SectionConfig[] = [
  {
    id: 'historias',
    dir: 'historias',
    labels: { es: 'historias', de: 'Geschichten', en: 'stories' },
  },
  {
    id: 'ai',
    dir: 'ai',
    labels: { es: 'ia', de: 'KI', en: 'ai' },
  },
  {
    id: 'contexto-complicado',
    dir: 'contexto-complicado',
    labels: { es: 'contexto complicado', de: 'schwieriger Kontext', en: 'complicated context' },
  },
]

export const DEFAULT_SECTION: SectionId = 'historias'

export function getSection(id: SectionId): SectionConfig {
  const found = SECTIONS.find(s => s.id === id)
  if (!found) throw new Error(`Unknown section: ${id}`)
  return found
}

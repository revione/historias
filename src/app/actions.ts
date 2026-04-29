'use server'
import { readStories } from '@/lib/stories'
import type { Story, Lang, Section } from '@/lib/stories'

export async function getStories(lang: Lang, section: Section = 'historias'): Promise<Story[]> {
  return readStories(lang, section)
}

import { readStories, type Lang, type Story } from '@/lib/stories'
import { SECTIONS, DEFAULT_SECTION } from '@/lib/sections'
import { StoryPageClient } from './story-page-client'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

const LANGS: Lang[] = ['es', 'de', 'en']

function findBySlug(slug: string): { story: Story; section: typeof SECTIONS[number]['id'] } | null {
  for (const lang of LANGS) {
    for (const section of SECTIONS) {
      const found = readStories(lang, section.id).find(s => s.slug === slug)
      if (found) return { story: found, section: section.id }
    }
  }
  return null
}

export async function generateStaticParams() {
  const slugs = new Set<string>()
  for (const lang of LANGS) {
    for (const s of SECTIONS) {
      for (const story of readStories(lang, s.id)) slugs.add(story.slug)
    }
  }
  return Array.from(slugs).map(slug => ({ slug }))
}

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const hit = findBySlug(slug)
  if (hit) return { title: hit.story.title, description: hit.story.description }
  return { title: 'Historia no encontrada' }
}

export default async function StoryPage({ params }: Props) {
  const { slug } = await params
  const hit = findBySlug(slug)
  if (!hit) notFound()
  return <StoryPageClient id={hit.story.id} initialStory={hit.story} initialSection={hit.section} />
}

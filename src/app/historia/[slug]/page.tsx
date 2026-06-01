import { readStories } from '@/lib/stories'
import { SECTIONS, DEFAULT_SECTION } from '@/lib/sections'
import { StoryPageClient } from './story-page-client'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export async function generateStaticParams() {
  return SECTIONS.flatMap(s => readStories('es', s.id)).map(s => ({ slug: s.slug }))
}

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  for (const section of SECTIONS) {
    const found = readStories('es', section.id).find(s => s.slug === slug)
    if (found) return { title: found.title, description: found.description }
  }
  return { title: 'Historia no encontrada' }
}

export default async function StoryPage({ params }: Props) {
  const { slug } = await params
  for (const section of SECTIONS) {
    const found = readStories('es', section.id).find(s => s.slug === slug)
    if (found) return <StoryPageClient id={found.id} initialStory={found} initialSection={section.id} />
  }
  notFound()
}

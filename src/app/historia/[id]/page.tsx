import { readStories } from '@/lib/stories'
import { SECTIONS } from '@/lib/sections'
import { StoryPageClient } from './story-page-client'
import { notFound } from 'next/navigation'

export async function generateStaticParams() {
  return SECTIONS.flatMap(s => readStories('es', s.id)).map(s => ({ id: s.id }))
}

export default async function StoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  for (const section of SECTIONS) {
    const found = readStories('es', section.id).find(s => s.id === id)
    if (found) return <StoryPageClient id={id} initialStory={found} initialSection={section.id} />
  }
  notFound()
}

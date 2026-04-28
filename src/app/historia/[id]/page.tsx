import { readStories } from '@/lib/stories'
import { StoryPageClient } from './story-page-client'
import { notFound } from 'next/navigation'

export async function generateStaticParams() {
  const stories = readStories('es')
  return stories.map(s => ({ id: s.id }))
}

export default async function StoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const story = readStories('es').find(s => s.id === id)
  if (!story) notFound()
  return <StoryPageClient id={id} initialStory={story} />
}

import { readStories, type Section } from '@/lib/stories'
import { SECTIONS } from '@/lib/sections'
import StoriesClient from './stories-client'

export default function Home() {
  const initialBySection = SECTIONS.reduce((acc, s) => {
    acc[s.id] = readStories('es', s.id)
    return acc
  }, {} as Record<Section, ReturnType<typeof readStories>>)
  return <StoriesClient initialBySection={initialBySection} />
}

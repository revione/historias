import { readStories } from '@/lib/stories'
import StoriesClient from './stories-client'

export default function Home() {
  const initialStories = readStories('es')
  return <StoriesClient initialStories={initialStories} />
}

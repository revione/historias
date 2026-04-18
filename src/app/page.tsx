import { readStories } from '@/lib/stories'
import StoriesClient from './stories-client'

export default function Home() {
  const stories = readStories()
  return <StoriesClient stories={stories} />
}

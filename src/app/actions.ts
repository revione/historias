'use server'
import { revalidatePath } from 'next/cache'
import { writeStory, updateStoryFile, deleteStoryFile, readStories, slugify } from '@/lib/stories'
import type { Story, Lang } from '@/lib/stories'

type StoryInput = Omit<Story, 'id'>

export async function getStories(lang: Lang): Promise<Story[]> {
  return readStories(lang)
}

export async function createStory(lang: Lang, data: StoryInput) {
  const date = data.date || new Date().toISOString().slice(0, 10)
  const slug = slugify(data.title || 'untitled')
  writeStory(lang, `${date}-${slug}.mdx`, { ...data, date })
  revalidatePath('/')
}

export async function updateStory(lang: Lang, id: string, data: Partial<StoryInput>) {
  updateStoryFile(lang, id, data as Record<string, string | string[]>)
  revalidatePath('/')
}

export async function deleteStory(lang: Lang, id: string) {
  deleteStoryFile(lang, id)
  revalidatePath('/')
}

'use server'
import { revalidatePath } from 'next/cache'
import { writeStory, updateStoryFile, deleteStoryFile, slugify } from '@/lib/stories'
import type { Story } from '@/lib/stories'

type StoryInput = Omit<Story, 'id'>

export async function createStory(data: StoryInput) {
  const date = data.date || new Date().toISOString().slice(0, 10)
  const slug = slugify(data.title || 'untitled')
  writeStory(`${date}-${slug}.mdx`, { ...data, date })
  revalidatePath('/')
}

export async function updateStory(id: string, data: Partial<StoryInput>) {
  updateStoryFile(id, data as Record<string, string | string[]>)
  revalidatePath('/')
}

export async function deleteStory(id: string) {
  deleteStoryFile(id)
  revalidatePath('/')
}

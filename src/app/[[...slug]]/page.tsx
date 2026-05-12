import { readStories, type Section } from '@/lib/stories'
import { SECTIONS } from '@/lib/sections'
import { CATEGORY_TAGS } from '@/lib/categories'
import type { CategoryName } from '@/lib/categories'
import StoriesClient from '../stories-client'

export function generateStaticParams() {
  return [
    { slug: [] },
    ...SECTIONS.map(s => ({ slug: [s.id] })),
  ]
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ slug?: string[] }>
}) {
  const initialBySection = SECTIONS.reduce((acc, s) => {
    acc[s.id] = readStories('es', s.id)
    return acc
  }, {} as Record<Section, ReturnType<typeof readStories>>)

  const { slug = [] } = await params

  let section: Section = 'historias'
  let category: CategoryName | null = null
  let tag: string | null = null

  if (slug.length > 0) {
    const s = slug[0] as Section
    if (SECTIONS.find(cfg => cfg.id === s)) section = s
  }
  if (slug.length > 1) {
    const c = slug[1] as CategoryName
    if (CATEGORY_TAGS[c]) category = c
  }
  if (slug.length > 2) {
    tag = slug[2]
  }

  return (
    <StoriesClient
      initialBySection={initialBySection}
      initialSection={section}
      initialCategory={category}
      initialTag={tag}
    />
  )
}

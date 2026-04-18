import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const dataPath = path.join(process.cwd(), 'data', 'stories.json')

function readStories() {
  if (!fs.existsSync(dataPath)) return []
  return JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
}

function writeStories(stories: any[]) {
  fs.writeFileSync(dataPath, JSON.stringify(stories, null, 2))
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const stories = readStories()
  const filtered = stories.filter((s: any) => s.id !== params.id)
  writeStories(filtered)
  return NextResponse.json({ ok: true })
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json()
  const stories = readStories()
  const idx = stories.findIndex((s: any) => s.id === params.id)
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  stories[idx] = { ...stories[idx], ...body }
  writeStories(stories)
  return NextResponse.json(stories[idx])
}

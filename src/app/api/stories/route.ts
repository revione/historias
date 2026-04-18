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

export async function GET() {
  const stories = readStories()
  return NextResponse.json(stories)
}

export async function POST(req: Request) {
  const body = await req.json()
  const stories = readStories()
  const newStory = { ...body, id: Date.now().toString() }
  stories.unshift(newStory)
  writeStories(stories)
  return NextResponse.json(newStory, { status: 201 })
}

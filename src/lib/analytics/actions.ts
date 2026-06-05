'use server'

import { cookies, headers } from 'next/headers'
import { createHash } from 'crypto'
import { unstable_cache, revalidateTag } from 'next/cache'
import { prisma } from './db'
import { isBot } from './bots'

const SID_COOKIE = 'sid'
const PRESENCE_WINDOW_MS = 30_000
const VISIT_WINDOW_MS = 30 * 60 * 1000 // 30 min — reloads within this window count as one visit

function hashSid(sid: string): string {
  return createHash('sha256').update(sid).digest('hex').slice(0, 32)
}

async function getSid(): Promise<string | null> {
  const c = await cookies()
  return c.get(SID_COOKIE)?.value ?? null
}

async function getRequestMeta() {
  const h = await headers()
  const xff = h.get('x-forwarded-for')
  const ip = xff?.split(',')[0]?.trim() ?? h.get('x-real-ip') ?? null
  return {
    ua: h.get('user-agent'),
    referer: h.get('referer'),
    country: h.get('x-vercel-ip-country'),
    ip,
  }
}

const rateBuckets = new Map<string, { count: number; resetAt: number }>()
function rateLimit(sid: string, limit = 10, windowMs = 60_000): boolean {
  const now = Date.now()
  const b = rateBuckets.get(sid)
  if (!b || b.resetAt < now) {
    rateBuckets.set(sid, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (b.count >= limit) return false
  b.count++
  return true
}

export async function recordView(slug: string, section: string): Promise<void> {
  console.log('[recordView] start slug=', slug, 'section=', section)
  const sid = await getSid()
  console.log('[recordView] sid=', sid?.slice(0, 8) ?? 'NONE')
  if (!sid) { console.log('[recordView] abort: no sid'); return }
  const { ua, referer, country, ip } = await getRequestMeta()
  console.log('[recordView] ip=', ip, 'ua=', ua?.slice(0, 40), 'country=', country)
  if (isBot(ua)) { console.log('[recordView] abort: bot'); return }
  if (!rateLimit(sid)) { console.log('[recordView] abort: rate limit'); return }

  const prior = await prisma.sessionView.findUnique({
    where: { sessionId_slug: { sessionId: sid, slug } },
  })
  console.log('[recordView] alreadyRegistered=', !!prior, prior ? `priorViews=${prior.views} lastAt=${prior.lastAt.toISOString()}` : '')

  if (prior && Date.now() - prior.lastAt.getTime() < VISIT_WINDOW_MS) {
    await prisma.sessionView.update({
      where: { sessionId_slug: { sessionId: sid, slug } },
      data: { lastAt: new Date() },
    })
    console.log('[recordView] skip: within visit window (', Math.round((Date.now() - prior.lastAt.getTime()) / 1000), 's)')
    return
  }

  let isUniqueForPost = false

  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.sessionView.findUnique({
        where: { sessionId_slug: { sessionId: sid, slug } },
      })

      if (!existing) {
        isUniqueForPost = true
        await tx.sessionView.create({ data: { sessionId: sid, slug, views: 1 } })
      } else {
        await tx.sessionView.update({
          where: { sessionId_slug: { sessionId: sid, slug } },
          data: { views: { increment: 1 } },
        })
      }

      await tx.postStats.upsert({
        where: { slug },
        create: { slug, section, views: 1, uniqueViews: isUniqueForPost ? 1 : 0 },
        update: {
          views: { increment: 1 },
          ...(isUniqueForPost && { uniqueViews: { increment: 1 } }),
        },
      })

      const refHost = (() => {
        if (!referer) return null
        try { return new URL(referer).host } catch { return null }
      })()

      await tx.viewEvent.create({
        data: {
          slug,
          sessionHash: hashSid(sid),
          source: refHost,
          country: country ?? null,
        },
      })
    })

    revalidateTag('post-stats:' + slug)
    revalidateTag('top-posts')

    const post = await prisma.postStats.findUnique({ where: { slug } })
    console.log('[recordView] OK uniqueForPost=', isUniqueForPost, 'post', slug, '=', post?.views, '(unique', post?.uniqueViews, ')')
  } catch (err) {
    console.error('[recordView] failed', err)
  }
}

export async function recordHit(path: string): Promise<void> {
  console.log('[recordHit] start path=', path)
  const sid = await getSid()
  console.log('[recordHit] sid=', sid?.slice(0, 8) ?? 'NONE')
  if (!sid) { console.log('[recordHit] abort: no sid'); return }
  const { ua, ip } = await getRequestMeta()
  console.log('[recordHit] ip=', ip, 'ua=', ua?.slice(0, 40))
  if (isBot(ua)) { console.log('[recordHit] abort: bot'); return }
  if (!rateLimit(sid)) { console.log('[recordHit] abort: rate limit'); return }

  const priorSite = await prisma.siteSession.findUnique({ where: { sessionId: sid } })
  if (priorSite && Date.now() - priorSite.lastAt.getTime() < VISIT_WINDOW_MS) {
    await prisma.siteSession.update({
      where: { sessionId: sid },
      data: { lastAt: new Date() },
    })
    console.log('[recordHit] skip: within visit window (', Math.round((Date.now() - priorSite.lastAt.getTime()) / 1000), 's)')
    return
  }

  let isFirstEverForSession = false

  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.siteSession.findUnique({ where: { sessionId: sid } })
      if (!existing) {
        isFirstEverForSession = true
        await tx.siteSession.create({ data: { sessionId: sid, hits: 1 } })
      } else {
        await tx.siteSession.update({
          where: { sessionId: sid },
          data: { hits: { increment: 1 } },
        })
      }

      await tx.siteStats.upsert({
        where: { id: 'site' },
        create: {
          id: 'site',
          totalViews: 1,
          uniqueViews: isFirstEverForSession ? 1 : 0,
        },
        update: {
          totalViews: { increment: 1 },
          ...(isFirstEverForSession && { uniqueViews: { increment: 1 } }),
        },
      })
    })

    revalidateTag('site-stats')

    const site = await prisma.siteStats.findUnique({ where: { id: 'site' } })
    console.log('[recordHit] OK firstEver=', isFirstEverForSession, 'site total=', site?.totalViews, '(unique', site?.uniqueViews, ')')
  } catch (err) {
    console.error('[recordHit] failed', err)
  }
}

export async function pingActive(slug: string): Promise<void> {
  const sid = await getSid()
  console.log('[pingActive] slug=', slug, 'sid=', sid?.slice(0, 8) ?? 'NONE')
  if (!sid) return
  try {
    await prisma.activeReader.upsert({
      where: { sessionId_slug: { sessionId: sid, slug } },
      create: { sessionId: sid, slug },
      update: { lastPing: new Date() },
    })
    console.log('[pingActive] OK')
  } catch (err) {
    console.error('[pingActive] failed', err)
  }
}

export const getPostStats = unstable_cache(
  async (slug: string) => {
    const row = await prisma.postStats.findUnique({ where: { slug } })
    const out = { views: row?.views ?? 0, unique: row?.uniqueViews ?? 0 }
    console.log('[getPostStats]', slug, out)
    return out
  },
  ['post-stats'],
  { revalidate: 30, tags: ['post-stats'] },
)

export const getSiteStats = unstable_cache(
  async () => {
    const row = await prisma.siteStats.findUnique({ where: { id: 'site' } })
    const out = { total: row?.totalViews ?? 0, unique: row?.uniqueViews ?? 0 }
    console.log('[getSiteStats]', out)
    return out
  },
  ['site-stats'],
  { revalidate: 60, tags: ['site-stats'] },
)

export const getTopPosts = unstable_cache(
  async (limit = 3) => {
    const rows = await prisma.postStats.findMany({
      orderBy: { views: 'desc' },
      take: limit,
    })
    console.log('[getTopPosts] count=', rows.length)
    return rows.map((r) => ({ slug: r.slug, section: r.section, views: r.views, unique: r.uniqueViews }))
  },
  ['top-posts'],
  { revalidate: 300, tags: ['top-posts'] },
)

export async function getActiveReaders(slug: string): Promise<number> {
  const since = new Date(Date.now() - PRESENCE_WINDOW_MS)
  const n = await prisma.activeReader.count({
    where: { slug, lastPing: { gt: since } },
  })
  console.log('[getActiveReaders]', slug, '=', n)
  return n
}

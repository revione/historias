'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { recordHit } from '@/lib/analytics/actions'

export function HitTracker() {
  const pathname = usePathname()

  useEffect(() => {
    if (!pathname) return
    console.log('[client] recordHit', pathname)
    recordHit(pathname).catch((e) => console.error('[client] recordHit fail', e))
  }, [pathname])

  return null
}

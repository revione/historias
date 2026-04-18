'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { Lang } from './stories'

const STORAGE_KEY = 'historias-lang'
const DEFAULT_LANG: Lang = 'es'

interface LanguageContextValue {
  lang: Lang
  setLang: (lang: Lang) => void
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: DEFAULT_LANG,
  setLang: () => {},
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Lang | null
    if (stored && (['es', 'de', 'en'] as Lang[]).includes(stored)) {
      setLangState(stored)
    }
  }, [])

  function setLang(next: Lang) {
    setLangState(next)
    localStorage.setItem(STORAGE_KEY, next)
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}

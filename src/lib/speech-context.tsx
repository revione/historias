'use client'

import { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react'

export type SpeechLang = 'es' | 'de' | 'en'

export type SpeechConfig = {
  rate: number
  voiceURI: string | null
}

type SpeechState = {
  playing: boolean
  paused: boolean
  title: string
  progress: number
  duration: number
  currentSentenceIndex: number
  charIndex: number
  fullText: string
}

type SpeechCtx = {
  state: SpeechState
  config: SpeechConfig
  voices: SpeechSynthesisVoice[]
  speak: (text: string, lang: SpeechLang, title?: string) => void
  pause: () => void
  resume: () => void
  stop: () => void
  seekTo: (progress: number) => void
  seekToSentence: (index: number) => void
  setConfig: (c: Partial<SpeechConfig>) => void
  langVoices: (lang: SpeechLang) => SpeechSynthesisVoice[]
  // Refs for components that need live progress without re-rendering
  liveProgressRef: React.MutableRefObject<number>
  liveCharIndexRef: React.MutableRefObject<number>
  liveFullTextRef: React.MutableRefObject<string>
}

const Ctx = createContext<SpeechCtx | null>(null)

const LOCALE: Record<SpeechLang, string> = { es: 'es', de: 'de', en: 'en' }
const STORAGE_KEY = 'speech-config'
const DEFAULT_CONFIG: SpeechConfig = { rate: 1, voiceURI: null }
const CHARS_PER_SEC = 14  // ~140 wpm × ~6 chars/word / 60

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?¿¡])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 0)
}

function loadConfig(): SpeechConfig {
  if (typeof window === 'undefined') return DEFAULT_CONFIG
  try {
    const s = localStorage.getItem(STORAGE_KEY)
    return s ? { ...DEFAULT_CONFIG, ...JSON.parse(s) } : DEFAULT_CONFIG
  } catch { return DEFAULT_CONFIG }
}

function estimateDuration(chars: number, rate: number): number {
  return chars / (CHARS_PER_SEC * rate)
}

export function SpeechProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SpeechState>({ playing: false, paused: false, title: '', progress: 0, duration: 0, currentSentenceIndex: -1, charIndex: 0, fullText: '' })
  const [config, setConfigState] = useState<SpeechConfig>(loadConfig)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])

  const configRef       = useRef(config)
  const voicesRef       = useRef(voices)
  const langRef         = useRef<SpeechLang>('es')
  const queueRef        = useRef<string[]>([])
  const activeRef       = useRef(false)
  const allChunks       = useRef<string[]>([])
  const totalChars      = useRef(0)
  const spokenChars     = useRef(0)
  const activeUtterance = useRef<SpeechSynthesisUtterance | null>(null)
  const sentenceIdxRef  = useRef(0)
  const liveProgressRef = useRef(0)
  const liveCharIndexRef = useRef(0)
  const liveFullTextRef = useRef('')

  useEffect(() => { configRef.current = config }, [config])
  useEffect(() => { voicesRef.current = voices }, [voices])

  useEffect(() => {
    const load = () => setVoices(speechSynthesis.getVoices())
    load()
    speechSynthesis.addEventListener('voiceschanged', load)
    return () => speechSynthesis.removeEventListener('voiceschanged', load)
  }, [])

  function getVoice(): SpeechSynthesisVoice | null {
    const locale = LOCALE[langRef.current]
    const all = voicesRef.current
    const uri = configRef.current.voiceURI
    return (
      (uri ? all.find(v => v.voiceURI === uri) : null) ??
      all.find(v => v.lang.startsWith(locale)) ??
      all[0] ??
      null
    )
  }

  const playNext = useCallback(() => {
    if (!activeRef.current || queueRef.current.length === 0) {
      activeRef.current = false
      setState(s => ({ ...s, playing: false, paused: false }))
      return
    }

    const chunk = queueRef.current.shift()!
    const charsBeforeChunk = spokenChars.current
    const total = totalChars.current
    const rate = configRef.current.rate

    const u = new SpeechSynthesisUtterance(chunk)
    u.rate = rate
    const voice = getVoice()
    if (voice) u.voice = voice

    activeUtterance.current = u

    u.addEventListener('boundary', (e: SpeechSynthesisEvent) => {
      if (activeUtterance.current !== u || !total) return
      const globalChar = charsBeforeChunk + e.charIndex
      const p = Math.min(globalChar / total, 1)
      liveCharIndexRef.current = globalChar
      liveProgressRef.current = p
      setState(s => ({
        ...s,
        progress: p,
        duration: estimateDuration(total, rate),
        charIndex: globalChar,
      }))
    })

    u.onend = () => {
      if (activeUtterance.current !== u) return
      spokenChars.current = charsBeforeChunk + chunk.length
      sentenceIdxRef.current++
      setState(s => ({
        ...s,
        progress: total > 0 ? spokenChars.current / total : 0,
        currentSentenceIndex: sentenceIdxRef.current,
      }))
      playNext()
    }

    u.onerror = (e: SpeechSynthesisErrorEvent) => {
      // 'canceled'/'interrupted' = we called cancel() intentionally (seek/stop), not a real error
      if (e.error === 'canceled' || e.error === 'interrupted') return
      activeRef.current = false
      setState(s => ({ ...s, playing: false, paused: false }))
    }

    speechSynthesis.speak(u)
  }, []) // all mutable state via refs — stable

  const speak = useCallback((text: string, lang: SpeechLang, title = '') => {
    speechSynthesis.cancel()
    activeRef.current = false
    const chunks = splitSentences(text)
    if (chunks.length === 0) return
    const chars = chunks.reduce((s, c) => s + c.length, 0)
    langRef.current = lang
    allChunks.current = chunks
    totalChars.current = chars
    spokenChars.current = 0
    queueRef.current = [...chunks]
    activeRef.current = true
    sentenceIdxRef.current = 0
    liveCharIndexRef.current = 0
    liveProgressRef.current = 0
    liveFullTextRef.current = text
    setState({
      playing: true,
      paused: false,
      title,
      progress: 0,
      duration: estimateDuration(chars, configRef.current.rate),
      currentSentenceIndex: 0,
      charIndex: 0,
      fullText: text,
    })
    playNext()
  }, [playNext])

  const pause = useCallback(() => {
    speechSynthesis.pause()
    setState(s => ({ ...s, paused: true }))
  }, [])

  const resume = useCallback(() => {
    speechSynthesis.resume()
    setState(s => ({ ...s, paused: false }))
  }, [])

  const stop = useCallback(() => {
    activeRef.current = false
    activeUtterance.current = null
    queueRef.current = []
    speechSynthesis.cancel()
    liveCharIndexRef.current = 0
    liveProgressRef.current = 0
    liveFullTextRef.current = ''
    setState({ playing: false, paused: false, title: '', progress: 0, duration: 0, currentSentenceIndex: -1, charIndex: 0, fullText: '' })
  }, [])

  const seekTo = useCallback((targetProgress: number) => {
    const chunks = allChunks.current
    if (chunks.length === 0) return
    const total = totalChars.current
    const target = Math.floor(Math.max(0, Math.min(1, targetProgress)) * total)

    let offset = 0
    let idx = 0
    for (let i = 0; i < chunks.length; i++) {
      if (offset + chunks[i].length > target) { idx = i; break }
      offset += chunks[i].length
      idx = i + 1
    }
    idx = Math.min(idx, chunks.length - 1)

    // Null out active utterance BEFORE cancel so onend/onerror guards fire correctly
    activeUtterance.current = null
    speechSynthesis.cancel()

    spokenChars.current = offset
    sentenceIdxRef.current = idx
    queueRef.current = chunks.slice(idx)
    activeRef.current = true
    liveCharIndexRef.current = offset
    liveProgressRef.current = total > 0 ? offset / total : 0
    setState(s => ({
      ...s,
      playing: true,
      paused: false,
      progress: total > 0 ? offset / total : 0,
      currentSentenceIndex: idx,
      charIndex: offset,
    }))

    // Tiny delay: some browsers need a tick after cancel before accepting new speak()
    setTimeout(() => {
      if (activeRef.current) playNext()
    }, 50)
  }, [playNext])

  const seekToSentence = useCallback((index: number) => {
    const chunks = allChunks.current
    if (chunks.length === 0 || index < 0 || index >= chunks.length) return
    const total = totalChars.current
    let offset = 0
    for (let i = 0; i < index; i++) offset += chunks[i].length
    seekTo(total > 0 ? offset / total : 0)
  }, [seekTo])

  const setConfig = useCallback((c: Partial<SpeechConfig>) => {
    setConfigState(prev => {
      const next = { ...prev, ...c }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      configRef.current = next
      if (c.rate !== undefined && totalChars.current > 0) {
        setState(s => ({ ...s, duration: estimateDuration(totalChars.current, next.rate) }))
      }
      return next
    })
  }, [])

  const langVoices = useCallback((lang: SpeechLang) => {
    return voicesRef.current.filter(v => v.lang.startsWith(LOCALE[lang]))
  }, [])

  useEffect(() => {
    function handler(e: Event) {
      const detail = (e as CustomEvent).detail
      if (typeof detail === 'number') seekTo(detail)
    }
    window.addEventListener('seek-to', handler)
    return () => window.removeEventListener('seek-to', handler)
  }, [seekTo])

  return (
    <Ctx.Provider value={{ state, config, voices, speak, pause, resume, stop, seekTo, seekToSentence, setConfig, langVoices, liveProgressRef, liveCharIndexRef, liveFullTextRef }}>
      {children}
    </Ctx.Provider>
  )
}

export function useSpeech() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useSpeech outside SpeechProvider')
  return ctx
}

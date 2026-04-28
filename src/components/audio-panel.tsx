'use client'

import { useState, useRef } from 'react'
import { useSpeech, type SpeechLang } from '@/lib/speech-context'
import { useLanguage } from '@/lib/language-context'
import styles from './audio-panel.module.css'

function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds))
  const m = Math.floor(s / 60)
  const ss = s % 60
  return `${m}:${ss.toString().padStart(2, '0')}`
}

export function AudioPanel() {
  const { state, config, setConfig, pause, resume, stop, seekTo, langVoices } = useSpeech()
  const { lang } = useLanguage()
  const [dragging, setDragging] = useState(false)
  const dragValue = useRef(0)
  const [localProgress, setLocalProgress] = useState(0)

  if (!state.playing && !state.paused) return null

  const voices = langVoices(lang as SpeechLang)
  const displayProgress = dragging ? localProgress : state.progress
  const currentTime = displayProgress * state.duration
  const totalTime = state.duration

  function handleProgressChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = parseFloat(e.target.value)
    dragValue.current = val
    setLocalProgress(val)
  }

  function handleProgressPointerDown() {
    dragValue.current = state.progress
    setLocalProgress(state.progress)
    setDragging(true)
  }

  function handleProgressPointerUp() {
    setDragging(false)
    seekTo(dragValue.current)
  }

  return (
    <div className={styles.panel}>
      <div className={styles.mainRow}>
        <div className={styles.info}>
          <span className={`${styles.dot} ${state.paused ? styles.dotPaused : styles.dotPlaying}`} />
          <span className={styles.title}>{state.title || '—'}</span>
        </div>

        <div className={styles.controls}>
          <button
            className={styles.btn}
            onClick={state.paused ? resume : pause}
            title={state.paused ? 'reanudar' : 'pausar'}
          >
            {state.paused ? '▶' : '⏸'}
          </button>
          <button className={styles.btn} onClick={stop} title="detener">
            ■
          </button>
        </div>

        <div className={styles.settings}>
          <span className={styles.rateLabel}>{config.rate.toFixed(1)}×</span>
          <input
            className={styles.slider}
            type="range"
            min={0.5}
            max={2}
            step={0.1}
            value={config.rate}
            onChange={e => setConfig({ rate: parseFloat(e.target.value) })}
            title="velocidad"
          />
          {voices.length > 1 && (
            <select
              className={styles.voiceSelect}
              value={config.voiceURI ?? ''}
              onChange={e => setConfig({ voiceURI: e.target.value || null })}
            >
              <option value="">auto</option>
              {voices.map(v => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className={styles.progressRow}>
        <span className={styles.timeLabel}>{formatTime(currentTime)}</span>
        <input
          className={styles.progressBar}
          type="range"
          min={0}
          max={1}
          step={0.001}
          value={displayProgress}
          style={{ '--progress': displayProgress } as React.CSSProperties}
          onChange={handleProgressChange}
          onPointerDown={handleProgressPointerDown}
          onPointerUp={handleProgressPointerUp}
          title="posición"
        />
        <span className={styles.timeLabel}>{formatTime(totalTime)}</span>
      </div>
    </div>
  )
}

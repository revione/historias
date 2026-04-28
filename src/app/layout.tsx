import type { Metadata } from 'next'
import { LanguageProvider } from '@/lib/language-context'
import { SpeechProvider } from '@/lib/speech-context'
import { AudioPanel } from '@/components/audio-panel'
import './globals.css'

export const metadata: Metadata = {
  title: 'Historial de historias',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <LanguageProvider>
          <SpeechProvider>
            {children}
            <AudioPanel />
          </SpeechProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}

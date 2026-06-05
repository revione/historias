import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { LanguageProvider } from '@/lib/language-context'
import { SpeechProvider } from '@/lib/speech-context'
import { AudioPanel } from '@/components/audio-panel'
import { SiteFooter } from '@/components/site-footer'
import { HitTracker } from '@/components/hit-tracker'
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
            <SiteFooter />
            <AudioPanel />
            <HitTracker />
            <Analytics />
          </SpeechProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}

import type { Metadata } from 'next'
import { LanguageProvider } from '@/lib/language-context'
import './globals.css'

export const metadata: Metadata = {
  title: 'Historial de historias',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  )
}

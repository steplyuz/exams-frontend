import { Inter } from 'next/font/google'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/auth/auth-context'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'examx.steply.uz — Imtihon markazi',
  description: 'Ro\'yxatdan o\'tgan nomzod ID orqali kirib, Reading, Listening, Writing va Speaking imtihonlarini topshiring.',
}

export const viewport: Viewport = { colorScheme: 'light', themeColor: '#0F172A' }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uz" className="bg-background">
      <body className={inter.variable}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}

import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AISEARCH ELITE',
  description: 'AI-powered universal search platform with semantic understanding',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 antialiased">{children}</body>
    </html>
  )
}

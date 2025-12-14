import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Campaign Ally - AI Co-Pilot for Dungeon Masters',
  description: 'An AI-powered campaign management tool for D&D Dungeon Masters',
  icons: {
    icon: '/favicon.ico',
    apple: '/images/favicon-256.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}

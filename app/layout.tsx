import type { Metadata } from 'next'
import { Cinzel, DM_Sans, JetBrains_Mono } from 'next/font/google'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/contexts/auth-context'
import './globals.css'

// Arcane Artifact Design System fonts
const cinzel = Cinzel({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Campaign Ally — The AI Co-Pilot That Actually Knows Your World',
  description: 'Campaign-aware AI for D&D 5e Dungeon Masters. Forge NPCs, locations, quests, and sessions that connect to your world automatically. Stop generating generic filler.',
  keywords: ['D&D', 'DM tools', 'campaign management', 'AI dungeon master', 'NPC generator', 'world building', 'tabletop RPG'],
  authors: [{ name: 'Campaign Ally' }],
  creator: 'Campaign Ally',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://campaignally.ai',
    siteName: 'Campaign Ally',
    title: 'Campaign Ally — The AI Co-Pilot That Actually Knows Your World',
    description: 'Stop generating generic filler. Campaign Ally remembers your NPCs, tracks your factions, and connects your lore automatically.',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Campaign Ally - AI-Powered Campaign Management',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Campaign Ally — The AI Co-Pilot That Actually Knows Your World',
    description: 'Campaign-aware AI for D&D 5e Dungeon Masters. Forge NPCs, locations, quests, and sessions that connect to your world automatically.',
    images: ['/images/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
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
    <html lang="en" className={`dark ${cinzel.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}>
      <body className="font-body antialiased">
        <AuthProvider>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: 'hsl(222.2 84% 4.9%)',
                border: '1px solid hsl(217.2 32.6% 17.5%)',
                color: 'hsl(210 40% 98%)',
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  )
}

import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/contexts/auth-context'
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
      <body className="font-sans antialiased">
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

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { SessionProvider } from '@/components/session-provider'
import Navbar from '@/components/navbar'
import { auth } from '@/lib/auth'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'maki',
    template: '%s | maki',
  },
  description: 'Платформа для читання ранобє, новел та книг онлайн. Читайте улюблені історії безкоштовно.',
  keywords: ['ranobe', 'light novel', 'новели', 'ранобє', 'книги', 'читання', 'онлайн'],
  authors: [{ name: 'maki' }],
  creator: 'maki',
  openGraph: {
    type: 'website',
    locale: 'uk_UA',
    url: 'https://ranobehub.com',
    siteName: 'maki',
    title: 'maki',
    description: 'Платформа для читання ранобє, новел та книг онлайн',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'maki',
    description: 'Платформа для читання ранобє, новел та книг онлайн',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  return (
    <html lang="uk" suppressHydrationWarning>
      <body className={inter.className}>
        <SessionProvider session={session}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Navbar />
            <main className="min-h-screen">{children}</main>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  )
}

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { SessionProvider } from '@/components/session-provider'
import Navbar from '@/components/navbar'
import Footer from '@/components/footer'
import { auth } from '@/lib/auth'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'honni',
    template: '%s | honni',
  },
  description: 'Платформа для читання ранобє, новел та книг онлайн. Читайте улюблені історії безкоштовно.',
  keywords: ['ranobe', 'light novel', 'новели', 'ранобє', 'книги', 'читання', 'онлайн'],
  authors: [{ name: 'honni' }],
  creator: 'honni',
  openGraph: {
    type: 'website',
    locale: 'uk_UA',
    url: 'https://honni.com',
    siteName: 'honni',
    title: 'honni',
    description: 'Платформа для читання ранобє, новел та книг онлайн',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'honni',
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
            <Navbar session={session} />
            <main className="min-h-screen">{children}</main>
            <Footer />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  )
}

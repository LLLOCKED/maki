import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { SessionProvider } from '@/components/session-provider'
import Navbar from '@/components/navbar'
import Footer from '@/components/footer'
import Heartbeat from '@/components/heartbeat'
import { auth } from '@/lib/auth'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://honni.fun'),
  title: {
    default: 'honni',
    template: '%s | honni',
  },
  description: 'honni — платформа для читання ранобе, новел та фанфіків українською онлайн. Безкоштовно читайте улюблені авторські роботи та переклади новел.',
  keywords: [
    'ranobe', 'ранобе', 'light novel', 'новели', 'новела', 'книги', 'читання', 'онлайн',
    'аніме', 'манга', 'манхва', 'веброман', 'веб новела', ' ранобе українською',
    'фанфіки', 'фанфік', 'фік', 'авторські роботи', 'ориджинал', 'переклад', 'читати безкоштовно',
    '电子书籍', 'رومان', 'نور小说', '轻小说', 'romantasy',
  ],
  authors: [{ name: 'honni' }],
  creator: 'honni',
  openGraph: {
    type: 'website',
    locale: 'uk_UA',
    url: 'https://honni.fun',
    siteName: 'honni.fun',
    title: 'honni — читати ранобе та новели онлайн',
    description: 'Платформа для читання ранобе, новел та фанфіків українською. Безкоштовні переклади та авторські роботи.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'honni — читати ранобе та новели онлайн',
    description: 'Платформа для читання ранобе, новел та фанфіків українською. Безкоштовні переклади та авторські роботи.',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/favicon.ico',
  },
  alternates: {
    canonical: 'https://honni.fun',
  },
  verification: {
    google: 'PfCf0hRz-mqJ2_PxBmm3Gc12tV-JLdcirm8cTAjsYds',
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
      <body suppressHydrationWarning>
        <SessionProvider session={session}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Navbar session={session} />
            <main className="min-h-screen">{children}</main>
            <Heartbeat />
            <Footer />
            <ToastContainer position="top-center" />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  )
}

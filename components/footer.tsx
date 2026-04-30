import Link from 'next/link'
import { Github, Send, Mail } from 'lucide-react'
import ThemeToggle from './theme-toggle'

export default function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex flex-col items-center gap-2 md:items-start">
            <p className="text-xs text-muted-foreground max-w-xs text-center md:text-left">
              honni.fun — українська веб-платформа для читання ранобе, новел та літератури онлайн. Кожен може додати власний тайтл або долучитися до перекладу.
            </p>
            <div className="flex items-center gap-2">
              <img src="/static/images/icon.png" alt="honni" width={32} height={32} />
              <span className="text-sm text-muted-foreground">© 2026 honni</span>
            </div>
            <a
              href="mailto:support@honni.fun"
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <Mail className="h-4 w-4" />
              support@honni.fun
            </a>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground">
              Контакти
            </Link>
            <Link href="/rules" className="text-sm text-muted-foreground hover:text-foreground">
              Правила
            </Link>
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
              Правовласникам
            </Link>
            <ThemeToggle />
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="https://github.com/LLLOCKED/maki"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground"
            >
              <Github className="h-5 w-5" />
            </Link>
            <Link
              href="https://t.me/maki_reading"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground"
            >
              <Send className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

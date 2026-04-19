import Link from 'next/link'
import { Github, Send, Mail } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex flex-col items-center gap-2 md:items-start">
            <span className="text-sm text-muted-foreground">© 2026 honni</span>
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

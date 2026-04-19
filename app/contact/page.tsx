import { Mail, Send } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Зворотній зв&apos;язок</h1>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-muted-foreground">
              Напишіть нам на електронну пошту:
            </p>
            <a
              href="mailto:support@honni.fun"
              className="text-lg font-medium text-primary hover:underline"
            >
              support@honni.fun
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Telegram
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-muted-foreground">
              Або напишіть нам у Telegram:
            </p>
            <a
              href="https://t.me/maki_reading"
              target="_blank"
              rel="noopener noreferrer"
              className="text-lg font-medium text-primary hover:underline"
            >
              @maki_reading
            </a>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Часті питання</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <div>
            <p className="font-medium text-foreground">Якщо ви правовласник?</p>
            <p>Напишіть нам на email з посиланням на контент та вашими контактними даними. Ми розглянемо запит найближчим часом.</p>
          </div>
          <div>
            <p className="font-medium text-foreground">Якщо хочете співпрацювати?</p>
            <p>Напишіть нам на email або в Telegram з описом вашої пропозиції.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

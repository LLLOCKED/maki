import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Правовласникам | Для правовласників',
  description: 'Інформація для правовласників щодо авторських прав на контент сайту honni',
}

export default function PrivacyPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Головна</Link>
        <span>/</span>
        <span>Правовласникам</span>
      </div>

      <h1 className="mb-6 text-3xl font-bold">Правовласникам</h1>

      <div className="space-y-6 text-sm leading-relaxed">
        <p className="text-muted-foreground">
          <a href="https://honni.fun" className="text-primary hover:underline">honni.fun</a> — це платформа для любителів ранобе та манги, де користувачі можуть читати та ділитися перекладами з іншими членами спільноти.
        </p>

        <p>
          Якщо Ви помітили матеріал на нашому сайті, що порушує Ваші авторські права,
          або іншим чином дотичне до Вас, будь ласка, зв&apos;яжіться з нами для розв&apos;язання
          цього питання. Для цього потрібно відправити листа на нашу електронну пошту.
        </p>

        <p>У листі має міститися:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>Посилання на спірний матеріал нашого сайту</li>
          <li>Контактні дані для зв&apos;язку з Вами</li>
          <li>Завірені копії документів, що підтверджують Ваше право на матеріал</li>
        </ul>

        <p className="font-medium">
          Адреса нашої електронної пошти: <a href="mailto:support@honni.fun" className="text-primary hover:underline">support@honni.fun</a>
        </p>

        <p>
          Ваш лист та пред&apos;явлені документи будуть перевірені в найкоротші терміни,
          та з Вами зв&apos;яжуться для урегулювання питання. Увесь контент на нашому сайті
          отриманий з відкритих джерел та не для продажу, а служить тільки в ознайомчих цілях.
        </p>

        <hr className="my-8" />

        <h2 className="text-xl font-semibold">Про сервіс</h2>
        <p>
          honni — це платформа для любителів ранобе та манги, де користувачі можуть
          читати та ділитися перекладами з іншими членами спільноти.
        </p>

        <h2 className="text-xl font-semibold">Підтримка боротьби з нелегальним контентом</h2>
        <p>
          На жаль, не можна виключити випадки, коли користувачі можуть за допомогою
          сайту незаконно зберігати, передавати, поширювати та надавати доступ до
          інформації та об&apos;єктів інтелектуальної власності.
        </p>
        <p>
          Адміністрація сайту не вправі приймати на себе функції правоохоронних або судових
          органів і об&apos;єктивно не в змозі оцінити, чи є той чи інший контент, розміщений
          на сайті, законним чи ні. У разі виникнення спірної ситуації заявникові слід
          звертатися до правоохоронних органів та суду.
        </p>

        <h2 className="text-xl font-semibold">Законність</h2>
        <p>
          Адміністрація сайту дотримується законодавства та не здійснює контроль і цензуру
          відносин, пов&apos;язаних із застосуванням користувачами технічних можливостей сайту.
          Користувачі мають право відповідно до законодавства вільно використовувати
          можливості сайту для обміну інформацією, в тому числі в рамках обговорення
          творчості улюблених авторів та виконавців.
        </p>

        <h2 className="text-xl font-semibold">Захист авторських прав</h2>
        <p>
          Ми дотримуємося Закону про захист авторських прав в цифрову епоху (DMCA) та
          інших чинних законів про авторські права і швидко видаляємо неправомірно
          розміщені переклади, отримавши відповідне повідомлення про порушення прав.
        </p>

        <h2 className="text-xl font-semibold">Повідомлення про порушення авторських прав</h2>
        <p>
          Якщо Ви вважаєте, що переклад манги на нашому сайті порушує Ваші авторські права,
          Ви можете написати повідомлення про порушення прав та відправити його на адресу
          <a href="mailto:support@honni.fun" className="text-primary hover:underline"> support@honni.fun</a>. Ми, у свою чергу, зобов&apos;язуємося здійснити блокування
          переліченого в повідомленні матеріалу.
        </p>
      </div>

      <hr className="my-8" />

      <h2 className="mb-4 text-2xl font-bold">For Rights Holders</h2>

      <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
        <p>
          <a href="https://honni.fun" className="text-primary hover:underline">honni.fun</a> is a platform for ranobe and manga enthusiasts, where users can read and share translations with other community members.
        </p>

        <p>
          If you have found material on our website that infringes your copyright or is otherwise relevant to you, please contact us to resolve this issue. You can do so by sending an email to our contact address.
        </p>

        <p>The email must include:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>Link to the disputed material on our website</li>
          <li>Contact information for us to reach you</li>
          <li>Certified copies of documents confirming your rights to the material</li>
        </ul>

        <p className="font-medium">
          Our email address: <a href="mailto:support@honni.fun" className="text-primary hover:underline">support@honni.fun</a>
        </p>

        <p>
          Your email and submitted documents will be reviewed promptly and we will contact you to resolve the issue. All content on our website is obtained from open sources and is not for sale — it serves only informational and educational purposes.
        </p>

        <hr className="my-8" />

        <h2 className="text-xl font-semibold text-foreground">About the Service</h2>
        <p>
          honni is a platform for ranobe and manga enthusiasts where users can read and share translations with other community members.
        </p>

        <h2 className="text-xl font-semibold text-foreground">Supporting the Fight Against Illegal Content</h2>
        <p>
          Unfortunately, we cannot exclude cases where users may illegally store, transmit, distribute, or provide access to information and intellectual property through our website.
        </p>
        <p>
          The website administration is not authorized to assume the functions of law enforcement or judicial bodies and is objectively unable to evaluate whether any content posted on the website is legal or not. In case of a dispute, the complainant should contact law enforcement agencies and courts.
        </p>

        <h2 className="text-xl font-semibold text-foreground">Legality</h2>
        <p>
          The website administration complies with legislation and does not control or censor relationships related to users&apos; use of the website&apos;s technical capabilities. Users have the right in accordance with legislation to freely use the website&apos;s features for information exchange, including in the context of discussing the work of their favorite authors and performers.
        </p>

        <h2 className="text-xl font-semibold text-foreground">Copyright Protection</h2>
        <p>
          We comply with the Digital Millennium Copyright Act (DMCA) and other applicable copyright laws and promptly remove unlawfully posted translations upon receiving a proper notice of infringement.
        </p>

        <h2 className="text-xl font-semibold text-foreground">Reporting Copyright Infringement</h2>
        <p>
          If you believe that a manga translation on our website infringes your copyright, you may write a notice of infringement and send it to <a href="mailto:support@honni.fun" className="text-primary hover:underline">support@honni.fun</a>. We, in turn, undertake to block the materials listed in the notice.
        </p>
      </div>
    </div>
  )
}

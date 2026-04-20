import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = process.env.EMAIL_FROM || 'noreply@ranobehub.com'
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${BASE_URL}/api/auth/verify-email?token=${token}`

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Підтвердження реєстрації | RanobeHub',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #6366f1;">Ласкаво просимо до RanobeHub!</h2>
        <p>Дякуємо за реєстрацію. Натисніть кнопку нижче, щоб підтвердити свою електронну адресу:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}" style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Підтвердити пошту</a>
        </div>
        <p style="color: #666; font-size: 14px;">Або скопіюйте посилання в адресний рядок браузера:</p>
        <p style="color: #666; font-size: 14px; word-break: break-all;">${verifyUrl}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">Якщо ви не реєструвалися на RanobeHub, просто ігноруйте цей лист.</p>
      </div>
    `,
  })
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${BASE_URL}/reset-password?token=${token}`

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Скидання пароля | RanobeHub',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #6366f1;">Скидання пароля</h2>
        <p>Ви запросили скидання пароля для свого облікового запису. Натисніть кнопку нижче, щоб встановити новий пароль:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Скинути пароль</a>
        </div>
        <p style="color: #666; font-size: 14px;">Або скопіюйте посилання в адресний рядок браузера:</p>
        <p style="color: #666; font-size: 14px; word-break: break-all;">${resetUrl}</p>
        <p style="color: #e11; font-size: 14px;">Посилання діє протягом 1 години.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">Якщо ви не запитували скидання пароля, просто ігноруйте цей лист.</p>
      </div>
    `,
  })
}

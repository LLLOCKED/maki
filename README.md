# RanobeHub

Платформа для чтения ранобэ и новелл.

## Технологии

- **Framework:** Next.js 14+ (App Router, TypeScript)
- **Auth:** NextAuth.js v5 с Google провайдером
- **Database:** SQLite через Prisma ORM (для разработки)
- **Styling:** Tailwind CSS + next-themes
- **UI:** Shadcn UI + lucide-react
- **Markdown:** react-markdown + remark-gfm

## Запуск

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка переменных окружения

```bash
cp .env.example .env
```

Заполните `.env`:
- `DATABASE_URL` — строка подключения к SQLite: `file:./dev.db`
- `AUTH_GOOGLE_ID` — Google OAuth Client ID
- `AUTH_GOOGLE_SECRET` — Google OAuth Client Secret
- `AUTH_SECRET` — секрет для NextAuth (можно сгенерировать: `openssl rand -base64 32`)

### 3. Настройка базы данных

```bash
# Генерация Prisma клиента
npm run db:generate

# Применение миграций
npm run db:push

# (Опционально) Заполнение тестовыми данными
npx tsx prisma/seed.ts
```

### 4. Запуск

```bash
npm run dev
```

Откройте http://localhost:3000

## Структура проекта

```
/app
  /api
    /auth/[...nextauth] — NextAuth API роуты
    /chapters/[id]     — API для получения главы
    /novels            — API для списка новелл
    /novels/[slug]     — API для страницы новеллы
  /novel/[slug]        — Страница новеллы
  /read/[slug]/[chapter] — Читалка
  layout.tsx           — Корневой layout
  page.tsx            — Главная страница

/components
  /ui                 — Shadcn UI компоненты
  novel-card.tsx       — Карточка новеллы
  reader-client.tsx    — Клиентская часть читалки
  reader-settings.tsx  — Настройки читалки
  navbar.tsx           — Навигация
  theme-provider.tsx   — Провайдер темы

/lib
  auth.ts             — NextAuth конфигурация
  prisma.ts           — Prisma клиент
  utils.ts            — Утилиты (cn)

/prisma
  schema.prisma       — Схема базы данных
  seed.ts             — Сидер для тестовых данных
```

## Функции

- Главная страница с каталогом новелл
- Страница новеллы со списком глав
- Читалка с поддержкой Markdown
- Настройки ридера: размер шрифта, темы (светлая/тёмная/сепия)
- Навигация между главами
- Адаптивная вёрстка (mobile-first)
- Авторизация через Google

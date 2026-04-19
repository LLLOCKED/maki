# RanobeHub

Платформа для читання ранобе та новел.

## Технології

- **Framework:** Next.js 14+ (App Router, TypeScript)
- **Auth:** NextAuth.js v5 з Google провайдером
- **Database:** PostgreSQL через Prisma ORM
- **Styling:** Tailwind CSS + next-themes
- **UI:** Shadcn UI + lucide-react
- **Markdown:** react-markdown + remark-gfm

## Запуск

### 1. Встановлення залежностей

```bash
npm install
```

### 2. Налаштування змінних оточення

```bash
cp .env.example .env
```

Заповніть `.env`:
- `DATABASE_URL` — рядок підключення до PostgreSQL: `postgresql://user:password@localhost:5432/honni`
- `AUTH_GOOGLE_ID` — Google OAuth Client ID
- `AUTH_GOOGLE_SECRET` — Google OAuth Client Secret
- `AUTH_SECRET` — секрет для NextAuth (можна згенерувати: `openssl rand -base64 32`)

### 3. Налаштування бази даних

```bash
# Генерація Prisma клієнта
npm run db:generate

# Застосування міграцій
npm run db:push
```

### 4. Запуск

```bash
npm run dev
```

Відкрийте http://localhost:3000

## Структура проекту

```
/app
  /api
    /auth/[...nextauth] — NextAuth API роути
    /chapters          — API для глав
    /novels            — API для новел
    /moderation        — API для модерації
  /admin              — Адмін панель
  /catalog            — Каталог з фільтрами
  /contact            — Сторінка контактів
  /novel/[slug]      — Сторінка новелли
  /read/[slug]/[chapter] — Читалка
  /team/[id]         — Сторінка команди
  layout.tsx         — Корневий layout
  page.tsx            — Головна сторінка

/components
  /ui                 — Shadcn UI компоненти
  /admin              — Admin компоненти
  novel-card.tsx       — Карточка новелли
  reader-client.tsx    — Клієнтська частина читалки
  reader-settings.tsx  — Налаштування читалки
  navbar.tsx           — Навігація
  catalog-filters.tsx  — Фільтри каталогу
  theme-provider.tsx   — Провайдер теми

/lib
  auth.ts             — NextAuth конфігурація
  prisma.ts           — Prisma клієнт
  novels.ts           — Утіліти для роботи з новеллами

/prisma
  schema.prisma       — Схема бази даних
```

## Функціонал

- Головна сторінка з новими тайтлами
- Каталог з фільтрами (жанри, теги, автори, тип, статус, рік)
- Сторінка новелли зі списком глав
- Читалка з підтримкою Markdown
- Налаштування читалки: розмір шрифта, теми (світла/темна/сепія)
- Навігація між главами
- Підтримка команд перекладачів
- Система модерації (OWNER, ADMIN, MODERATOR, USER)
- Адаптивна верстка (mobile-first)
- Авторизація через Google
- Закладки
- Рейтинги
- Форум

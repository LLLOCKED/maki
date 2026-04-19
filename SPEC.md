# RanobeHub — Novel Reading Platform

## 1. Project Overview

**Type:** Full-stack Web Application (Next.js)
**Core functionality:** A platform for reading ranobe/novels with chapter navigation, user accounts, and customizable reading experience.
**Target users:** Readers of light novels and ranobe who prefer web-based reading.

---

## 2. Technology Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14+ (App Router, TypeScript) |
| Auth | NextAuth.js v5 with Google Provider |
| Database | PostgreSQL via Prisma ORM |
| Styling | Tailwind CSS + next-themes |
| UI Components | Shadcn UI |
| Icons | lucide-react |
| Markdown | react-markdown + remark-gfm |

---

## 3. Data Models (Prisma Schema)

### Relationships
```
User 1──∞ Account
User 1──∞ Novel (favorites)
Novel ∞──∞ Genre
Novel 1──∞ Chapter
```

### Models
- **User** — id, name, email, image, createdAt, accounts, favorites
- **Account** — id, userId, type, provider, providerAccountId, refresh_token, etc. (NextAuth)
- **Novel** — id, title, description, coverUrl, author, slug, averageRating, createdAt, updatedAt, chapters[], genres[]
- **Chapter** — id, title, number, content (Markdown), novelId, createdAt, updatedAt
- **Genre** — id, name, slug, novels[]

---

## 4. Feature List

### Pages
1. **Home Page** (`/`)
   - Grid of novel cards
   - Each card: cover image, title, author, rating (stars), genre tags
   - Responsive: 1 col (mobile) → 2 cols (tablet) → 3-4 cols (desktop)

2. **Novel Page** (`/novel/[slug]`)
   - Novel header: cover, title, author, description, rating
   - Genre tags
   - Chapter list (ordered by number)
   - "Start Reading" button → first chapter

3. **Reader Page** (`/read/[slug]/[chapter]`)
   - Full-width reading area
   - Markdown content rendering
   - Settings panel (font size, theme)
   - Navigation: Previous / Next chapter buttons
   - Progress indicator (Chapter X of Y)

### Reader Settings
- **Font size:** Small (16px), Medium (18px), Large (22px), Extra Large (26px)
- **Themes:** Light, Dark, Sepia

### Auth
- Google OAuth via NextAuth
- Protected favorites (stored per user)

---

## 5. API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chapters/[id]` | Get chapter content by ID |
| GET | `/api/novels` | List all novels |
| GET | `/api/novels/[slug]` | Get novel details + chapters |

---

## 6. UI/UX Design Direction

### Visual Style
- Shadcn UI components (clean, accessible)
- Card-based layout with subtle shadows
- Rounded corners (8-12px)

### Color Schemes
- **Light:** White background (#ffffff), dark text
- **Dark:** Dark gray background (#1a1a2e), light text
- **Sepia:** Warm beige background (#f4ecd8), brown text

### Typography
- Headings: Inter or system sans-serif
- Reader body: Georgia or system serif (for readability)

### Responsive Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

---

## 7. File Structure

```
/app
  /api/auth/[...nextauth]/route.ts
  /api/chapters/[id]/route.ts
  /api/novels/route.ts
  /api/novels/[slug]/route.ts
  /novel/[slug]/page.tsx
  /read/[slug]/[chapter]/page.tsx
  /layout.tsx
  /page.tsx
/components
  /ui (shadcn components)
  /novel-card.tsx
  /chapter-list.tsx
  /reader-settings.tsx
  /theme-provider.tsx
/lib
  /prisma.ts
  /auth.ts
/prisma
  /schema.prisma
```

---

## 8. Implementation Priority

1. [x] Project setup with Next.js, TypeScript, Tailwind
2. [x] Prisma schema and database setup
3. [x] NextAuth.js configuration with Google provider
4. [x] Theme provider with next-themes
5. [x] Shadcn UI components setup
6. [x] Home page with novel cards
7. [x] Novel detail page
8. [x] Reader page with markdown rendering
9. [x] Reader settings (font size, theme)
10. [x] Chapter navigation API

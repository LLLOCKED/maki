# RanobeHub — Novel Reading Platform

## 1. Project Overview

**Type:** Full-stack Web Application (Next.js)
**Core functionality:** A platform for reading ranobe/novels with chapter navigation, user accounts, teams, moderation system, and customizable reading experience.
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

### Models
- **User** — id, name, email, image, role, createdAt, accounts, favorites, teamMemberships
- **Account** — NextAuth OAuth accounts
- **Session** — NextAuth sessions
- **Novel** — id, title, originalName, slug, description, coverUrl, type, status, translationStatus, releaseYear, averageRating, viewCount, moderationStatus, authorId
- **Chapter** — id, title, number, content, novelId, teamId, moderationStatus
- **Genre** — id, name, slug
- **Tag** — id, name, slug
- **Author** — id, name
- **Publisher** — id, name
- **Team** — id, name, description
- **TeamMembership** — userId, teamId, role
- **Comment** — for novels and chapters
- **Rating** — user rating for novels
- **Bookmark** — user bookmarks (reading, planned, etc.)
- **ForumCategory** — forum categories
- **ForumTopic** — forum topics with votes
- **ForumComment** — forum comments with nesting

### Novel Types
- **ORIGINAL** — Авторський тайтл. Створюється користувачем, який стає автором. Тільки він може додавати розділи. Не використовує команди чи переклад.
- **JAPAN/KOREA/CHINA/ENGLISH** — Перекладений тайтл. Розділи додаються командою перекладачів. Потребує прив'язки до команди.

### Moderation
- Novel, Chapter have `moderationStatus` (PENDING, APPROVED, REJECTED)
- User has `role` (OWNER, ADMIN, MODERATOR, USER)

---

## 4. Feature List

### Pages
1. **Home Page** (`/`)
   - New titles (posters)
   - Popular novels
   - Discussed novels
   - Forum topics

2. **Catalog Page** (`/catalog`)
   - Filters: genres, tags, authors, type, status, translation status, year range
   - Sorting: by title, rating, views, year, creation date
   - Case-insensitive search

3. **Novel Page** (`/novel/[slug]`)
   - Novel header: cover, title, original name, description, rating
   - Genre tags
   - Chapter list grouped by team
   - "Start Reading" button → first chapter
   - Admins see pending chapters with badge

4. **Reader Page** (`/read/[slug]/[chapter]`)
   - Full-width reading area
   - Markdown content rendering
   - Settings panel (font size, theme)
   - Translation selector (when multiple teams)
   - Navigation: Previous / Next chapter buttons
   - Progress indicator (Chapter X of Y)
   - Team members can view pending chapters

5. **Team Page** (`/team/[id]`)
   - Team info and members
   - Chapters grouped by novel
   - Pending chapters visible to team members

6. **Admin Panel** (`/admin`)
   - Pending novels queue
   - Pending chapters queue
   - Approve/Reject functionality

7. **Contact Page** (`/contact`)
   - Email: support@honni.fun
   - Telegram link

### User Features
- Google OAuth authentication
- Bookmarks (reading, planned, completed, dropped)
- Ratings (1-5 stars)
- Forum topics and comments
- Team memberships

### Reader Settings
- **Font size:** Small (16px), Medium (18px), Large (22px), Extra Large (26px)
- **Themes:** Light, Dark, Sepia

---

## 5. API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/novels` | List novels with filters |
| POST | `/api/novels` | Create novel (sets authorId for ORIGINAL type) |
| POST | `/api/chapters` | Create chapter (author only for ORIGINAL, team member for translations) |
| GET | `/api/moderation` | Get pending counts |
| PATCH | `/api/moderation/novels/[id]` | Approve/reject novel |
| PATCH | `/api/moderation/chapters/[id]` | Approve/reject chapter |
| GET | `/api/forum/topics` | Forum topics |

---

## 6. UI/UX Design Direction

### Visual Style
- Shadcn UI components (clean, accessible)
- Card-based layout with subtle shadows
- Rounded corners (8-12px)

### Color Schemes
- **Light:** White background, dark text
- **Dark:** Dark gray background, light text
- **Sepia:** Warm beige background, brown text

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
  /api
    /auth/[...nextauth]/route.ts
    /chapters/route.ts
    /novels/route.ts
    /moderation/...
    /forum/...
  /admin
    /page.tsx
    /novels/page.tsx
    /chapters/page.tsx
  /catalog/page.tsx
  /contact/page.tsx
  /novel/[slug]/page.tsx
  /read/[slug]/[chapter]/page.tsx
  /team/[id]/page.tsx
  /bookmarks/page.tsx
  /forum/...
  /layout.tsx
  /page.tsx
/components
  /ui (shadcn components)
  /admin (admin components)
  novel-card.tsx
  horizontal-novel-card.tsx
  chapter-list.tsx
  chapter-tabs.tsx
  reader-settings.tsx
  reader-client.tsx
  catalog-filters.tsx
  navbar.tsx
  footer.tsx
  theme-provider.tsx
/lib
  prisma.ts
  auth.ts
  novels.ts
/prisma
  schema.prisma
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
11. [x] User roles and moderation system
12. [x] Team pages and memberships
13. [x] Catalog page with filters
14. [x] Contact page
15. [x] PostgreSQL migration

---

## 9. Future Features (TODO.md)

1. Notifications for new chapters (bookmarks)
2. Team invite notifications
3. Edit rejected chapters and resubmit
4. Edit approved chapters (goes to re-moderation)
5. Email verification on registration

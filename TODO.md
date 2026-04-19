# TODO List — Future Features

## Inbox Notifications
1. **Повідомлення про нові розділи** — Якщо тайтл в закладках користувача, надсилати сповіщення коли виходить новий розділ
2. **Повідомлення про запрошення до команди** — Сповіщення коли користувача запрошують приєднатися до команди перекладачів

## Chapter Editing & Re-moderation
3. **Редагування відхиленого розділу** — Після відмови адміна можна відредагувати розділ і повторно відправити на схвалення
4. **Редагування схваленого розділу** — Після схвалення можна редагувати, але правки відправляються на повторну модерацію

## User Management
5. **Підтвердження пошти** — Потребують верифікацію email при реєстрації перед активацією акаунту

---

## Notes

### Email Verification
- Use unique token sent to email
- Token expires after 24h
- User cannot login until email verified
- Need email service integration (Resend, SendGrid, etc.)
- Add `emailVerified` field to User model (already exists in schema)
- Add resend verification email option

### Notifications System
- Create `Notification` model in DB
- Types: `NEW_CHAPTER`, `TEAM_INVITE`, `CHAPTER_APPROVED`, `CHAPTER_REJECTED`
- Store read/unread status
- Show notification badge in navbar
- Create notifications page

### Chapter Re-moderation Flow
- When editing APPROVED chapter, set `moderationStatus: 'PENDING'` again
- Store previous approved version until new one approved
- Notify admins about edited approved chapters
- Option to rollback to previous version
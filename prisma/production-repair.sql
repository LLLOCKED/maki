ALTER TABLE "NovelView"
ADD COLUMN IF NOT EXISTS "viewedDate" DATE NOT NULL DEFAULT CURRENT_DATE;

ALTER TABLE "NovelView"
DROP CONSTRAINT IF EXISTS "NovelView_novelId_ipAddress_key";

CREATE UNIQUE INDEX IF NOT EXISTS "NovelView_novelId_ipAddress_viewedDate_key"
ON "NovelView"("novelId", "ipAddress", "viewedDate");

CREATE INDEX IF NOT EXISTS "NovelView_viewedDate_idx"
ON "NovelView"("viewedDate");

DO $$ BEGIN
  CREATE TYPE "UserRole" AS ENUM ('OWNER', 'ADMIN', 'MODERATOR', 'USER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "TeamRole" AS ENUM ('owner', 'admin', 'member');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ModerationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "NovelType" AS ENUM ('JAPAN', 'KOREA', 'CHINA', 'ENGLISH', 'ORIGINAL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "NovelStatus" AS ENUM ('ONGOING', 'COMPLETED', 'SUSPENDED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "TranslationStatus" AS ENUM ('TRANSLATING', 'DROPPED', 'COMPLETED', 'HIATUS');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "BookmarkStatus" AS ENUM ('reading', 'planned', 'completed', 'dropped');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'User' AND column_name = 'role'
      AND udt_name <> 'UserRole'
  ) THEN
    ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
    ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole" USING "role"::"UserRole";
    ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'USER';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'TeamMembership' AND column_name = 'role'
      AND udt_name <> 'TeamRole'
  ) THEN
    ALTER TABLE "TeamMembership" ALTER COLUMN "role" DROP DEFAULT;
    ALTER TABLE "TeamMembership" ALTER COLUMN "role" TYPE "TeamRole" USING "role"::"TeamRole";
    ALTER TABLE "TeamMembership" ALTER COLUMN "role" SET DEFAULT 'member';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Novel' AND column_name = 'type'
      AND udt_name <> 'NovelType'
  ) THEN
    ALTER TABLE "Novel" ALTER COLUMN "type" DROP DEFAULT;
    ALTER TABLE "Novel" ALTER COLUMN "type" TYPE "NovelType" USING "type"::"NovelType";
    ALTER TABLE "Novel" ALTER COLUMN "type" SET DEFAULT 'ORIGINAL';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Novel' AND column_name = 'status'
      AND udt_name <> 'NovelStatus'
  ) THEN
    ALTER TABLE "Novel" ALTER COLUMN "status" DROP DEFAULT;
    ALTER TABLE "Novel" ALTER COLUMN "status" TYPE "NovelStatus" USING "status"::"NovelStatus";
    ALTER TABLE "Novel" ALTER COLUMN "status" SET DEFAULT 'ONGOING';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Novel' AND column_name = 'translationStatus'
      AND udt_name <> 'TranslationStatus'
  ) THEN
    ALTER TABLE "Novel" ALTER COLUMN "translationStatus" DROP DEFAULT;
    ALTER TABLE "Novel" ALTER COLUMN "translationStatus" TYPE "TranslationStatus" USING "translationStatus"::"TranslationStatus";
    ALTER TABLE "Novel" ALTER COLUMN "translationStatus" SET DEFAULT 'TRANSLATING';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Novel' AND column_name = 'moderationStatus'
      AND udt_name <> 'ModerationStatus'
  ) THEN
    ALTER TABLE "Novel" ALTER COLUMN "moderationStatus" DROP DEFAULT;
    ALTER TABLE "Novel" ALTER COLUMN "moderationStatus" TYPE "ModerationStatus" USING "moderationStatus"::"ModerationStatus";
    ALTER TABLE "Novel" ALTER COLUMN "moderationStatus" SET DEFAULT 'PENDING';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Chapter' AND column_name = 'moderationStatus'
      AND udt_name <> 'ModerationStatus'
  ) THEN
    ALTER TABLE "Chapter" ALTER COLUMN "moderationStatus" DROP DEFAULT;
    ALTER TABLE "Chapter" ALTER COLUMN "moderationStatus" TYPE "ModerationStatus" USING "moderationStatus"::"ModerationStatus";
    ALTER TABLE "Chapter" ALTER COLUMN "moderationStatus" SET DEFAULT 'PENDING';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ForumTopic' AND column_name = 'moderationStatus'
      AND udt_name <> 'ModerationStatus'
  ) THEN
    ALTER TABLE "ForumTopic" ALTER COLUMN "moderationStatus" DROP DEFAULT;
    ALTER TABLE "ForumTopic" ALTER COLUMN "moderationStatus" TYPE "ModerationStatus" USING "moderationStatus"::"ModerationStatus";
    ALTER TABLE "ForumTopic" ALTER COLUMN "moderationStatus" SET DEFAULT 'PENDING';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Bookmark' AND column_name = 'status'
      AND udt_name <> 'BookmarkStatus'
  ) THEN
    ALTER TABLE "Bookmark" ALTER COLUMN "status" TYPE "BookmarkStatus" USING "status"::"BookmarkStatus";
  END IF;
END $$;

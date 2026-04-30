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

ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole" USING "role"::"UserRole";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'USER';

ALTER TABLE "TeamMembership" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "TeamMembership" ALTER COLUMN "role" TYPE "TeamRole" USING "role"::"TeamRole";
ALTER TABLE "TeamMembership" ALTER COLUMN "role" SET DEFAULT 'member';

ALTER TABLE "Novel" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "Novel" ALTER COLUMN "type" TYPE "NovelType" USING "type"::"NovelType";
ALTER TABLE "Novel" ALTER COLUMN "type" SET DEFAULT 'ORIGINAL';

ALTER TABLE "Novel" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Novel" ALTER COLUMN "status" TYPE "NovelStatus" USING "status"::"NovelStatus";
ALTER TABLE "Novel" ALTER COLUMN "status" SET DEFAULT 'ONGOING';

ALTER TABLE "Novel" ALTER COLUMN "translationStatus" DROP DEFAULT;
ALTER TABLE "Novel" ALTER COLUMN "translationStatus" TYPE "TranslationStatus" USING "translationStatus"::"TranslationStatus";
ALTER TABLE "Novel" ALTER COLUMN "translationStatus" SET DEFAULT 'TRANSLATING';

ALTER TABLE "Novel" ALTER COLUMN "moderationStatus" DROP DEFAULT;
ALTER TABLE "Novel" ALTER COLUMN "moderationStatus" TYPE "ModerationStatus" USING "moderationStatus"::"ModerationStatus";
ALTER TABLE "Novel" ALTER COLUMN "moderationStatus" SET DEFAULT 'PENDING';

ALTER TABLE "Chapter" ALTER COLUMN "moderationStatus" DROP DEFAULT;
ALTER TABLE "Chapter" ALTER COLUMN "moderationStatus" TYPE "ModerationStatus" USING "moderationStatus"::"ModerationStatus";
ALTER TABLE "Chapter" ALTER COLUMN "moderationStatus" SET DEFAULT 'PENDING';

ALTER TABLE "ForumTopic" ALTER COLUMN "moderationStatus" DROP DEFAULT;
ALTER TABLE "ForumTopic" ALTER COLUMN "moderationStatus" TYPE "ModerationStatus" USING "moderationStatus"::"ModerationStatus";
ALTER TABLE "ForumTopic" ALTER COLUMN "moderationStatus" SET DEFAULT 'PENDING';

ALTER TABLE "Bookmark" ALTER COLUMN "status" TYPE "BookmarkStatus" USING "status"::"BookmarkStatus";

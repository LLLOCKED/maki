ALTER TYPE "ReportTargetType" ADD VALUE IF NOT EXISTS 'COMMENT';
ALTER TYPE "ReportTargetType" ADD VALUE IF NOT EXISTS 'FORUM_COMMENT';

ALTER TABLE "ContentReport" ADD COLUMN IF NOT EXISTS "commentId" TEXT;
ALTER TABLE "ContentReport" ADD COLUMN IF NOT EXISTS "forumCommentId" TEXT;

CREATE TABLE IF NOT EXISTS "CommentVote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CommentVote_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ForumCommentVote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ForumCommentVote_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CommentVote_userId_commentId_key" ON "CommentVote"("userId", "commentId");
CREATE INDEX IF NOT EXISTS "CommentVote_commentId_idx" ON "CommentVote"("commentId");
CREATE UNIQUE INDEX IF NOT EXISTS "ForumCommentVote_userId_commentId_key" ON "ForumCommentVote"("userId", "commentId");
CREATE INDEX IF NOT EXISTS "ForumCommentVote_commentId_idx" ON "ForumCommentVote"("commentId");
CREATE INDEX IF NOT EXISTS "ContentReport_commentId_idx" ON "ContentReport"("commentId");
CREATE INDEX IF NOT EXISTS "ContentReport_forumCommentId_idx" ON "ContentReport"("forumCommentId");

ALTER TABLE "CommentVote" ADD CONSTRAINT "CommentVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommentVote" ADD CONSTRAINT "CommentVote_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ForumCommentVote" ADD CONSTRAINT "ForumCommentVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ForumCommentVote" ADD CONSTRAINT "ForumCommentVote_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "ForumComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContentReport" ADD CONSTRAINT "ContentReport_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContentReport" ADD CONSTRAINT "ContentReport_forumCommentId_fkey" FOREIGN KEY ("forumCommentId") REFERENCES "ForumComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

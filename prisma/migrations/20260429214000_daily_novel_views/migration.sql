ALTER TABLE "NovelView"
ADD COLUMN "viewedDate" DATE NOT NULL DEFAULT CURRENT_DATE;

ALTER TABLE "NovelView"
DROP CONSTRAINT IF EXISTS "NovelView_novelId_ipAddress_key";

CREATE UNIQUE INDEX "NovelView_novelId_ipAddress_viewedDate_key"
ON "NovelView"("novelId", "ipAddress", "viewedDate");

CREATE INDEX "NovelView_viewedDate_idx"
ON "NovelView"("viewedDate");

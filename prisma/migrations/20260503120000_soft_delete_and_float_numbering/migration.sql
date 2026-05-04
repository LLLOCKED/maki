-- 1. Додаємо поле deletedAt до Новел
ALTER TABLE "Novel" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "Novel_deletedAt_idx" ON "Novel"("deletedAt");

-- 2. Додаємо поле deletedAt до Глав та змінюємо тип номера на Float (DOUBLE PRECISION)
ALTER TABLE "Chapter" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "Chapter" ALTER COLUMN "number" TYPE DOUBLE PRECISION;
CREATE INDEX IF NOT EXISTS "Chapter_deletedAt_idx" ON "Chapter"("deletedAt");

-- 3. Очищення неявного зв'язку UserFavorites (залишаємо лише явну модель Favorite)
DROP TABLE IF EXISTS "_UserFavorites";

-- 4. Переконаємось, що індекси для Novel та Chapter існують (на випадок якщо db push їх не створив)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Novel_deletedAt_idx') THEN
    CREATE INDEX "Novel_deletedAt_idx" ON "Novel"("deletedAt");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Chapter_deletedAt_idx') THEN
    CREATE INDEX "Chapter_deletedAt_idx" ON "Chapter"("deletedAt");
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "TeamFollow" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "teamId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "TeamFollow_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "TeamFollow_userId_teamId_key" ON "TeamFollow"("userId", "teamId");
CREATE INDEX IF NOT EXISTS "TeamFollow_teamId_idx" ON "TeamFollow"("teamId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'TeamFollow_userId_fkey'
  ) THEN
    ALTER TABLE "TeamFollow" ADD CONSTRAINT "TeamFollow_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'TeamFollow_teamId_fkey'
  ) THEN
    ALTER TABLE "TeamFollow" ADD CONSTRAINT "TeamFollow_teamId_fkey"
    FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

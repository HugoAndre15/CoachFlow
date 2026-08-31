CREATE TYPE "match_presence_status" AS ENUM ('UNKNOWN', 'PRESENT', 'UNCERTAIN', 'ABSENT');

ALTER TABLE "match_players"
ADD COLUMN "presence" "match_presence_status" NOT NULL DEFAULT 'UNKNOWN';

-- Existing entries were created through the old composition screen, so they
-- represent players who were considered available for their match.
UPDATE "match_players" SET "presence" = 'PRESENT';

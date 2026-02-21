-- CreateEnum
CREATE TYPE "opponent_event_type" AS ENUM ('GOAL', 'YELLOW_CARD', 'RED_CARD');

-- CreateTable
CREATE TABLE "opponent_match_events" (
    "id" TEXT NOT NULL,
    "match_id" TEXT NOT NULL,
    "event_type" "opponent_event_type" NOT NULL,
    "minute" INTEGER NOT NULL,
    "jersey_number" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "opponent_match_events_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "opponent_match_events" ADD CONSTRAINT "opponent_match_events_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

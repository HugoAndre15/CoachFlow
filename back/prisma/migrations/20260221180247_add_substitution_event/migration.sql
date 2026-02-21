-- AlterEnum
ALTER TYPE "match_event_type" ADD VALUE 'SUBSTITUTION';

-- AlterTable
ALTER TABLE "MatchEvent" ADD COLUMN     "related_player_id" TEXT;

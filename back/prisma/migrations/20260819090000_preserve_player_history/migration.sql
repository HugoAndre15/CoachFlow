-- Prevent accidental player deletion from erasing match history.
ALTER TABLE "MatchEvent" DROP CONSTRAINT "MatchEvent_player_id_fkey";

ALTER TABLE "MatchEvent"
ADD CONSTRAINT "MatchEvent_player_id_fkey"
FOREIGN KEY ("player_id") REFERENCES "Player"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

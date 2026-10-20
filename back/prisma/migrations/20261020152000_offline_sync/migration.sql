CREATE TABLE "OfflineReceipt" (
  "id" TEXT PRIMARY KEY,
  "match_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "request_hash" TEXT NOT NULL,
  "result" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OfflineReceipt_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "Match"("id") ON DELETE CASCADE
);
CREATE INDEX "OfflineReceipt_match_id_idx" ON "OfflineReceipt"("match_id");

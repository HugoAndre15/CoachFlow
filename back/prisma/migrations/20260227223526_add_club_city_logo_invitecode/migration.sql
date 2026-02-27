/*
  Warnings:

  - A unique constraint covering the columns `[invite_code]` on the table `Club` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Club" ADD COLUMN     "city" TEXT,
ADD COLUMN     "invite_code" TEXT,
ADD COLUMN     "logo_url" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Club_invite_code_key" ON "Club"("invite_code");

/*
  Warnings:

  - You are about to drop the column `logo_url` on the `Club` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Club" DROP COLUMN "logo_url",
ADD COLUMN     "logo" TEXT;

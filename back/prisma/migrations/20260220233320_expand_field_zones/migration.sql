-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "field_zone" ADD VALUE 'DEF_LEFT';
ALTER TYPE "field_zone" ADD VALUE 'DEF_CENTER';
ALTER TYPE "field_zone" ADD VALUE 'DEF_RIGHT';
ALTER TYPE "field_zone" ADD VALUE 'MID_LEFT';
ALTER TYPE "field_zone" ADD VALUE 'MID_CENTER';
ALTER TYPE "field_zone" ADD VALUE 'MID_RIGHT';
ALTER TYPE "field_zone" ADD VALUE 'ATT_LEFT';
ALTER TYPE "field_zone" ADD VALUE 'ATT_CENTER';
ALTER TYPE "field_zone" ADD VALUE 'ATT_RIGHT';

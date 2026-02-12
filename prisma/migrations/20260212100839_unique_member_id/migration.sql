/*
  Warnings:

  - A unique constraint covering the columns `[uniqueMemberId]` on the table `Membership` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Membership" ADD COLUMN     "uniqueMemberId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Membership_uniqueMemberId_key" ON "Membership"("uniqueMemberId");

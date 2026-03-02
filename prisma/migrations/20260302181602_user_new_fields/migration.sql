/*
  Warnings:

  - A unique constraint covering the columns `[phone]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "OtpVerification_target_idx";

-- AlterTable
ALTER TABLE "OtpVerification" ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "verified" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "firstname" TEXT,
ADD COLUMN     "lastname" TEXT,
ADD COLUMN     "phone" TEXT;

-- CreateIndex
CREATE INDEX "OtpVerification_target_type_idx" ON "OtpVerification"("target", "type");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

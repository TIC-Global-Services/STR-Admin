/*
  Warnings:

  - You are about to drop the column `aadharNumber` on the `Membership` table. All the data in the column will be lost.
  - You are about to drop the column `address` on the `Membership` table. All the data in the column will be lost.
  - You are about to drop the column `instagramId` on the `Membership` table. All the data in the column will be lost.
  - You are about to drop the column `xTwitterId` on the `Membership` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[aadhaarNumber]` on the table `Membership` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `Membership` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[phone]` on the table `Membership` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `aadhaarNumber` to the `Membership` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ageConfirm` to the `Membership` table without a default value. This is not possible if the table is not empty.
  - Added the required column `agreeTerms` to the `Membership` table without a default value. This is not possible if the table is not empty.
  - Added the required column `city` to the `Membership` table without a default value. This is not possible if the table is not empty.
  - Added the required column `country` to the `Membership` table without a default value. This is not possible if the table is not empty.
  - Added the required column `membershipType` to the `Membership` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Membership_aadharNumber_key";

-- DropIndex
DROP INDEX "Membership_email_idx";

-- DropIndex
DROP INDEX "Membership_phone_idx";

-- AlterTable
ALTER TABLE "Membership" DROP COLUMN "aadharNumber",
DROP COLUMN "address",
DROP COLUMN "instagramId",
DROP COLUMN "xTwitterId",
ADD COLUMN     "aadhaarNumber" TEXT NOT NULL,
ADD COLUMN     "ageConfirm" BOOLEAN NOT NULL,
ADD COLUMN     "agreeTerms" BOOLEAN NOT NULL,
ADD COLUMN     "chapterLead" TEXT,
ADD COLUMN     "chapterLocation" TEXT,
ADD COLUMN     "city" TEXT NOT NULL,
ADD COLUMN     "country" TEXT NOT NULL,
ADD COLUMN     "existingClub" TEXT,
ADD COLUMN     "fanClubName" TEXT,
ADD COLUMN     "fanDuration" TEXT,
ADD COLUMN     "favoriteMovie" TEXT,
ADD COLUMN     "favoriteSong" TEXT,
ADD COLUMN     "membershipType" TEXT NOT NULL,
ADD COLUMN     "socialHandle" TEXT,
ADD COLUMN     "tshirtSize" TEXT,
ADD COLUMN     "willingToJoin" TEXT,
ALTER COLUMN "occupation" DROP NOT NULL,
ALTER COLUMN "zone" DROP NOT NULL,
ALTER COLUMN "district" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Membership_aadhaarNumber_key" ON "Membership"("aadhaarNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_email_key" ON "Membership"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_phone_key" ON "Membership"("phone");

-- CreateIndex
CREATE INDEX "Membership_state_idx" ON "Membership"("state");

-- CreateIndex
CREATE INDEX "Membership_district_idx" ON "Membership"("district");

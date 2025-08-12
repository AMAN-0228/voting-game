/*
  Warnings:

  - Added the required column `sno` to the `Round` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."RoundStatus" AS ENUM ('pending', 'finished');

-- AlterTable
ALTER TABLE "public"."Round" ADD COLUMN     "sno" INTEGER NOT NULL,
ADD COLUMN     "status" "public"."RoundStatus" NOT NULL DEFAULT 'pending';

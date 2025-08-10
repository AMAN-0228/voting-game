/*
  Warnings:

  - You are about to drop the `_RoomPlayers` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Room" DROP CONSTRAINT "Room_hostId_fkey";

-- DropForeignKey
ALTER TABLE "public"."_RoomPlayers" DROP CONSTRAINT "_RoomPlayers_A_fkey";

-- DropForeignKey
ALTER TABLE "public"."_RoomPlayers" DROP CONSTRAINT "_RoomPlayers_B_fkey";

-- AlterTable
ALTER TABLE "public"."Room" ADD COLUMN     "playerIds" TEXT[];

-- DropTable
DROP TABLE "public"."_RoomPlayers";

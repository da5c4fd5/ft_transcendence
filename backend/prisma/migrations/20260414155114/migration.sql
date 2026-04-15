/*
  Warnings:

  - You are about to drop the column `bio` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "bio",
ADD COLUMN     "isAdmin" BOOLEAN NOT NULL DEFAULT false;

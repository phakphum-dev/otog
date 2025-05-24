/*
  Warnings:

  - You are about to drop the column `libraryMetadata` on the `problem` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "problem" DROP COLUMN "libraryMetadata",
ADD COLUMN     "attachmentMetadata" JSONB;

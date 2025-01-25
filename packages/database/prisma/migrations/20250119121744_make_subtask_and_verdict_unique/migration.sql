/*
  Warnings:

  - A unique constraint covering the columns `[submissionResultId,subtaskIndex]` on the table `subtaskResult` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[subtaskId,testcaseIndex]` on the table `verdict` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `testcaseIndex` to the `verdict` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "verdict" ADD COLUMN     "testcaseIndex" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "subtaskResult_submissionResultId_subtaskIndex_key" ON "subtaskResult"("submissionResultId", "subtaskIndex");

-- CreateIndex
CREATE UNIQUE INDEX "verdict_subtaskId_testcaseIndex_key" ON "verdict"("subtaskId", "testcaseIndex");

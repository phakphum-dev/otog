/*
  Warnings:

  - Made the column `show` on table `announcement` required. This step will fail if there are existing NULL values in that column.
  - Made the column `name` on table `contest` required. This step will fail if there are existing NULL values in that column.
  - Made the column `timeStart` on table `contest` required. This step will fail if there are existing NULL values in that column.
  - Made the column `timeEnd` on table `contest` required. This step will fail if there are existing NULL values in that column.
  - Made the column `name` on table `problem` required. This step will fail if there are existing NULL values in that column.
  - Made the column `score` on table `problem` required. This step will fail if there are existing NULL values in that column.
  - Made the column `timeLimit` on table `problem` required. This step will fail if there are existing NULL values in that column.
  - Made the column `memoryLimit` on table `problem` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userId` on table `submission` required. This step will fail if there are existing NULL values in that column.
  - Made the column `problemId` on table `submission` required. This step will fail if there are existing NULL values in that column.
  - Made the column `result` on table `submission` required. This step will fail if there are existing NULL values in that column.
  - Made the column `language` on table `submission` required. This step will fail if there are existing NULL values in that column.
  - Made the column `public` on table `submission` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "announcement" ALTER COLUMN "show" SET NOT NULL;

-- AlterTable
ALTER TABLE "chat" ALTER COLUMN "creationDate" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "updateDate" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "contest" ALTER COLUMN "name" SET NOT NULL,
ALTER COLUMN "timeStart" SET NOT NULL,
ALTER COLUMN "timeEnd" SET NOT NULL;

-- AlterTable
ALTER TABLE "problem" ALTER COLUMN "name" SET NOT NULL,
ALTER COLUMN "score" SET NOT NULL,
ALTER COLUMN "timeLimit" SET NOT NULL,
ALTER COLUMN "memoryLimit" SET NOT NULL;

-- AlterTable
ALTER TABLE "refreshToken" ALTER COLUMN "creationDate" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "updateDate" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "submission" ALTER COLUMN "userId" SET NOT NULL,
ALTER COLUMN "problemId" SET NOT NULL,
ALTER COLUMN "result" SET NOT NULL,
ALTER COLUMN "language" SET NOT NULL,
ALTER COLUMN "creationDate" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "updateDate" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "public" SET NOT NULL;

-- AlterTable
ALTER TABLE "user" ALTER COLUMN "creationDate" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "updateDate" SET DEFAULT CURRENT_TIMESTAMP;

-- AddForeignKey
ALTER TABLE "announcement" ADD CONSTRAINT "announcement_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "contest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

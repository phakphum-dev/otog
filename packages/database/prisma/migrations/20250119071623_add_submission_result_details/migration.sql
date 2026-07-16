-- CreateEnum
CREATE TYPE "enum_verdict_status" AS ENUM ('ACCEPTED', 'PARTIAL', 'REJECTED', 'TIME_LIMIT_EXCEEDED', 'RUNTIME_ERROR', 'SKIPPED', 'PROBLEM_ERROR', 'INTERNAL_ERROR');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "enum_submission_status" ADD VALUE 'compileError';
ALTER TYPE "enum_submission_status" ADD VALUE 'judgeError';

-- CreateTable
CREATE TABLE "submissionResult" (
    "id" SERIAL NOT NULL,
    "submissionId" INTEGER NOT NULL,
    "result" VARCHAR(255) NOT NULL,
    "errmsg" TEXT,
    "score" INTEGER NOT NULL,
    "timeUsed" INTEGER NOT NULL,
    "memUsed" INTEGER NOT NULL,

    CONSTRAINT "submissionResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subtaskResult" (
    "id" SERIAL NOT NULL,
    "submissionResultId" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "fullScore" INTEGER NOT NULL,
    "subtaskIndex" INTEGER NOT NULL,

    CONSTRAINT "subtaskResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verdict" (
    "id" SERIAL NOT NULL,
    "subtaskId" INTEGER NOT NULL,
    "status" "enum_verdict_status" NOT NULL,
    "percent" DOUBLE PRECISION NOT NULL,
    "timeUsed" INTEGER NOT NULL,
    "memUsed" INTEGER NOT NULL,

    CONSTRAINT "verdict_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "submissionResult_submissionId_key" ON "submissionResult"("submissionId");

-- AddForeignKey
ALTER TABLE "submissionResult" ADD CONSTRAINT "submissionResult_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subtaskResult" ADD CONSTRAINT "subtaskResult_submissionResultId_fkey" FOREIGN KEY ("submissionResultId") REFERENCES "submissionResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verdict" ADD CONSTRAINT "verdict_subtaskId_fkey" FOREIGN KEY ("subtaskId") REFERENCES "subtaskResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;

-- update status
UPDATE submission SET status = 'compileError' WHERE result = 'Compilation Error';
UPDATE submission SET status = 'judgeError' WHERE result = 'Judge Error';
UPDATE submission SET status = 'judgeError' WHERE result = 'No Testcases.';
UPDATE submission SET status = 'judgeError' WHERE result = 'No nCase';
UPDATE submission SET status = 'judgeError' WHERE result = 'No Testcase';
UPDATE submission SET status = 'judgeError' WHERE result = 'Problem Error';
UPDATE submission SET status = 'judgeError' WHERE result = 'Invalid nCase';
UPDATE submission SET status = 'judgeError' WHERE result = 'Solution missing';
UPDATE submission SET status = 'judgeError' WHERE result = 'Input missing';
UPDATE submission SET status = 'judgeError' WHERE result ~ '!';

-- migrate to new table
INSERT INTO "submissionResult" ("submissionId", "result", "score", "timeUsed", "errmsg", "memUsed") SELECT "id", "result", "score", "timeUsed", "errmsg", -1 FROM "submission";

-- drop old columns
ALTER TABLE "submission" DROP COLUMN "result";
ALTER TABLE "submission" DROP COLUMN "score";
ALTER TABLE "submission" DROP COLUMN "timeUsed";
ALTER TABLE "submission" DROP COLUMN "errmsg";

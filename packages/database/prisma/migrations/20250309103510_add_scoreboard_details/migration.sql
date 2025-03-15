-- Delete all submissions that are not related to any contest

DELETE FROM submission WHERE ("contestId" NOT IN (SELECT id FROM contest) AND "contestId" IS NOT NULL);

COMMIT;

-- CreateEnum
CREATE TYPE "enum_scoreboard_policy" AS ENUM ('DURING_CONTEST', 'AFTER_CONTEST', 'NOT_VISIBLE');

-- AlterTable
ALTER TABLE "contest" ADD COLUMN     "scoreboardPolicy" "enum_scoreboard_policy" NOT NULL DEFAULT 'AFTER_CONTEST',
ALTER COLUMN "announce" SET DATA TYPE TEXT;

COMMIT;

-- AlterTable
ALTER TABLE "contest" ALTER COLUMN "scoreboardPolicy" DROP DEFAULT;

-- CreateTable
CREATE TABLE "contestScore" (
    "id" SERIAL NOT NULL,
    "contestId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "problemId" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "latestSubmission" TIMESTAMPTZ(6),

    CONSTRAINT "contestScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contestScoreHistory" (
    "contestScoreId" INTEGER NOT NULL,
    "submissionId" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,

    CONSTRAINT "contestScoreHistory_pkey" PRIMARY KEY ("submissionId")
);

-- CreateIndex
CREATE UNIQUE INDEX "contestScore_contestId_userId_problemId_key" ON "contestScore"("contestId", "userId", "problemId");

-- AddForeignKey
ALTER TABLE "submission" ADD CONSTRAINT "submission_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contestScore" ADD CONSTRAINT "contestScore_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contestScore" ADD CONSTRAINT "contestScore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contestScore" ADD CONSTRAINT "contestScore_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contestScoreHistory" ADD CONSTRAINT "contestScoreHistory_contestScoreId_fkey" FOREIGN KEY ("contestScoreId") REFERENCES "contestScore"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contestScoreHistory" ADD CONSTRAINT "contestScoreHistory_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;

-- Migrate Old Submission

-- Create ContestScore
WITH "RankedSubmissions" AS (
    SELECT 
        s."id" AS "submissionId",
        s."contestId", 
        s."userId", 
        s."problemId", 
        sres."score", 
        s."creationDate",
        ROW_NUMBER() OVER (PARTITION BY s."contestId", s."userId", s."problemId" ORDER BY s."creationDate" DESC) AS "row_num"
    FROM "submission" s
    JOIN "submissionResult" sres ON s."id" = sres."submissionId"
    WHERE s."contestId" IS NOT NULL
)
INSERT INTO "contestScore" ("contestId", "userId", "problemId", "score", "latestSubmission")
SELECT 
    rs."contestId", 
    rs."userId", 
    rs."problemId", 
    rs."score",
    rs."creationDate"
FROM "RankedSubmissions" rs
WHERE rs."row_num" = 1
ON CONFLICT ("contestId", "userId", "problemId") DO NOTHING;

COMMIT;

-- Create Contest History
WITH "OrderedSubmissions" AS (
    SELECT 
        s."id" AS "submissionId", 
        s."contestId", 
        s."userId", 
        s."problemId", 
        sr."score",
        s."creationDate",
        cs."id" AS "contestScoreId"
    FROM "submission" s
    JOIN "submissionResult" sr ON s."id" = sr."submissionId"
    JOIN "contestScore" cs 
        ON s."contestId" = cs."contestId" 
        AND s."userId" = cs."userId" 
        AND s."problemId" = cs."problemId"
    WHERE s."contestId" IS NOT NULL
    ORDER BY s."creationDate"
)
INSERT INTO "contestScoreHistory" ("contestScoreId", "submissionId", "score")
SELECT "contestScoreId", "submissionId", "score" FROM "OrderedSubmissions";
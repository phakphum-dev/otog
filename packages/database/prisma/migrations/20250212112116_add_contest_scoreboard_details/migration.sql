-- Delete all submissions that are not related to any contest

DELETE FROM submission WHERE ("contestId" NOT IN (SELECT id FROM contest) AND "contestId" IS NOT NULL);

COMMIT;

-- CreateTable
CREATE TABLE "contestScore" (
    "id" SERIAL NOT NULL,
    "contestId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "problemId" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,

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

-- CreateEnum
CREATE TYPE "enum_contest_gradingMode" AS ENUM ('acm', 'classic');

-- CreateEnum
CREATE TYPE "enum_contest_mode" AS ENUM ('rated', 'unrated');

-- CreateEnum
CREATE TYPE "enum_submission_status" AS ENUM ('waiting', 'grading', 'accept', 'reject');

-- CreateEnum
CREATE TYPE "enum_user_role" AS ENUM ('user', 'admin');

-- CreateTable
CREATE TABLE "announcement" (
    "id" SERIAL NOT NULL,
    "value" JSONB,
    "show" BOOLEAN NOT NULL DEFAULT false,
    "contestId" INTEGER,

    CONSTRAINT "announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat" (
    "id" SERIAL NOT NULL,
    "message" VARCHAR(255) NOT NULL,
    "userId" INTEGER NOT NULL,
    "creationDate" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updateDate" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contest" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255),
    "mode" "enum_contest_mode" NOT NULL,
    "gradingMode" "enum_contest_gradingMode" NOT NULL,
    "timeStart" TIMESTAMPTZ(6) NOT NULL,
    "timeEnd" TIMESTAMPTZ(6) NOT NULL,
    "announce" VARCHAR(255),

    CONSTRAINT "contest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contestProblem" (
    "contestId" INTEGER NOT NULL,
    "problemId" INTEGER NOT NULL,

    CONSTRAINT "contestProblem_pkey" PRIMARY KEY ("contestId","problemId")
);

-- CreateTable
CREATE TABLE "problem" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255),
    "sname" VARCHAR(255),
    "score" INTEGER,
    "timeLimit" INTEGER,
    "memoryLimit" INTEGER,
    "show" BOOLEAN NOT NULL,
    "recentShowTime" TIMESTAMPTZ(6),
    "case" VARCHAR(255),
    "rating" INTEGER,
    "examples" JSONB,

    CONSTRAINT "problem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refreshToken" (
    "id" VARCHAR(255) NOT NULL,
    "userId" INTEGER,
    "jwtId" VARCHAR(255),
    "used" BOOLEAN DEFAULT false,
    "expiryDate" TIMESTAMPTZ(6),
    "creationDate" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updateDate" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submission" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "problemId" INTEGER,
    "result" VARCHAR(255) DEFAULT 'WAITING',
    "score" INTEGER,
    "timeUsed" INTEGER,
    "status" "enum_submission_status" NOT NULL,
    "errmsg" TEXT,
    "contestId" INTEGER,
    "sourceCode" TEXT,
    "language" VARCHAR(255),
    "creationDate" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updateDate" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "public" BOOLEAN DEFAULT false,

    CONSTRAINT "submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(255) NOT NULL,
    "showName" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255),
    "password" VARCHAR(255) NOT NULL,
    "role" "enum_user_role" NOT NULL,
    "rating" INTEGER,
    "creationDate" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updateDate" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "userContest" (
    "userId" INTEGER NOT NULL,
    "contestId" INTEGER NOT NULL,
    "rank" INTEGER,
    "ratingAfterUpdate" INTEGER,

    CONSTRAINT "userContest_pkey" PRIMARY KEY ("userId","contestId")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_username_key" ON "user"("username");

-- CreateIndex
CREATE UNIQUE INDEX "user_showName_key" ON "user"("showName");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- AddForeignKey
ALTER TABLE "chat" ADD CONSTRAINT "chat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contestProblem" ADD CONSTRAINT "contestProblem_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contestProblem" ADD CONSTRAINT "contestProblem_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission" ADD CONSTRAINT "submission_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission" ADD CONSTRAINT "submission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "userContest" ADD CONSTRAINT "userContest_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES "contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "userContest" ADD CONSTRAINT "userContest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;


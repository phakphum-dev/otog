/*
  Warnings:

  - You are about to drop the `ProblemsOnBookshelves` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ProblemsOnBookshelves" DROP CONSTRAINT "ProblemsOnBookshelves_bookshelfId_fkey";

-- DropForeignKey
ALTER TABLE "ProblemsOnBookshelves" DROP CONSTRAINT "ProblemsOnBookshelves_problemId_fkey";

-- DropTable
DROP TABLE "ProblemsOnBookshelves";

-- CreateTable
CREATE TABLE "problemsOnBookshelves" (
    "problemId" INTEGER NOT NULL,
    "bookshelfId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "problemsOnBookshelves_pkey" PRIMARY KEY ("problemId","bookshelfId")
);

-- AddForeignKey
ALTER TABLE "problemsOnBookshelves" ADD CONSTRAINT "problemsOnBookshelves_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "problem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "problemsOnBookshelves" ADD CONSTRAINT "problemsOnBookshelves_bookshelfId_fkey" FOREIGN KEY ("bookshelfId") REFERENCES "bookshelf"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

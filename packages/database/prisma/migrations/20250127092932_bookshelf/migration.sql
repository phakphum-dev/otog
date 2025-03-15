-- CreateTable
CREATE TABLE "bookshelf" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "parentId" INTEGER,
    "creationDate" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateDate" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookshelf_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProblemsOnBookshelves" (
    "problemId" INTEGER NOT NULL,
    "bookshelfId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProblemsOnBookshelves_pkey" PRIMARY KEY ("problemId","bookshelfId")
);

-- AddForeignKey
ALTER TABLE "bookshelf" ADD CONSTRAINT "bookshelf_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "bookshelf"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProblemsOnBookshelves" ADD CONSTRAINT "ProblemsOnBookshelves_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "problem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProblemsOnBookshelves" ADD CONSTRAINT "ProblemsOnBookshelves_bookshelfId_fkey" FOREIGN KEY ("bookshelfId") REFERENCES "bookshelf"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

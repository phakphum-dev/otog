-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "enum_submission_status" ADD VALUE 'compileError';
ALTER TYPE "enum_submission_status" ADD VALUE 'judgeError';

COMMIT;

UPDATE submission SET status = 'compileError' WHERE result = 'Compilation Error';
UPDATE submission SET status = 'judgeError' WHERE result = 'Judge Error';
UPDATE submission SET status = 'judgeError' WHERE result ~ '!';
UPDATE submission SET status = 'judgeError' WHERE result = 'No Testcases.';
UPDATE submission SET status = 'judgeError' WHERE result = 'No nCase';
UPDATE submission SET status = 'judgeError' WHERE result = 'No Testcase';
UPDATE submission SET status = 'judgeError' WHERE result = 'Problem Error';
UPDATE submission SET status = 'judgeError' WHERE result = 'Invalid nCase';
UPDATE submission SET status = 'judgeError' WHERE result = 'Solution missing';
UPDATE submission SET status = 'judgeError' WHERE result = 'Input missing';
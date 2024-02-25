import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UploadedFilesObject } from './dto/problem.dto';
import {
  getProblemDocStream,
  removeProblemSource,
  updateProblemDoc,
  updateProblemTestCase,
} from 'src/utils/file.util';
import { PrismaService } from 'src/core/database/prisma.service';

import {
  FileFileManager,
  FileManager,
  S3FileManager,
} from 'src/core/fileManager';
import { Prisma, Problem, SubmissionStatus, User } from '@otog/database';
import { InjectS3 } from 'nestjs-s3';
import type { S3 } from 'nestjs-s3';
import { environment } from 'src/env';

type ProblemNoExample = Omit<Problem, 'example'>;
type PassedCount = { passedCount: number };
type LatestSubmission = {
  latestSubmissionId: number | null;
  status: SubmissionStatus | null;
};
type ProblemWithDetail = ProblemNoExample & PassedCount & LatestSubmission;
type PassedUser = Pick<
  User,
  'id' | 'role' | 'username' | 'showName' | 'rating'
>;

export const WITHOUT_EXAMPLE = {
  id: true,
  name: true,
  sname: true,
  score: true,
  timeLimit: true,
  memoryLimit: true,
  show: true,
  recentShowTime: true,
  case: true,
  rating: true,
};

@Injectable()
export class ProblemService {
  private fileManager: FileManager;

  constructor(
    @InjectS3() private readonly s3: S3,
    private readonly prisma: PrismaService,
  ) {
    this.fileManager = environment.USE_S3
      ? new S3FileManager(this.s3, 'otog-bucket')
      : new FileFileManager();
  }

  async create(
    problemData: Prisma.ProblemCreateInput,
    files: UploadedFilesObject,
  ) {
    try {
      const problem = await this.prisma.problem.create({
        data: {
          name: problemData.name,
          score: problemData.score,
          timeLimit: problemData.timeLimit,
          memoryLimit: problemData.memoryLimit,
          case: problemData.case,
          show: false,
        },
        select: WITHOUT_EXAMPLE,
      });
      if (files.pdf) {
        await updateProblemDoc(
          `${problem.id}`,
          // TODO: fix me
          files.pdf?.[0]?.path as string,
          this.fileManager,
        );
      }
      if (files.zip) {
        await updateProblemTestCase(
          `${problem.id}`,
          // TODO: fix me
          files.pdf?.[0]?.path as string,
          this.fileManager,
        );
      }
      return problem;
    } catch (err) {
      console.log(err);
      throw new BadRequestException();
    }
  }

  async replaceByProblemId(
    problemId: number,
    problemData: Prisma.ProblemUpdateInput,
    files: UploadedFilesObject,
  ) {
    try {
      const problem = await this.prisma.problem.update({
        data: {
          name: problemData.name,
          score: problemData.score,
          timeLimit: problemData.timeLimit,
          memoryLimit: problemData.memoryLimit,
          case: problemData.case,
        },
        where: { id: problemId },
        select: WITHOUT_EXAMPLE,
      });
      if (files.pdf) {
        await updateProblemDoc(
          `${problem.id}`,
          // TODO: fix me
          files.pdf?.[0]?.path as string,
          this.fileManager,
        );
      }
      if (files.zip) {
        await updateProblemTestCase(
          `${problem.id}`,
          // TODO: fix me
          files.pdf?.[0]?.path as string,
          this.fileManager,
        );
      }
      return problem;
    } catch (err) {
      throw new BadRequestException();
    }
  }

  async findOnlyShown() {
    return this.prisma.$queryRaw<Array<ProblemNoExample & PassedCount>>`
      SELECT "id", "name", "sname", "score", "timeLimit", "memoryLimit", "show", "recentShowTime", "case", "rating", COALESCE("passedCount", 0) as "passedCount" FROM (
        SELECT COUNT(*)::integer AS "passedCount", "problemId" FROM (
          SELECT "submissionId", "submission"."problemId", submission."userId" FROM (
            SELECT MAX(id) as "submissionId", "submission"."problemId", submission."userId" FROM submission GROUP BY submission."problemId", submission."userId"
          ) AS LatestIdTable JOIN submission ON submission.id = LatestIdTable."submissionId" AND submission.status = 'accept' JOIN "user" ON LatestIdTable."userId" = "user"."id" AND "user"."role" = 'user'
        ) AS CountTable GROUP BY "problemId"
      ) AS G RIGHT JOIN problem ON "problemId" = problem."id" WHERE "show" = true ORDER BY problem."id" DESC`;
  }

  async findOnlyShownWithSubmission(userId: number) {
    return this.prisma.$queryRaw<ProblemWithDetail[]>`
      SELECT "id", "name", "sname", "score", "timeLimit", "memoryLimit", "show", "recentShowTime", "case", "rating", COALESCE("passedCount", 0) as "passedCount", "latestSubmissionId", "status" FROM (
        SELECT LatestAndCountTable."problemId", "passedCount", "latestSubmissionId", "status" FROM (
          SELECT COALESCE(CountIdTable."problemId", LatestIdTable."problemId") as "problemId", "passedCount", "latestSubmissionId" FROM (
            SELECT COUNT(*)::integer AS "passedCount", "problemId" FROM (
              SELECT "submissionId", "submission"."problemId", submission."userId" FROM (
                SELECT MAX(id) as "submissionId", "submission"."problemId", submission."userId" FROM submission GROUP BY submission."problemId", submission."userId"
              ) AS LatestIdTable JOIN submission ON submission.id = LatestIdTable."submissionId" AND submission.status = 'accept' JOIN "user" ON LatestIdTable."userId" = "user"."id" AND "user"."role" = 'user'
            ) AS CountTable GROUP BY "problemId"
          ) AS CountIdTable FULL JOIN (
            SELECT MAX(id) as "latestSubmissionId", submission."problemId" FROM submission WHERE "userId" = ${userId} GROUP BY submission."problemId"
          ) AS LatestIdTable ON CountIdTable."problemId" = LatestIdTable."problemId" 
        ) AS LatestAndCountTable LEFT JOIN submission ON "latestSubmissionId" = "submission".id
      ) AS AggTable RIGHT JOIN problem ON "problemId" = problem."id" WHERE "show" = true ORDER BY problem."id" DESC`;
  }

  async findAllWithSubmission(userId: number) {
    return this.prisma.$queryRaw<ProblemWithDetail[]>`
      SELECT "id", "name", "sname", "score", "timeLimit", "memoryLimit", "show", "recentShowTime", "case", "rating", COALESCE("passedCount", 0) as "passedCount", "latestSubmissionId", "status" FROM (
        SELECT LatestAndCountTable."problemId", "passedCount", "latestSubmissionId", "status" FROM (
          SELECT COALESCE(CountIdTable."problemId", LatestIdTable."problemId") as "problemId", "passedCount", "latestSubmissionId" FROM (
            SELECT COUNT(*)::integer AS "passedCount", "problemId" FROM (
              SELECT "submissionId", "submission"."problemId", submission."userId" FROM (
                SELECT MAX(id) as "submissionId", "submission"."problemId", submission."userId" FROM submission GROUP BY submission."problemId", submission."userId"
              ) AS LatestIdTable JOIN submission ON submission.id = LatestIdTable."submissionId" AND submission.status = 'accept' JOIN "user" ON LatestIdTable."userId" = "user"."id" AND "user"."role" = 'user'
            ) AS CountTable GROUP BY "problemId"
          ) AS CountIdTable FULL JOIN (
            SELECT MAX(id) as "latestSubmissionId", submission."problemId" FROM submission WHERE "userId" = ${userId} GROUP BY submission."problemId"
          ) AS LatestIdTable ON CountIdTable."problemId" = LatestIdTable."problemId" 
        ) AS LatestAndCountTable LEFT JOIN submission ON "latestSubmissionId" = "submission".id
      ) AS AggTable RIGHT JOIN problem ON "problemId" = problem."id" ORDER BY problem."id" DESC`;
  }

  async findOneById(id: number) {
    return this.prisma.problem.findUnique({
      where: { id },
      select: WITHOUT_EXAMPLE,
    });
  }

  async findOneByIdWithExamples(id: number) {
    return this.prisma.problem.findUnique({ where: { id } });
  }

  async getProblemDocStream(problemId: number) {
    const docStream = await getProblemDocStream(
      `${problemId}`,
      this.fileManager,
    );

    if (!docStream) throw new NotFoundException();
    return docStream;
  }

  async changeProblemShowById(problemId: number, show: boolean) {
    return this.prisma.problem.update({
      where: { id: problemId },
      data: { show, recentShowTime: new Date() },
      select: WITHOUT_EXAMPLE,
    });
  }

  async findPassedUser(problemId: number) {
    return this.prisma.$queryRaw<PassedUser[]>`
      SELECT "id", "role", "username", "showName", "rating" FROM (
        SELECT * FROM (
          SELECT "submissionId", "status", submission."userId" FROM (
            SELECT MAX(id) as "submissionId", submission."userId" FROM submission WHERE submission."problemId" = ${problemId} GROUP BY submission."userId"
          ) AS X JOIN submission ON submission.id = "submissionId"
        ) AS T WHERE "status" = 'accept'
      ) AS S JOIN "user" ON "user"."id" = "userId" ORDER BY "user"."role"`;
  }

  async delete(problemId: number) {
    try {
      const problem = await this.prisma.problem.delete({
        where: { id: problemId },
        select: WITHOUT_EXAMPLE,
      });
      await removeProblemSource(`${problem.id}`, this.fileManager);
      return problem;
    } catch (e) {
      console.log(e);
      throw new BadRequestException();
    }
  }

  async updateProblemExamples(problemId: number, examples: object) {
    try {
      return this.prisma.problem.update({
        data: { examples },
        where: { id: problemId },
        select: { examples: true },
      });
    } catch (e) {
      console.log(e);
      throw new BadRequestException();
    }
  }
}

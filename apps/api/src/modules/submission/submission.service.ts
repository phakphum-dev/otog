import { BadRequestException, Injectable } from '@nestjs/common';
import { scodeFileFilter, scodeFileSizeLimit } from 'src/utils';
import { UserDTO } from '../user/dto/user.dto';
import { PrismaService } from 'src/core/database/prisma.service';
import { WITHOUT_PASSWORD } from '../user/user.service';
import { Submission, SubmissionStatus, UserRole } from '@otog/database';
// src: https://github.com/DefinitelyTyped/DefinitelyTyped/issues/47780
import { Multer } from 'multer';

export const WITHOUT_SOURCECODE = {
  id: true,
  result: true,
  score: true,
  timeUsed: true,
  status: true,
  errmsg: true,
  contestId: true,
  language: true,
  creationDate: true,
  public: true,
  problem: { select: { id: true, name: true } },
  user: { select: WITHOUT_PASSWORD },
} as const;

const WITH_SOURCECODE = {
  ...WITHOUT_SOURCECODE,
  sourceCode: true,
};

@Injectable()
export class SubmissionService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(offset = 1e9, limit = 89) {
    return this.prisma.submission.findMany({
      where: { id: { lt: offset } },
      take: limit,
      select: WITHOUT_SOURCECODE,
      orderBy: { id: 'desc' },
    });
  }

  findAllWithOutContestAndAdmin(offset = 1e9, limit = 89) {
    return this.prisma.submission.findMany({
      where: {
        contestId: null,
        id: { lt: offset },
        user: { role: { not: UserRole.admin } },
      },
      take: limit,
      select: WITHOUT_SOURCECODE,
      orderBy: { id: 'desc' },
    });
  }

  findAllWithContest(offset = 1e9, limit = 89) {
    return this.prisma.submission.findMany({
      where: {
        contestId: { not: null },
        id: { lt: offset },
      },
      take: limit,
      select: WITHOUT_SOURCECODE,
      orderBy: { id: 'desc' },
    });
  }

  async findOneByResultId(resultId: number) {
    return this.prisma.submission.findUnique({
      where: { id: resultId },
      select: WITHOUT_SOURCECODE,
    });
  }

  async findOneByResultIdWithCode(resultId: number) {
    return this.prisma.submission.findUnique({
      where: { id: resultId },
      select: WITH_SOURCECODE,
    });
  }

  fileCheck(file: Express.Multer.File) {
    // check file extension
    if (!scodeFileFilter(file))
      throw new BadRequestException('Only C C++ and Python are allowed!');
    // check file size
    if (!scodeFileSizeLimit(file, 10 * 1024))
      throw new BadRequestException('File is too large!');
  }

  async create(
    user: UserDTO,
    problemId: number,
    data: Pick<Submission, 'language' | 'contestId'>,
    file: Express.Multer.File,
  ) {
    this.fileCheck(file);
    try {
      return await this.prisma.submission.create({
        data: {
          userId: user.id,
          problemId,
          language: data.language,
          status: SubmissionStatus.waiting,
          sourceCode: file.buffer.toString(),
          contestId: Number(data.contestId) || null,
        },
      });
    } catch {
      throw new BadRequestException();
    }
  }

  findAllByUserIdWithOutContest(userId: number, offset = 1e9, limit = 89) {
    return this.prisma.submission.findMany({
      where: {
        contestId: null,
        userId,
        id: { lt: offset },
      },
      take: limit,
      select: WITHOUT_SOURCECODE,
      orderBy: { id: 'desc' },
    });
  }

  findAllByUserId(userId: number, offset = 1e9, limit = 89) {
    return this.prisma.submission.findMany({
      where: {
        userId,
        id: { lt: offset },
      },
      take: limit,
      select: WITHOUT_SOURCECODE,
      orderBy: { id: 'desc' },
    });
  }

  findFirstByUserId(userId: number) {
    return this.prisma.submission.findFirst({
      where: { userId },
      orderBy: { id: 'desc' },
      select: WITH_SOURCECODE,
    });
  }

  findFirstByProblemIdAndUserId(problemId: number, userId: number) {
    return this.prisma.submission.findFirst({
      where: { userId, problemId },
      orderBy: { id: 'desc' },
      select: WITH_SOURCECODE,
    });
  }

  async findAllLatestAccept() {
    const maxGroups = await this.prisma.submission.groupBy({
      _max: { id: true },
      by: ['problemId', 'userId'],
      where: { status: SubmissionStatus.accept },
    });
    const ids = maxGroups
      .map((group) => group._max.id)
      .filter((id): id is number => id !== null);
    return this.prisma.submission.findMany({
      select: WITHOUT_SOURCECODE,
      where: {
        id: { in: ids },
        user: { role: { not: UserRole.admin } },
      },
      orderBy: { problemId: 'asc' },
    });
  }

  async findLatestSubmissionIds(problemId: number) {
    const maxGroups = await this.prisma.submission.groupBy({
      _max: { id: true },
      by: ['userId'],
      where: { status: SubmissionStatus.accept, problemId },
    });
    return maxGroups.map((group) => group._max.id);
  }

  async findAllLatestSubmission(problemId: number) {
    const submissionIds = await this.findLatestSubmissionIds(problemId);
    const ids = submissionIds.filter((id): id is number => id !== null);
    return this.prisma.submission.findMany({
      where: {
        id: { in: ids },
      },
    });
  }

  updateSubmissionPublic(submissionId: number, show: boolean) {
    return this.prisma.submission.update({
      where: { id: submissionId },
      data: { public: show },
      select: { public: true },
    });
  }

  async setSubmissionStatusToWaiting(submissionId: number) {
    return this.prisma.submission.update({
      where: { id: submissionId },
      data: { status: SubmissionStatus.waiting, result: 'Rejudging' },
      select: WITHOUT_SOURCECODE,
    });
  }

  async setAllLatestSubmissionStatusToWaiting(problemId: number) {
    const submissionIds = await this.findLatestSubmissionIds(problemId);
    const ids = submissionIds.filter((id): id is number => id !== null);
    return this.prisma.submission.updateMany({
      where: { id: { in: ids } },
      data: { status: SubmissionStatus.waiting, result: 'Rejudging' },
    });
  }
}

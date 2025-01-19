import { BadRequestException, Injectable } from '@nestjs/common'
// src: https://github.com/DefinitelyTyped/DefinitelyTyped/issues/47780
import { Multer } from 'multer'
import { PrismaService } from 'src/core/database/prisma.service'
import { scodeFileFilter, scodeFileSizeLimit } from 'src/utils'
import { select } from 'ts-pattern/dist/patterns'

import { SubmissionStatus, UserRole } from '@otog/database'

import { WITHOUT_PASSWORD } from '../user/user.service'

export const WITHOUT_DETAIL = {
  id: true,
  status: true,
  contestId: true,
  language: true,
  creationDate: true,
  public: true,
  userId: true,
  problem: {
    select: {
      id: true,
      name: true,
      timeLimit: true,
      memoryLimit: true,
      score: true,
    },
  },
  user: { select: WITHOUT_PASSWORD },
  submissionResult: {
    select: {
      id: true,
      score: true,
      timeUsed: true,
      memUsed: true,
      result: true,
      errmsg: true,
    },
  },
} as const

const WITH_DETAIL = {
  ...WITHOUT_DETAIL,
  sourceCode: true,
  submissionResult: {
    select: {
      id: true,
      score: true,
      timeUsed: true,
      memUsed: true,
      result: true,
      errmsg: true,
      subtaskResults: {
        select: {
          score: true,
          fullScore: true,
          subtaskIndex: true,
          verdicts: true,
        },
      }
    },
  },
}

@Injectable()
export class SubmissionService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(offset = 1e9, limit = 89) {
    return this.prisma.submission.findMany({
      where: { id: { lt: offset } },
      take: limit,
      select: WITHOUT_DETAIL,
      orderBy: { id: 'desc' },
    })
  }

  findAllWithOutContestAndAdmin(offset = 1e9, limit = 89) {
    return this.prisma.submission.findMany({
      where: {
        contestId: null,
        id: { lt: offset },
        user: { role: { not: UserRole.admin } },
      },
      take: limit,
      select: WITHOUT_DETAIL,
      orderBy: { id: 'desc' },
    })
  }

  findAllWithContest(offset = 1e9, limit = 89) {
    return this.prisma.submission.findMany({
      where: {
        contestId: { not: null },
        id: { lt: offset },
      },
      take: limit,
      select: WITHOUT_DETAIL,
      orderBy: { id: 'desc' },
    })
  }

  async findOneByResultId(resultId: number) {
    return this.prisma.submission.findUnique({
      where: { id: resultId },
      select: WITHOUT_DETAIL,
    })
  }

  async findOneByResultIdWithCode(resultId: number) {
    return this.prisma.submission.findUnique({
      where: { id: resultId },
      select: WITH_DETAIL,
    })
  }

  fileCheck(file: Express.Multer.File) {
    // check file extension
    if (!scodeFileFilter(file))
      throw new BadRequestException('Only C C++ and Python are allowed!')
    // check file size
    if (!scodeFileSizeLimit(file, 10 * 1024))
      throw new BadRequestException('File is too large!')
  }

  async create(args: {
    userId: number
    problemId: number
    language: string
    file: Express.Multer.File
    contestId: number | null
  }) {
    this.fileCheck(args.file)
    return await this.prisma.submission.create({
      data: {
        userId: args.userId,
        problemId: args.problemId,
        language: args.language,
        status: SubmissionStatus.waiting,
        sourceCode: args.file.buffer.toString(),
        contestId: args.contestId,
      },
    })
  }

  findAllByUserIdWithOutContest(userId: number, offset = 1e9, limit = 89) {
    return this.prisma.submission.findMany({
      where: {
        contestId: null,
        userId,
        id: { lt: offset },
      },
      take: limit,
      select: WITHOUT_DETAIL,
      orderBy: { id: 'desc' },
    })
  }

  findAllByUserId(userId: number, offset = 1e9, limit = 89) {
    return this.prisma.submission.findMany({
      where: {
        userId,
        id: { lt: offset },
      },
      take: limit,
      select: WITHOUT_DETAIL,
      orderBy: { id: 'desc' },
    })
  }

  findFirstByUserId(userId: number) {
    return this.prisma.submission.findFirst({
      where: { userId },
      orderBy: { id: 'desc' },
      select: WITH_DETAIL,
    })
  }

  findFirstByProblemIdAndUserId(problemId: number, userId: number) {
    return this.prisma.submission.findFirst({
      where: { userId, problemId },
      orderBy: { id: 'desc' },
      select: WITH_DETAIL,
    })
  }

  async findAllLatestAccept() {
    const maxGroups = await this.prisma.submission.groupBy({
      _max: { id: true },
      by: ['problemId', 'userId'],
      where: { status: SubmissionStatus.accept },
    })
    const ids = maxGroups
      .map((group) => group._max.id)
      .filter((id): id is number => id !== null)
    return this.prisma.submission.findMany({
      select: WITHOUT_DETAIL,
      where: {
        id: { in: ids },
        user: { role: { not: UserRole.admin } },
      },
      orderBy: { problemId: 'asc' },
    })
  }

  async findLatestSubmissionIds(problemId: number) {
    const maxGroups = await this.prisma.submission.groupBy({
      _max: { id: true },
      by: ['userId'],
      where: { status: SubmissionStatus.accept, problemId },
    })
    return maxGroups.map((group) => group._max.id)
  }

  async findAllLatestSubmission(problemId: number) {
    const submissionIds = await this.findLatestSubmissionIds(problemId)
    const ids = submissionIds.filter((id): id is number => id !== null)
    return this.prisma.submission.findMany({
      where: {
        id: { in: ids },
      },
    })
  }

  updateSubmissionPublic(submissionId: number, show: boolean) {
    return this.prisma.submission.update({
      where: { id: submissionId },
      data: { public: show },
      select: { public: true },
    })
  }

  async rejudgeSubmission(submissionId: number) {
    const [_, submission] = await this.prisma.$transaction([
      this.prisma.submissionResult.delete({ where: { submissionId } }),
      this.prisma.submission.update({
        where: { id: submissionId },
        data: { status: SubmissionStatus.waiting },
        select: WITHOUT_DETAIL,
      }),
    ])
    return submission
  }

  async rejudgeProblem(problemId: number) {
    const [_, submission] = await this.prisma.$transaction([
      this.prisma.submissionResult.deleteMany({
        where: { submission: { problemId } },
      }),
      this.prisma.submission.updateMany({
        where: { problemId },
        data: { status: SubmissionStatus.waiting },
      }),
    ])
  }
}

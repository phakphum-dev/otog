import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from 'src/core/database/prisma.service'
import {
  FileManager,
  LocalFileManager,
  S3FileManager,
} from 'src/core/fileManager'
import { environment } from 'src/env'
import {
  getProblemDocStream,
  removeProblemSource,
  updateProblemDoc,
  updateProblemTestCase,
} from 'src/utils/file.util'

import { PassedUserSchema, ProblemTableRowSchema } from '@otog/contract'
import { Prisma, SubmissionStatus, User, UserRole } from '@otog/database'

import { UploadedFilesObject } from './dto/problem.dto'

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
}

@Injectable()
export class ProblemService {
  private fileManager: FileManager

  constructor(private readonly prisma: PrismaService) {
    this.fileManager = new LocalFileManager()
    this.fileManager = environment.USE_S3
      ? new S3FileManager(environment.S3_BUCKET)
      : new LocalFileManager()
  }

  async create(
    problemData: Prisma.ProblemCreateInput,
    files: UploadedFilesObject
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
      })
      if (files.pdf) {
        await updateProblemDoc(
          `${problem.id}`,
          // TODO: fix me
          files.pdf?.[0]?.path as string,
          this.fileManager
        )
      }
      if (files.zip) {
        await updateProblemTestCase(
          `${problem.id}`,
          // TODO: fix me
          files.pdf?.[0]?.path as string,
          this.fileManager
        )
      }
      return problem
    } catch (err) {
      console.log(err)
      throw new BadRequestException()
    }
  }

  async replaceByProblemId(
    problemId: number,
    problemData: Prisma.ProblemUpdateInput,
    files: UploadedFilesObject
  ) {
    try {
      const problem = await this.prisma.problem.update({
        data: {
          name: problemData.name,
          sname: problemData.sname,
          score: problemData.score,
          timeLimit: problemData.timeLimit,
          memoryLimit: problemData.memoryLimit,
          case: problemData.case,
        },
        where: { id: problemId },
        select: WITHOUT_EXAMPLE,
      })
      if (files?.pdf) {
        await updateProblemDoc(
          `${problem.id}`,
          // TODO: fix me
          files.pdf?.[0]?.path as string,
          this.fileManager
        )
      }
      if (files?.zip) {
        await updateProblemTestCase(
          `${problem.id}`,
          // TODO: fix me
          files.zip[0]?.path as string,
          this.fileManager
        )
      }
      return problem
    } catch (err) {
      console.error(err)
      throw new BadRequestException()
    }
  }

  async findMany(args: {
    show?: boolean
    userId?: number
  }): Promise<Array<ProblemTableRowSchema>> {
    const where = { show: args.show }
    const [problems, problemsWithSubmissions, problemsWithSampleUsers] =
      await Promise.all([
        this.prisma.problem.findMany({
          where: where,
          select: {
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
            submission: args.userId
              ? {
                  select: {
                    id: true,
                    status: true,
                    userId: true,
                  },
                  orderBy: { creationDate: 'desc' },
                  where: { userId: args.userId },
                  take: 1,
                }
              : undefined,
          },
          orderBy: { id: 'desc' },
        }),
        // TODO: do simpler query by making problem to user connection in db
        this.prisma.problem.findMany({
          where: where,
          select: {
            id: true,
            submission: {
              where: {
                status: SubmissionStatus.accept,
                user: { NOT: { role: UserRole.admin } },
              },
              distinct: ['userId'],
              select: { id: true },
            },
          },
        }),
        this.prisma.problem.findMany({
          where: where,
          select: {
            id: true,
            submission: {
              take: 3,
              distinct: ['userId'],
              where: {
                status: SubmissionStatus.accept,
                user: { NOT: { role: UserRole.admin } },
              },
              select: {
                user: {
                  select: {
                    id: true,
                    showName: true,
                  },
                },
              },
            },
          },
        }),
      ])

    const problemIdToPassedCount = new Map<number, number>()
    problemsWithSubmissions.forEach((problem) => {
      problemIdToPassedCount.set(problem.id, problem.submission.length)
    })

    const problemIdToSampleUsers = new Map<
      number,
      Array<Pick<User, 'id' | 'showName'>>
    >()
    problemsWithSampleUsers.forEach((problem) => {
      problemIdToSampleUsers.set(
        problem.id,
        problem.submission.map((s) => s.user)
      )
    })

    return problems.map((problem) => ({
      id: problem.id,
      name: problem.name,
      sname: problem.sname,
      score: problem.score,
      timeLimit: problem.timeLimit,
      memoryLimit: problem.memoryLimit,
      show: problem.show,
      recentShowTime: problem.recentShowTime,
      case: problem.case,
      rating: problem.rating,
      latestSubmission: problem.submission?.[0] ?? null,
      passedCount: problemIdToPassedCount.get(problem.id) ?? 0,
      samplePassedUsers: problemIdToSampleUsers.get(problem.id) ?? [],
    }))
  }

  async findOneById(id: number) {
    return this.prisma.problem.findUnique({
      where: { id },
      select: WITHOUT_EXAMPLE,
    })
  }

  async findOneByIdWithExamples(id: number) {
    return this.prisma.problem.findUnique({ where: { id } })
  }

  async getProblemDocStream(problemId: number) {
    const docStream = await getProblemDocStream(
      `${problemId}`,
      this.fileManager
    )

    if (!docStream) {
      console.error('Cannot find pdf of problem', `${problemId}`)
      throw new NotFoundException()
    }
    return docStream
  }

  async changeProblemShowById(problemId: number, show: boolean) {
    return this.prisma.problem.update({
      where: { id: problemId },
      data: { show, recentShowTime: new Date() },
      select: WITHOUT_EXAMPLE,
    })
  }

  async findPassedUser(args: {
    problemId: number
  }): Promise<Array<PassedUserSchema>> {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        role: true,
        username: true,
        showName: true,
        rating: true,
        submission: {
          select: { id: true, status: true, userId: true },
          where: { status: SubmissionStatus.accept, problemId: args.problemId },
          orderBy: { creationDate: 'desc' },
          take: 1,
        },
      },
      where: {
        submission: {
          some: { problemId: args.problemId, status: SubmissionStatus.accept },
        },
        NOT: { role: UserRole.admin },
      },
      orderBy: { id: 'desc' },
    })
    return users.map(
      (user) =>
        ({
          id: user.id,
          role: user.role,
          username: user.username,
          showName: user.showName,
          rating: user.rating,
          passedSubmission: user.submission[0]!,
        }) satisfies PassedUserSchema
    )
  }

  async delete(problemId: number) {
    try {
      const problem = await this.prisma.problem.delete({
        where: { id: problemId },
        select: WITHOUT_EXAMPLE,
      })
      await removeProblemSource(`${problem.id}`, this.fileManager)
      return problem
    } catch (e) {
      console.log(e)
      throw new BadRequestException()
    }
  }

  async updateProblemExamples(problemId: number, examples: object) {
    try {
      return this.prisma.problem.update({
        data: { examples },
        where: { id: problemId },
        select: { examples: true },
      })
    } catch (e) {
      console.log(e)
      throw new BadRequestException()
    }
  }

  async getAdminProblems(args: {
    skip: number
    limit: number
    search?: string
  }) {
    return await this.prisma.problem.findMany({
      take: args.limit,
      skip: args.skip,
      where: args.search
        ? {
            OR: [
              searchId(args.search),
              { name: { contains: args.search, mode: 'insensitive' } },
              { sname: { contains: args.search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      select: {
        id: true,
        name: true,
        sname: true,
        show: true,
        case: true,
        memoryLimit: true,
        timeLimit: true,
        recentShowTime: true,
        score: true,
      },
      orderBy: { id: 'desc' },
    })
  }
  async getAdminProblemCount(args: { search?: string }) {
    return await this.prisma.problem.count({
      where: args.search
        ? {
            OR: [
              searchId(args.search),
              { name: { contains: args.search, mode: 'insensitive' } },
              { sname: { contains: args.search, mode: 'insensitive' } },
            ],
          }
        : undefined,
    })
  }
}

function searchId(search: string | undefined) {
  const searchAsNumber = parseInt(search ?? '')
  if (Number.isNaN(searchAsNumber)) {
    return {} as {}
  }
  return { id: { equals: searchAsNumber } }
}

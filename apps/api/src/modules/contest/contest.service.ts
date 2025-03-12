import { Injectable } from '@nestjs/common'
import { Role } from 'src/core/constants'
import { PrismaService } from 'src/core/database/prisma.service'
import { searchId } from 'src/utils/search'

import {
  AdminContestWithProblems,
  ContestDetailSchema,
  ContestSchema,
  ContestScoreSchema,
  ListPaginationQuerySchema,
  UserContestScoreboard,
} from '@otog/contract'
import { Contest, Prisma } from '@otog/database'

@Injectable()
export class ContestService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createContest: Prisma.ContestCreateInput) {
    return this.prisma.contest.create({
      data: {
        name: createContest.name,
        mode: createContest.mode,
        gradingMode: createContest.gradingMode,
        scoreboardPolicy: createContest.scoreboardPolicy,
        timeStart: createContest.timeStart,
        timeEnd: createContest.timeEnd,
      },
    })
  }

  listContest(args: ListPaginationQuerySchema) {
    return this.prisma.contest.findMany({
      select: {
        id: true,
        name: true,
        mode: true,
        gradingMode: true,
        scoreboardPolicy: true,
        timeStart: true,
        timeEnd: true,
        announce: true,
      },
      skip: args.skip,
      take: args.limit,
      orderBy: {
        id: 'desc',
      },
    })
  }
  countContest() {
    return this.prisma.contest.count({})
  }

  findOneById(contestId: number): Promise<ContestSchema | null> {
    return this.prisma.contest.findUnique({
      where: { id: contestId },
      select: {
        id: true,
        name: true,
        mode: true,
        gradingMode: true,
        scoreboardPolicy: true,
        timeStart: true,
        timeEnd: true,
        announce: true,
      },
    })
  }

  async getContestDetail(
    contestId: number
  ): Promise<ContestDetailSchema | null> {
    return this.prisma.contest.findUnique({
      where: { id: contestId },
      select: {
        id: true,
        name: true,
        mode: true,
        gradingMode: true,
        scoreboardPolicy: true,
        timeStart: true,
        timeEnd: true,
        contestProblem: {
          select: {
            problem: {
              select: {
                id: true,
                name: true,
                score: true,
              },
            },
          },
        },
        announce: true,
      },
    })
  }

  async getContestProblem(contestId: number, problemId: number) {
    const contestProblem = await this.prisma.contestProblem.findUnique({
      where: {
        contestId_problemId: {
          contestId,
          problemId,
        },
      },
    })
    if (!contestProblem) {
      return null
    }
    return await this.prisma.problem.findUnique({
      where: { id: problemId },
    })
  }

  async getUserContestScores(contestId: number, userId: number) {
    const contest = await this.prisma.contest.findUnique({
      where: { id: contestId },
      include: {
        contestProblem: {
          include: {
            problem: true,
          },
        },
      },
    })
    if (!contest) {
      return null
    }

    const contestScores = await this.prisma.contestScore.findMany({
      where: {
        contestId,
        userId,
      },
      select: {
        problemId: true,
        score: true,
        latestSubmission: true,
      },
    })
    return contestScores.map((contestScore) =>
      ContestScoreSchema.parse({
        problemId: contestScore.problemId,
        score: contestScore.score,
        penalty: contestScore.latestSubmission
          ? Math.floor(
              (contestScore.latestSubmission.getTime() -
                contest.timeStart.getTime()) /
                1000
            )
          : 0,
      })
    )
  }

  async getUserContestScoreHistory(contestId: number, userId: number) {
    return await this.prisma.contestScore.findMany({
      where: {
        contestId,
        userId,
      },
      include: {
        contestScoreHistory: {
          include: {
            submission: {
              select: {
                creationDate: true,
                submissionResult: {
                  select: {
                    score: true,
                    subtaskResults: {
                      select: {
                        score: true,
                        subtaskIndex: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })
  }

  async scoreboardByContestId(contestId: number) {
    const contest = await this.prisma.contest.findUnique({
      where: { id: contestId },
      include: {
        contestProblem: {
          include: {
            problem: true,
          },
        },
        userContest: {
          where: {
            user: {
              role: Role.User,
            },
          },
          include: {
            user: {
              select: {
                id: true,
                showName: true,
                rating: true,
                role: true,
              },
            },
          },
        },
      },
    })
    if (!contest) {
      return null
    }

    const userIdToContestScores = new Map<number, ContestScoreSchema[]>()
    const contestScores = await this.prisma.contestScore.findMany({
      where: {
        contestId,
        user: { role: Role.User },
      },
      select: {
        userId: true,
        problemId: true,
        score: true,
        latestSubmission: true,
      },
    })
    contestScores.forEach((contestScore) => {
      const parsedContestScore = ContestScoreSchema.parse({
        problemId: contestScore.problemId,
        score: contestScore.score,
        penalty: contestScore.latestSubmission
          ? Math.floor(
              (contestScore.latestSubmission.getTime() -
                contest.timeStart.getTime()) /
                1000
            )
          : 0,
      })
      if (userIdToContestScores.has(contestScore.userId)) {
        userIdToContestScores.get(contestScore.userId)!.push(parsedContestScore)
      } else {
        userIdToContestScores.set(contestScore.userId, [parsedContestScore])
      }
    })

    const userContestScoreboards: UserContestScoreboard[] =
      contest.userContest.map((userContest) => {
        const contestScores =
          userIdToContestScores.get(userContest.userId) ?? []
        const totalScore = contestScores
          .map((contestScore) => contestScore.score)
          .reduce((acc, val) => acc + val, 0)
        const maxPenalty = contestScores
          .map((contestScore) => contestScore.penalty)
          .reduce((acc, val) => Math.max(acc, val), 0)
        return {
          ...userContest,
          contestScores,
          totalScore,
          maxPenalty,
        }
      })
    userContestScoreboards.sort((a, b) => {
      if (b.totalScore === a.totalScore) {
        return a.maxPenalty - b.maxPenalty
      }
      return b.totalScore - a.totalScore
    })
    userContestScoreboards.forEach((user, index) => {
      if (index === 0) {
        user.rank = 1
        return
      }
      const prevUser = userContestScoreboards[index - 1]!
      if (
        user.totalScore === prevUser.totalScore &&
        user.maxPenalty === prevUser.maxPenalty
      ) {
        user.rank = prevUser.rank
        return
      }
      user.rank = index + 1
    })
    return { contest, userContest: userContestScoreboards }
  }

  // TODO: fix
  async scoreboardPrizeByContestId(contestId: number) {
    await this.prisma.contest.findUnique({
      where: { id: contestId },
    })

    const select = {
      id: true,
      problem: { select: { id: true } },
      user: { select: { id: true, showName: true } },
    }

    // * 1. First Blood: The first user that passed the task.
    const firstBloodResult = await this.prisma.$queryRaw<{ id: number }[]>`
      SELECT MIN(submission.id) AS id
      FROM submission
      INNER JOIN "user"
      ON "user".id = submission."userId" AND "user"."role"='user'
      WHERE "contestId" = ${contestId} AND status = 'accept'
      GROUP BY "submission"."problemId"`
    const firstBloodIds = firstBloodResult.map((result) => result.id)
    const firstBlood = await this.prisma.submission.findMany({
      select,
      where: { id: { in: firstBloodIds } },
    })

    // * 2. Faster Than Light: The user that solved the task with fastest algorithm.
    // const fasterThanLightResult = await this.prisma.$queryRaw<{ id: number }[]>`
    //   SELECT s.id AS id
    //     FROM (
    //       SELECT "problemId", MIN("timeUsed") AS "minTimeUsed"
    //       FROM submission
    //       INNER JOIN "user"
    //       ON "user".id = submission."userId" AND "user"."role"='user'
    //       WHERE "contestId" = ${contestId} AND status = 'accept' GROUP BY "submission"."problemId"
    //     ) t
    //     INNER JOIN (
    //       SELECT submission.*
    //       FROM submission
    //       INNER JOIN "user"
    //       ON "user".id = submission."userId" AND "user"."role"='user'
    //       WHERE "contestId" = ${contestId} AND status = 'accept'
    //     ) s
    //     ON s."problemId" = t."problemId" AND s."timeUsed" = t."minTimeUsed"`
    // const fasterThanLightIds = fasterThanLightResult.map((result) => result.id)
    // const fasterThanLight = await this.prisma.submission.findMany({
    //   select,
    //   where: {
    //     contestId,
    //     id: {
    //       in: fasterThanLightIds,
    //     },
    //   },
    // })

    // * 3. Passed In One: The user that passed the task in one submission.
    // const passedInOneResult = await this.prisma.$queryRaw<{ id: number }[]>`
    //   SELECT s.id AS id
    //     FROM (
    //       SELECT "problemId", "userId", MIN(submission.id) as id
    //         FROM submission
    //         INNER JOIN "user"
    //         ON "user".id = submission."userId" AND "user"."role"='user'
    //         WHERE "contestId" = ${contestId}
    //         GROUP BY "problemId", "userId"
    //     ) t
    //     INNER JOIN submission s
    //     ON s.id = t.id AND s.status = 'accept'`
    // const passedInOneIds = passedInOneResult.map((result) => result.id)
    // const passedInOne = await this.prisma.submission.findMany({
    //   select,
    //   where: { id: { in: passedInOneIds } },
    // })

    // * 4. One Man Solve: The only one user that passed the task.
    const oneManSolveResult = await this.prisma.$queryRaw<{ id: number }[]>`
      SELECT DISTINCT ON (s."problemId")
        s.id AS id
      FROM (
        SELECT "problemId", COUNT(DISTINCT "userId") AS "passedCount"
        FROM submission
        INNER JOIN "user"
        ON "user".id = submission."userId" AND "user"."role"='user'
        WHERE "contestId" = ${contestId} AND submission.status = 'accept'
        GROUP BY "problemId"
      ) t
      INNER JOIN (
        SELECT submission.*
        FROM submission
        INNER JOIN "user"
        ON "user".id = submission."userId" AND "user"."role"='user'
        WHERE "contestId" = ${contestId} AND status = 'accept'
      ) s
      ON t."passedCount" = 1 AND s."problemId" = t."problemId"`
    const oneManSolveIds = oneManSolveResult.map((result) => result.id)
    const oneManSolve = await this.prisma.submission.findMany({
      select,
      where: {
        contestId,
        id: { in: oneManSolveIds },
      },
    })

    return { firstBlood, oneManSolve }
  }

  getCurrentContests() {
    return this.prisma.contest.findMany({
      where: {
        timeEnd: {
          gte: new Date(),
        },
      },
      select: {
        id: true,
        name: true,
        mode: true,
        gradingMode: true,
        scoreboardPolicy: true,
        timeStart: true,
        timeEnd: true,
        announce: true,
      },
      orderBy: {
        timeStart: 'asc',
      },
    })
  }

  getStartedAndUnFinishedContests() {
    return this.prisma.contest.findMany({
      where: {
        timeStart: {
          lte: new Date(),
        },
        timeEnd: {
          gte: new Date(),
        },
      },
      include: {
        contestProblem: true,
      },
    })
  }

  async toggleProblemToContest(
    contestId: number,
    problemId: number,
    show: boolean
  ) {
    if (show) {
      await this.prisma.contestProblem.create({
        data: {
          problemId,
          contestId,
        },
      })
      return { show }
    } else {
      await this.prisma.contestProblem.delete({
        where: {
          contestId_problemId: {
            problemId,
            contestId,
          },
        },
      })
      return { show }
    }
  }

  async putProblemToContest(args: {
    contestId: number
    data: Array<{ problemId: number }>
  }) {
    await this.prisma.contestProblem.createMany({
      data: args.data.map((problemId) => ({
        contestId: args.contestId,
        problemId: problemId.problemId,
      })),
      skipDuplicates: true,
    })
  }

  async addUserToContest(contestId: number, userId: number) {
    return this.prisma.userContest.upsert({
      where: { userId_contestId: { userId, contestId } },
      create: { userId, contestId },
      update: {},
    })
  }

  async updateContest(
    contestId: number,
    contestData: Prisma.ContestUpdateInput
  ) {
    return this.prisma.contest.update({
      where: { id: contestId },
      data: contestData,
    })
  }

  async deleteContest(contestId: number) {
    return this.prisma.contest.delete({ where: { id: contestId } })
  }

  async getContestsForAdmin(
    args: ListPaginationQuerySchema
  ): Promise<Contest[]> {
    return await this.prisma.contest.findMany({
      skip: args.skip,
      take: args.limit,
      where: args.search
        ? {
            OR: [
              searchId(args.search),
              { name: { contains: args.search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: { id: 'desc' },
    })
  }
  async getContestCountForAdmin(args: { search?: string }): Promise<number> {
    return await this.prisma.contest.count({
      where: args.search
        ? {
            OR: [
              searchId(args.search),
              { name: { contains: args.search, mode: 'insensitive' } },
            ],
          }
        : undefined,
    })
  }

  async getContestForAdmin(args: {
    id: number
  }): Promise<AdminContestWithProblems | null> {
    return await this.prisma.contest.findUnique({
      where: { id: args.id },
      include: {
        contestProblem: {
          include: {
            problem: true,
          },
          orderBy: { problemId: 'desc' },
        },
      },
    })
  }
}

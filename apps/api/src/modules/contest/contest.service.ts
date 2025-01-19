import { Injectable } from '@nestjs/common'
import { Role } from 'src/core/constants'
import { PrismaService } from 'src/core/database/prisma.service'

import { UserContestScoreboard } from '@otog/contract'
import { Prisma } from '@otog/database'

@Injectable()
export class ContestService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createContest: Prisma.ContestCreateInput) {
    return this.prisma.contest.create({
      data: {
        name: createContest.name,
        mode: createContest.mode,
        gradingMode: createContest.gradingMode,
        timeStart: createContest.timeStart,
        timeEnd: createContest.timeEnd,
      },
    })
  }

  findAll() {
    return this.prisma.contest.findMany({
      orderBy: {
        id: 'desc',
      },
    })
  }

  findOneById(contestId: number) {
    return this.prisma.contest.findUnique({
      where: { id: contestId },
      include: { contestProblem: true },
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
    const lastSubmissions = await this.prisma.submission.groupBy({
      _max: {
        id: true,
      },
      by: ['userId', 'problemId'],
      where: {
        user: { role: Role.User },
        contestId,
      },
    })
    const submissionIds = lastSubmissions
      .map((submission) => submission._max.id)
      .filter((id): id is number => id !== null)
    const submissions = await this.prisma.submission.findMany({
      where: { id: { in: submissionIds } },
      select: {
        id: true,
        problemId: true,
        status: true,
        userId: true,
        submissionResult: {
          select: {
            score: true,
            timeUsed: true,
          },
        },
      },
    })

    const userIdToSubmissions = new Map<number, typeof submissions>()
    submissions.forEach((submission) => {
      if (userIdToSubmissions.has(submission.userId)) {
        userIdToSubmissions.get(submission.userId)!.push(submission)
      } else {
        userIdToSubmissions.set(submission.userId, [submission])
      }
    })
    const userContestScoreboards: UserContestScoreboard[] =
      contest.userContest.map((userContest) => {
        const submissions = userIdToSubmissions.get(userContest.userId) ?? []
        const totalScore = submissions
          .map((s) => s.submissionResult?.score ?? 0)
          .reduce((acc, val) => acc + val, 0)
        const totalTimeUsed =
          submissions
            .map((s) => s.submissionResult?.timeUsed ?? 0)
            .reduce((acc, val) => acc + val, 0) / 1000
        return {
          ...userContest,
          submissions,
          totalScore,
          totalTimeUsed,
        }
      })
    userContestScoreboards.sort((a, b) => {
      if (b.totalScore === a.totalScore) {
        return b.totalTimeUsed - a.totalTimeUsed
      }
      return b.totalScore - a.totalScore
    })
    userContestScoreboards.forEach((user, index) => {
      if (index === 0) {
        user.rank = 1
        return
      }
      const prevUser = userContestScoreboards[index - 1]!
      if (user.totalScore === prevUser.totalScore) {
        user.rank = prevUser.rank
        return
      }
      user.rank = index + 1
    })
    return { contest, userContest: userContestScoreboards }
  }

  // TODO: RAW
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
    const fasterThanLightResult = await this.prisma.$queryRaw<{ id: number }[]>`
      SELECT s.id AS id
        FROM (
          SELECT "problemId", MIN("timeUsed") AS "minTimeUsed"
          FROM submission
          INNER JOIN "user"
          ON "user".id = submission."userId" AND "user"."role"='user'
          WHERE "contestId" = ${contestId} AND status = 'accept' GROUP BY "submission"."problemId"
        ) t
        INNER JOIN (
          SELECT submission.*
          FROM submission
          INNER JOIN "user"
          ON "user".id = submission."userId" AND "user"."role"='user'
          WHERE "contestId" = ${contestId} AND status = 'accept'
        ) s
        ON s."problemId" = t."problemId" AND s."timeUsed" = t."minTimeUsed"`
    const fasterThanLightIds = fasterThanLightResult.map((result) => result.id)
    const fasterThanLight = await this.prisma.submission.findMany({
      select,
      where: {
        contestId,
        id: {
          in: fasterThanLightIds,
        },
      },
    })

    // * 3. Passed In One: The user that passed the task in one submission.
    const passedInOneResult = await this.prisma.$queryRaw<{ id: number }[]>`
      SELECT s.id AS id
        FROM (
          SELECT "problemId", "userId", MIN(submission.id) as id
            FROM submission
            INNER JOIN "user"
            ON "user".id = submission."userId" AND "user"."role"='user'
            WHERE "contestId" = ${contestId}
            GROUP BY "problemId", "userId"
        ) t
        INNER JOIN submission s
        ON s.id = t.id AND s.status = 'accept'`
    const passedInOneIds = passedInOneResult.map((result) => result.id)
    const passedInOne = await this.prisma.submission.findMany({
      select,
      where: { id: { in: passedInOneIds } },
    })

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

    return { firstBlood, fasterThanLight, passedInOne, oneManSolve }
  }

  currentContest() {
    return this.prisma.contest.findFirst({
      where: {
        timeEnd: {
          gte: new Date(Date.now() - 60 * 60 * 1000),
        },
      },
      orderBy: { id: 'desc' },
      include: { contestProblem: { include: { problem: true } } },
    })
  }

  getStartedAndUnFinishedContest() {
    return this.prisma.contest.findFirst({
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
      orderBy: { id: 'desc' },
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
}

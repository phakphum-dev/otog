import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common'
import { sha256 } from 'js-sha256'
import { Role } from 'src/core/constants'
import { PrismaService } from 'src/core/database/prisma.service'
import { userList } from 'src/utils'
import { searchId } from 'src/utils/search'

import { ListPaginationQuerySchema, LeaderboardQuerySchema } from '@otog/contract'
import { ContestMode, Prisma, User } from '@otog/database'

export const WITHOUT_PASSWORD = {
  id: true,
  username: true,
  showName: true,
  role: true,
  rating: true,
  showInLeaderboard: true,
} as const

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Pick<User, 'username' | 'password' | 'showName'>) {
    const userNameExists = await this.findOneByUsername(data.username)
    if (userNameExists) {
      throw new ConflictException('username was taken.')
    }
    const showNameExists = await this.findOneByShowName(data.showName)
    if (showNameExists) {
      throw new ConflictException('showName was taken.')
    }
    const hash = sha256.create()
    hash.update(data.password)
    try {
      await this.prisma.user.create({
        data: {
          username: data.username,
          password: hash.hex(),
          showName: data.showName,
          role: Role.User,
        },
      })
    } catch {
      throw new BadRequestException()
    }
    return { message: 'Create user complete.', status: true }
  }

  async getUsersForAdmin(args: ListPaginationQuerySchema) {
    return this.prisma.user.findMany({
      take: args.limit,
      skip: args.skip,
      where: args.search
        ? {
            OR: [
              searchId(args.search),
              { showName: { contains: args.search, mode: 'insensitive' } },
              { username: { contains: args.search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      select: {
        id: true,
        username: true,
        showName: true,
        role: true,
        rating: true,
        showInLeaderboard: true,
      },
      orderBy: { id: 'desc' },
    })
  }
  async getLeaderboard(
    args: LeaderboardQuerySchema,
    requestingUserId: number | undefined,
    isAdminUser: boolean,
  ) {
    const withStats = await this.prisma.$queryRaw<
      Array<{
        id: number
        username: string
        showName: string
        role: 'user' | 'admin'
        rating: number | null
        showInLeaderboard: boolean
        passedCount: number
        passedCountAll: number
      }>
    >`
      SELECT 
        u.id, 
        u.username, 
        u."showName", 
        u.role, 
        u.rating, 
        u."showInLeaderboard",
        CAST(COUNT(DISTINCT CASE WHEN p.show = true THEN s."problemId" END) AS INTEGER) as "passedCount",
        CAST(COUNT(DISTINCT s."problemId") AS INTEGER) as "passedCountAll"
      FROM "user" u
      LEFT JOIN "submission" s ON u.id = s."userId" AND s.status = 'accept'
      LEFT JOIN "problem" p ON s."problemId" = p.id
      GROUP BY u.id
    `

    const sortFn = (
      a: (typeof withStats)[0],
      b: (typeof withStats)[0]
    ) => {
      if (b.passedCount !== a.passedCount) return b.passedCount - a.passedCount
      const rA = a.rating ?? 0
      const rB = b.rating ?? 0
      if (rB !== rA) return rB - rA
      return a.showName.localeCompare(b.showName)
    }

    const applySearch = <T extends { showName: string; username: string }>(
      list: T[],
      search: string | undefined
    ) => {
      if (!search) return list
      const q = search.trim().toLowerCase()
      return list.filter(
        (u) =>
          u.showName.toLowerCase().includes(q) ||
          u.username.toLowerCase().includes(q)
      )
    }

    if (isAdminUser && args.showAll) {
      const sorted = [...withStats].sort(sortFn)
      const ranked = sorted.map((item, index) => ({ ...item, rank: index + 1 }))
      const filtered = applySearch(ranked, args.search)
      return {
        data: filtered.slice(args.skip, args.skip + args.limit),
        total: filtered.length,
      }
    }

    const visiblePool = withStats.filter((u) => u.showInLeaderboard)

    const requestingUser = requestingUserId
      ? withStats.find((u) => u.id === requestingUserId)
      : undefined
    const isHiddenRequester =
      requestingUser && !requestingUser.showInLeaderboard

    type StatsEntry = (typeof withStats)[0]
    type RankedEntry = StatsEntry & { rank: number }

    let workingList: RankedEntry[]

    if (isHiddenRequester && requestingUser) {
      const pool = [...visiblePool, requestingUser].sort(sortFn)
      workingList = pool.map((item, index) => ({ ...item, rank: index + 1 }))
    } else {
      const sorted = [...visiblePool].sort(sortFn)
      workingList = sorted.map((item, index) => ({ ...item, rank: index + 1 }))
    }

    const filtered = applySearch(workingList, args.search)
    return {
      data: filtered.slice(args.skip, args.skip + args.limit),
      total: filtered.length,
    }
  }

  async getUsersCountForAdmin(args: ListPaginationQuerySchema) {
    return this.prisma.user.count({
      where: args.search
        ? {
            OR: [
              searchId(args.search),
              { showName: { contains: args.search, mode: 'insensitive' } },
              { username: { contains: args.search, mode: 'insensitive' } },
            ],
          }
        : undefined,
    })
  }

  async findOneByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
      select: WITHOUT_PASSWORD,
    })
  }

  async findOneById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      select: WITHOUT_PASSWORD,
    })
  }

  async findOneByShowName(showName: string) {
    return this.prisma.user.findUnique({
      where: { showName },
      select: WITHOUT_PASSWORD,
    })
  }

  async updateShowNameById(showName: string, id: number) {
    const showNameExists = await this.findOneByShowName(showName)
    if (showNameExists) {
      throw new ConflictException('showName was taken.')
    }
    return this.prisma.user.update({
      where: { id },
      data: { showName },
      select: { showName: true },
    })
  }

  async updateLeaderboardVisibilityById(showInLeaderboard: boolean, id: number) {
    return this.prisma.user.update({
      where: { id },
      data: { showInLeaderboard },
      select: { showInLeaderboard: true },
    })
  }


  async getUserProfileById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        ...WITHOUT_PASSWORD,
        userContest: {
          select: {
            contest: {
              select: {
                id: true,
                name: true,
                timeStart: true,
              },
            },
            rank: true,
            ratingAfterUpdate: true,
          },
          where: { rank: { not: null }, contest: { mode: ContestMode.rated } },
        },
      },
    })
  }

  async onlineUser() {
    const checkList = new Map()
    const onlineUser = Array.from(userList.values())
    return onlineUser.filter((user) => {
      if (checkList.get(user.id)) return false
      checkList.set(user.id, true)
      return true
    })
  }

  async updateUser(userId: number, userData: Prisma.UserUpdateInput) {
    if (userData.role === 'admin' && userData.showInLeaderboard === undefined) {
      userData.showInLeaderboard = false
    }
    if (typeof userData.password === 'string' && !!userData.password) {
      const hash = sha256.create()
      hash.update(userData.password)
      return this.prisma.user.update({
        where: { id: userId },
        data: { password: hash.hex() },
      })
    }
    // eslint-disable-next-line no-unused-vars
    const { password: _password, ...data } = userData
    return this.prisma.user.update({
      where: { id: userId },
      data: data,
      select: WITHOUT_PASSWORD,
    })
  }

  async getPassedProblems(userId: number, sortBy: 'id' | 'solvedDate', isAdminUser: boolean) {
    const submissions = await this.prisma.submission.findMany({
      where: {
        userId,
        status: 'accept',
        problem: !isAdminUser ? { show: true } : undefined,
      },
      select: {
        id: true,
        creationDate: true,
        problem: {
          select: {
            id: true,
            name: true,
            sname: true,
            score: true,
            show: true,
          },
        },
      },
    })

    const problemMap = new Map<number, {
      id: number
      name: string
      sname: string | null
      score: number
      show: boolean
      solvedDate: Date
      submissionId: number
    }>()

    for (const sub of submissions) {
      const p = sub.problem
      const existing = problemMap.get(p.id)
      if (!existing || sub.creationDate > existing.solvedDate) {
        problemMap.set(p.id, {
          id: p.id,
          name: p.name,
          sname: p.sname,
          score: p.score,
          show: p.show,
          solvedDate: sub.creationDate,
          submissionId: sub.id,
        })
      }
    }

    const passedProblems = Array.from(problemMap.values())

    if (sortBy === 'id') {
      passedProblems.sort((a, b) => a.id - b.id)
    } else {
      passedProblems.sort((a, b) => b.solvedDate.getTime() - a.solvedDate.getTime())
    }

    return passedProblems
  }
}

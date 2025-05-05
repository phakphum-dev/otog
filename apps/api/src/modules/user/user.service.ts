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

import { ListPaginationQuerySchema } from '@otog/contract'
import { ContestMode, Prisma, User } from '@otog/database'

export const WITHOUT_PASSWORD = {
  id: true,
  username: true,
  showName: true,
  role: true,
  rating: true,
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
      },
      orderBy: { id: 'desc' },
    })
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
}

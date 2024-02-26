import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/core/database/prisma.service'

import { WITHOUT_PASSWORD } from '../user/user.service'

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async create(message: string, userId: number) {
    return this.prisma.chat.create({ data: { message, userId } })
  }

  async findAll(offset = 1e9, take = 25) {
    return this.prisma.chat.findMany({
      where: { id: { lt: offset } },
      take,
      orderBy: { id: 'desc' },
      include: { user: { select: WITHOUT_PASSWORD } },
    })
  }
}

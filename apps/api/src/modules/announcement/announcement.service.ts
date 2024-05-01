import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/core/database/prisma.service'

import { Prisma } from '@otog/database'

@Injectable()
export class AnnouncementService {
  constructor(private readonly prisma: PrismaService) {}

  async findOneById(announcementId: number) {
    return await this.prisma.announcement.findUnique({
      where: { id: announcementId },
    })
  }

  async findAll() {
    return await this.prisma.announcement.findMany({
      where: { contestId: null },
      orderBy: { id: 'desc' },
    })
  }

  async findShown() {
    return await this.prisma.announcement.findMany({
      where: { show: true, contestId: null },
      orderBy: { id: 'desc' },
    })
  }

  async findAllWithContestId(contestId: number) {
    return await this.prisma.announcement.findMany({
      where: { contestId },
      orderBy: { id: 'desc' },
    })
  }

  async findShownWithContestId(contestId: number) {
    return await this.prisma.announcement.findMany({
      where: { show: true, contestId },
      orderBy: { id: 'desc' },
    })
  }

  async create(value: string, contestId: number | null = null) {
    return await this.prisma.announcement.create({
      data: { value: JSON.stringify(value), contestId },
    })
  }

  async delete(announcementId: number) {
    return await this.prisma.announcement.delete({
      where: { id: announcementId },
    })
  }

  async updateAnnouncementShow(announcementId: number, show: boolean) {
    return await this.prisma.announcement.update({
      where: { id: announcementId },
      data: { show },
    })
  }

  async updateAnnounce(
    announcementId: number,
    announcementInput: Prisma.AnnouncementUpdateInput
  ) {
    return await this.prisma.announcement.update({
      where: { id: announcementId },
      data: {
        ...announcementInput,
        value: JSON.stringify(announcementInput.value),
      },
    })
  }
}

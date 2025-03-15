import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/core/database/prisma.service'

import { UpdateAnnouncementSchema } from '@otog/contract'

import { WITHOUT_EXAMPLE } from '../problem/problem.service'

@Injectable()
export class BookshelfService {
  constructor(private readonly prisma: PrismaService) {}

  // async findOneById(announcementId: number) {
  //   return await this.prisma.announcement.findUnique({
  //     where: { id: announcementId },
  //   })
  // }

  async findAll() {
    return await this.prisma.bookshelf.findMany({
      orderBy: { id: 'desc' },
    })
  }

  async findProblemsOnBookshelf(bookshelfId: number) {
    return await this.prisma.problemsOnBookshelves.findMany({
      include: {
        problem: { select: WITHOUT_EXAMPLE },
      },
      where: { bookshelfId },
      orderBy: { bookshelfId: 'desc' },
    })
  }

  // async findShown() {
  //   return await this.prisma.announcement.findMany({
  //     where: { show: true, contestId: null },
  //     orderBy: { id: 'desc' },
  //   })
  // }

  // async findAllWithContestId(contestId: number) {
  //   return await this.prisma.announcement.findMany({
  //     where: { contestId },
  //     orderBy: { id: 'desc' },
  //   })
  // }

  // async findShownWithContestId(contestId: number) {
  //   return await this.prisma.announcement.findMany({
  //     where: { show: true, contestId },
  //     orderBy: { id: 'desc' },
  //   })
  // }

  // async create(value: string, contestId: number | null = null) {
  //   return await this.prisma.announcement.create({
  //     data: { value: JSON.parse(value), contestId },
  //   })
  // }

  // async delete(announcementId: number) {
  //   return await this.prisma.announcement.delete({
  //     where: { id: announcementId },
  //   })
  // }

  // async updateAnnouncementShow(announcementId: number, show: boolean) {
  //   return await this.prisma.announcement.update({
  //     where: { id: announcementId },
  //     data: { show },
  //   })
  // }

  // async updateAnnounce(
  //   announcementId: number,
  //   announcementInput: UpdateAnnouncementSchema
  // ) {
  //   return await this.prisma.announcement.update({
  //     where: { id: announcementId },
  //     data: {
  //       ...announcementInput,
  //       value: JSON.parse(announcementInput.value),
  //     },
  //   })
  // }
}

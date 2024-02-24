import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AnnouncementService {
  constructor(private readonly prisma: PrismaService) {}

  async findOneById(announcementId: number) {
    return this.prisma.announcement.findUnique({
      where: { id: announcementId },
    });
  }

  async findAll() {
    return this.prisma.announcement.findMany({
      where: { contestId: null },
      orderBy: { id: 'desc' },
    });
  }

  async findShown() {
    return this.prisma.announcement.findMany({
      where: { show: true, contestId: null },
      orderBy: { id: 'desc' },
    });
  }

  async findAllWithContestId(contestId: number) {
    return this.prisma.announcement.findMany({
      where: { contestId },
      orderBy: { id: 'desc' },
    });
  }

  async findShownWithContestId(contestId: number) {
    return this.prisma.announcement.findMany({
      where: { show: true, contestId },
      orderBy: { id: 'desc' },
    });
  }

  async create(
    value: Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue,
    contestId: number | null = null,
  ) {
    return this.prisma.announcement.create({ data: { value, contestId } });
  }

  async delete(announcementId: number) {
    return this.prisma.announcement.delete({ where: { id: announcementId } });
  }

  async updateAnnouncementShow(announcementId: number, show: boolean) {
    return this.prisma.announcement.update({
      where: { id: announcementId },
      data: { show },
    });
  }

  async updateAnnounce(
    announcementId: number,
    announcementData: Prisma.AnnouncementUpdateInput,
  ) {
    return this.prisma.announcement.update({
      where: { id: announcementId },
      data: announcementData,
    });
  }
}

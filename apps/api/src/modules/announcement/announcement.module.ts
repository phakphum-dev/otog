import { Module } from '@nestjs/common'

import { AnnouncementController } from './announcement.controller'
import { AnnouncementService } from './announcement.service'

@Module({
  providers: [AnnouncementService],
  controllers: [AnnouncementController],
})
export class AnnouncementModule {}

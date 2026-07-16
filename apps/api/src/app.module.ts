import { Module } from '@nestjs/common'

import { AppController } from './app.controller'
import { AppService } from './app.service'
import { PrismaModule } from './core/database/prisma.module'
import { AnnouncementModule } from './modules/announcement/announcement.module'
import { AuthModule } from './modules/auth/auth.module'
import { ChatModule } from './modules/chat/chat.module'
import { ContestModule } from './modules/contest/contest.module'
import { ProblemModule } from './modules/problem/problem.module'
import { SubmissionModule } from './modules/submission/submission.module'
import { UserModule } from './modules/user/user.module'

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UserModule,
    SubmissionModule,
    ProblemModule,
    ContestModule,
    ChatModule,
    AnnouncementModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

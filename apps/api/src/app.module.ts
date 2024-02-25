import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProblemModule } from './modules/problem/problem.module';
import { SubmissionModule } from './modules/submission/submission.module';
import { ContestModule } from './modules/contest/contest.module';
import { ChatModule } from './modules/chat/chat.module';
import { AnnouncementModule } from './modules/announcement/announcement.module';
import { PrismaModule } from './core/database/prisma.module';
import { S3Module } from 'nestjs-s3';
import { environment } from './env';

@Module({
  imports: [
    PrismaModule,
    S3Module.forRoot({
      config: {
        accessKeyId: environment.S3_ACCESS_KEY_ID,
        secretAccessKey: environment.S3_SECRET_ACCESS_KEY,
        endpoint: environment.S3_ENDPOINT,
        region: environment.S3_REGION,
        s3ForcePathStyle: true,
        signatureVersion: 'v4',
      },
    }),
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

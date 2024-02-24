import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProblemModule } from './modules/problem/problem.module';
import { SubmissionModule } from './modules/submission/submission.module';
import { ContestModule } from './modules/contest/contest.module';
import { ChatModule } from './modules/chat/chat.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { configuration, Configuration } from './core/config/configuration';
import { AnnouncementModule } from './modules/announcement/announcement.module';
import { PrismaModule } from './core/database/prisma.module';
import { S3Module } from 'nestjs-s3';
@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env.dev', '.env'],
      load: [configuration],
      isGlobal: true,
    }),
    PrismaModule,
    S3Module.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService<Configuration>) => {
        const config = configService.get('s3');
        return {
          config,
        };
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

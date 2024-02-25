import { Module } from '@nestjs/common';
import { ProblemController } from './problem.controller';
import { ProblemService } from './problem.service';
import { ContestModule } from '../contest/contest.module';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { SubmissionModule } from '../submission/submission.module';
import { S3Module } from 'nestjs-s3';

@Module({
  imports: [ContestModule, AuthModule, UserModule, SubmissionModule],
  controllers: [ProblemController],
  providers: [ProblemService],
  exports: [ProblemService],
})
export class ProblemModule {}
